import bank from '../src/lib/lmti/data/questions.json' with { type: 'json' };
export { SubmissionLedger } from './ledger.mjs';

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
  let nickname;
  if (mode === 'human' && value.nickname !== undefined) {
    if (typeof value.nickname !== 'string') return null;
    nickname = value.nickname.replace(/[\p{Cc}\p{Cf}]/gu, '').trim();
    if ([...nickname].length > 32) return null;
  }
  if (value.submissionId !== undefined
    && (typeof value.submissionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.submissionId))) return null;
  const seen = new Set();
  const notes = [];
  for (const item of fb) {
    if (!item || typeof item !== 'object' || !Number.isInteger(item.q) || item.q < 1 || item.q > 24
      || seen.has(item.q) || typeof item.text !== 'string' || [...item.text].length > 300) return null;
    seen.add(item.q);
    notes.push({ q: item.q, text: item.text });
  }
  return { code, mode, who, model: sanitizedModel, think, fb: notes, ...(nickname ? { nickname } : {}) };
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
  let countsCache;
  let countsPending;
  const ledger = (env) => env.SUBMISSION_LEDGER.get(env.SUBMISSION_LEDGER.idFromName('global-v1'));
  async function rate(request, env, scope) {
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip || !env.RATE_SALT_SECRET || !env.SUBMIT_RATE_LIMITER) throw new Error('unavailable');
    const key = await crypto.subtle.importKey('raw', encoder.encode(env.RATE_SALT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const day = new Date(now()).toISOString().slice(0, 10);
    const identifier = hex(await crypto.subtle.sign('HMAC', key, encoder.encode(`${scope}\n${day}\n${ip}`)));
    const result = await env.SUBMIT_RATE_LIMITER.limit({ key: identifier });
    if (typeof result?.success !== 'boolean') throw new Error('unavailable');
    return result.success;
  }
  async function publicCounts(request, env) {
    if (countsCache && countsCache.expires > now()) return countsCache;
    if (countsPending) return countsPending;
    countsPending = (async () => {
      // Ignore query strings and Origin in the internal cache key. Rebuild public
      // CORS headers for each caller rather than caching a caller's Origin.
      const key = new Request(new URL('/counts', request.url).href);
      const cache = globalThis.caches?.default;
      let cached = await cache?.match(key);
      if (cached && !(Number(cached.headers.get('X-Counts-Expires')) > now())) cached = undefined;
      const response = cached || await ledger(env).fetch('https://ledger/counts');
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      if (!Number.isSafeInteger(data.human) || data.human < 0 || !Number.isSafeInteger(data.agent) || data.agent < 0) throw new Error('unavailable');
      const counts = { human: data.human, agent: data.agent };
      const expires = cached ? Number(cached.headers.get('X-Counts-Expires')) : now() + 60_000;
      if (!cached && cache) await cache.put(key, Response.json(counts, {
        headers: { 'Cache-Control': 'public, max-age=60', 'X-Counts-Expires': String(expires) },
      }));
      countsCache = { data: counts, expires };
      return countsCache;
    })();
    try { return await countsPending; } finally { countsPending = undefined; }
  }
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
      if (url.pathname === '/counts') {
        if (request.method !== 'GET') return reply(405, { error: 'method' }, { Allow: 'GET' });
        if (!env.SUBMISSION_LEDGER) return reply(503, { error: 'unavailable' });
        try {
          if (!await rate(request, env, 'counts')) return reply(429, { error: 'rate' }, { 'Retry-After': '60' });
          const cached = await publicCounts(request, env);
          return reply(200, cached.data, { 'Cache-Control': `public, max-age=${Math.max(0, Math.floor((cached.expires - now()) / 1000))}` });
        } catch { return reply(503, { error: 'unavailable' }); }
      }
      if (url.pathname === '/admin/bootstrap' && request.method === 'POST') {
        const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
        if (!await authorized(token, env.STATS_TOKEN)) return reply(401, { error: 'auth' });
        if (!env.SUBMISSION_LEDGER) return reply(503, { error: 'unavailable' });
        let seed;
        try { seed = await readBody(request); } catch { return reply(400, { error: 'invalid' }); }
        try {
          const response = await ledger(env).fetch('https://ledger/bootstrap', { method: 'POST', body: JSON.stringify(seed) });
          return reply(response.status, await response.json());
        } catch { return reply(503, { error: 'unavailable' }); }
      }
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
      if (!env.SUBMISSIONS || !env.SUBMISSION_LEDGER || !/^[1-9]\d*$/.test(env.DAILY_SUBMISSION_LIMIT || '')
        || !Number.isSafeInteger(Number(env.DAILY_SUBMISSION_LIMIT))) return reply(503, { error: 'unavailable' });
      try {
        // Native rate limiting runs before reading a body or accessing storage.
        if (!await rate(request, env, 'submit')) return reply(429, { error: 'rate' }, { 'Retry-After': '60' });
      } catch { return reply(503, { error: 'unavailable' }); }
      let raw, payload;
      try { raw = await readBody(request); payload = validate(raw); } catch { return reply(400, { error: 'invalid' }); }
      if (!payload) return reply(400, { error: 'invalid' });
      try {
        const digest = hex(await hash(JSON.stringify(payload)));
        // Legacy clients have no retry UUID. Identical sanitized legacy payloads
        // are intentionally deduplicated while the ledger is retained.
        const id = raw.submissionId?.toLowerCase() || `legacy-${digest}`;
        const response = await ledger(env).fetch('https://ledger/submit', {
          method: 'POST', body: JSON.stringify({ id, digest, payload }),
        });
        return reply(response.status, await response.json(), response.status === 429 ? { 'Retry-After': '60' } : {});
      } catch { return reply(503, { error: 'unavailable' }); }
    },
  };
}

export default createWorker();
