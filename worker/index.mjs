import bank from '../src/lib/lmti/data/questions.json' with { type: 'json' };

const WHO = ['human', 'claude', 'gpt', 'gemini', 'grok', 'deepseek', 'qwen', 'kimi', 'mistral', 'other'];
const THINK = ['off', 'low', 'medium', 'high', 'unknown'];
const MAX_BODY = 4096;
const encoder = new TextEncoder();
const clean = (text) => text.replace(/\p{Cc}/gu, '');

function validCode(code) {
  if (typeof code !== 'string') return false;
  const parts = code.split('|');
  if (parts[0] !== `LLMQ${bank.version}p` || parts.length < 4 || parts.length > 5) return false;
  const metadata = new Map();
  for (const part of parts.slice(1, -1)) {
    const match = /^(who|think|model)=([^|;\p{Cc}]*)$/u.exec(part);
    if (!match || metadata.has(match[1])) return false;
    metadata.set(match[1], match[2]);
  }
  if (!WHO.includes(metadata.get('who')) || !THINK.includes(metadata.get('think'))) return false;
  if (metadata.has('model') && [...metadata.get('model')].length > 40) return false;
  const entries = parts.at(-1).split(';');
  if (entries.length !== 24) return false;
  const seen = new Set();
  for (const entry of entries) {
    const match = /^([1-9]|1[0-9]|2[0-4])=(0|[1-5](?:\.\d+)?|X)$/.exec(entry);
    if (!match || seen.has(match[1])) return false;
    const value = match[2] === 'X' ? 'X' : Number(match[2]);
    const question = bank.questions[Number(match[1]) - 1];
    if (String(value) !== match[2] || (value !== 0 && !question.options.some(({ pos }) => pos === value))) return false;
    seen.add(match[1]);
  }
  return true;
}

function validate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { v, code, mode, who, model, think, fb, hp } = value;
  if (v !== bank.version || !validCode(code) || !['human', 'agent'].includes(mode) || !WHO.includes(who)
    || typeof model !== 'string' || !THINK.includes(think) || hp !== ''
    || !Array.isArray(fb) || fb.length > 24) return null;
  const sanitizedModel = clean(model);
  if ([...sanitizedModel].length > 40) return null;
  const seen = new Set();
  const notes = [];
  for (const item of fb) {
    if (!item || typeof item !== 'object' || !Number.isInteger(item.q) || item.q < 1 || item.q > 24
      || seen.has(item.q) || typeof item.text !== 'string' || [...item.text].length > 300) return null;
    seen.add(item.q);
    notes.push({ q: item.q, text: item.text });
  }
  return { code, mode, who, model: sanitizedModel, think, fb: notes };
}

async function readBody(request) {
  const declared = request.headers.get('Content-Length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY)) throw new Error('body');
  if (!request.body) throw new Error('body');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        throw new Error('body');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

const hex = (bytes) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');

// Dependencies are injectable for deterministic tests; production uses Worker globals.
export function createWorker({ crypto = globalThis.crypto, now = Date.now } = {}) {
  async function hash(text) { return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text))); }
  async function authorized(token, secret) {
    if (!token || !secret) return false;
    const [left, right] = await Promise.all([hash(token), hash(secret)]);
    let different = 0;
    for (let i = 0; i < left.length; i++) different |= left[i] ^ right[i];
    return different === 0;
  }
  return {
    async fetch(request, env) {
      const origin = request.headers.get('Origin');
      const cors = origin && origin === env.ALLOWED_ORIGIN
        ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : { Vary: 'Origin' };
      const reply = (status, data, extra = {}) => new Response(data === null ? null : JSON.stringify(data), {
        status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
      });
      const url = new URL(request.url);
      // Non-browser administrators may query stats; submissions always require the configured origin.
      if (origin && origin !== env.ALLOWED_ORIGIN) return reply(403, { error: 'origin' });
      if (url.pathname === '/stats' && request.method === 'GET') {
        if (!await authorized(url.searchParams.get('token'), env.STATS_TOKEN)) return reply(401, { error: 'auth' });
        if (!env.SUBMISSIONS) return reply(503, { error: 'unavailable' });
        try {
          const counts = Object.fromEntries(WHO.map((who) => [who, 0]));
          let cursor;
          do {
            const page = await env.SUBMISSIONS.list({ prefix: 'submission:', ...(cursor ? { cursor } : {}) });
            for (const key of page.keys) {
              const row = await env.SUBMISSIONS.get(key.name, 'json');
              if (row && Object.hasOwn(counts, row.who)) counts[row.who]++;
            }
            if (page.list_complete) break;
            if (!page.cursor || page.cursor === cursor) throw new Error('cursor');
            cursor = page.cursor;
          } while (true);
          return reply(200, { counts });
        } catch { return reply(503, { error: 'unavailable' }); }
      }
      if (url.pathname !== '/') return reply(404, { error: 'not_found' });
      if (!origin || origin !== env.ALLOWED_ORIGIN) return reply(403, { error: 'origin' });
      if (request.method === 'OPTIONS') {
        if (request.headers.get('Access-Control-Request-Method') !== 'POST') return reply(405, { error: 'method' });
        const headers = (request.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map((h) => h.trim()).filter(Boolean);
        if (headers.some((h) => h !== 'content-type')) return reply(400, { error: 'invalid' });
        return reply(204, null, { 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' });
      }
      if (request.method !== 'POST') return reply(405, { error: 'method' }, { Allow: 'POST, OPTIONS' });
      if (!/^text\/plain(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type') || '')) return reply(400, { error: 'invalid' });
      let payload;
      try { payload = validate(await readBody(request)); } catch { return reply(400, { error: 'invalid' }); }
      if (!payload) return reply(400, { error: 'invalid' });
      const ip = request.headers.get('CF-Connecting-IP');
      if (!env.SUBMISSIONS || !env.RATE_SALT_SECRET || !ip) return reply(503, { error: 'unavailable' });
      try {
        const timestamp = now();
        const day = new Date(timestamp).toISOString().slice(0, 10);
        const key = await crypto.subtle.importKey('raw', encoder.encode(env.RATE_SALT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const rateKey = `rate:${hex(await crypto.subtle.sign('HMAC', key, encoder.encode(`${day}\n${ip}`)))}`;
        const previous = await env.SUBMISSIONS.get(rateKey);
        if (previous !== null && timestamp - Number(previous) < 60_000) return reply(429, { error: 'rate' }, { 'Retry-After': '60' });
        await env.SUBMISSIONS.put(rateKey, String(timestamp), { expirationTtl: 60 });
        await env.SUBMISSIONS.put(`submission:${crypto.randomUUID()}`, JSON.stringify({ ts: new Date(timestamp).toISOString(), ...payload }));
        return reply(200, { ok: true });
      } catch { return reply(503, { error: 'unavailable' }); }
    },
  };
}

export default createWorker();
