import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createWorker } from './index.mjs';
import bank from '../src/lib/lmti/data/questions.json' with { type: 'json' };

const ORIGIN = 'https://hyperbolica-dev.github.io';
const code = (answers = {}) => `LLMQ${bank.version}p|who=human|think=unknown|${Array.from({ length: 24 }, (_, i) => `${i + 1}=${answers[i + 1] ?? 3}`).join(';')}`;
const payload = (extra = {}) => ({ v: bank.version, code: code(), mode: 'human', who: 'human', model: '', think: 'unknown', fb: [], hp: '', ...extra });
function setup() {
  let clock = Date.UTC(2026, 10, 5, 12);
  let id = 0;
  const rows = new Map();
  const writes = [];
  const lists = [];
  const kv = {
    async get(key, type) {
      const row = rows.get(key);
      if (!row || (row.expires !== undefined && row.expires <= clock)) return null;
      return type === 'json' ? JSON.parse(row.value) : row.value;
    },
    async put(key, value, options = {}) {
      writes.push({ key, value, options });
      rows.set(key, { value, expires: options.expirationTtl ? clock + options.expirationTtl * 1000 : undefined });
    },
    async list(options) {
      lists.push(options);
      const keys = [...rows.keys()].filter((key) => key.startsWith(options.prefix));
      const start = Number(options.cursor || 0);
      return { keys: keys.slice(start, start + 1).map((name) => ({ name })), list_complete: start + 1 >= keys.length, cursor: String(start + 1) };
    },
  };
  const env = { ALLOWED_ORIGIN: ORIGIN, SUBMISSIONS: kv, STATS_TOKEN: 'test-stats-secret', RATE_SALT_SECRET: 'test-rate-secret' };
  const worker = createWorker({ now: () => clock, crypto: { subtle: webcrypto.subtle, randomUUID: () => `test-${++id}` } });
  const send = (body = payload(), options = {}) => {
    const { method = 'POST', path = '/', headers = {}, raw, origin = ORIGIN } = options;
    return worker.fetch(new Request(`https://quiz.example${path}`, {
      method,
      headers: { ...(origin === null ? {} : { Origin: origin }), 'Content-Type': 'text/plain', 'CF-Connecting-IP': '192.0.2.1', ...headers },
      ...(['GET', 'HEAD', 'OPTIONS'].includes(method) ? {} : { body: raw ?? JSON.stringify(body) }),
    }), env);
  };
  return { send, rows, writes, lists, env, advance: (ms) => { clock += ms; } };
}

test('origin, routes, methods and preflight are exact', async () => {
  const s = setup();
  for (const origin of [null, 'null', 'https://evil.example', `${ORIGIN}.evil.example`]) {
    const response = await s.send(payload(), { origin });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
  assert.equal((await s.send(null, { method: 'GET' })).status, 405);
  assert.equal((await s.send(null, { path: '/other' })).status, 404);
  const good = await s.send(null, { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  assert.equal(good.status, 204);
  assert.equal(good.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.equal(good.headers.get('Access-Control-Allow-Methods'), 'POST');
  assert.equal((await s.send(null, { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'DELETE' } })).status, 405);
  assert.equal((await s.send(null, { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Authorization' } })).status, 400);
  assert.equal(s.writes.length, 0);
});

test('body cap applies to bytes, declared sizes, malformed JSON and media types', async () => {
  const base = JSON.stringify(payload());
  assert.equal((await setup().send(null, { raw: base.padEnd(4096, ' ') })).status, 200);
  for (const raw of [base.padEnd(4097, ' '), base + ' '.repeat(4000), '{', 'null', '[]', `${base}${'é'.repeat(2048)}`]) {
    const s = setup();
    assert.equal((await s.send(null, { raw })).status, 400);
    assert.equal(s.writes.length, 0);
  }
  for (const headers of [{ 'Content-Length': '4097' }, { 'Content-Length': 'invalid' }, { 'Content-Type': 'application/json' }]) {
    assert.equal((await setup().send(payload(), { headers })).status, 400);
  }
  assert.equal((await setup().send(payload(), { headers: { 'Content-Type': 'text/plain;charset=UTF-8' } })).status, 200);
});

test('payload rejects invalid boundaries with a generic response and no writes', async () => {
  const invalid = [
    { v: 99 }, { v: '2' }, { mode: 'robot' }, { who: 'unknown' }, { think: 'max' }, { model: null },
    { model: 'a'.repeat(41) }, { hp: 'bot' }, { hp: null }, { fb: null },
    { fb: Array.from({ length: 25 }, (_, i) => ({ q: i + 1, text: '' })) },
    { fb: [{ q: 0, text: '' }] }, { fb: [{ q: 25, text: '' }] }, { fb: [{ q: 1.5, text: '' }] },
    { fb: [{ q: 1, text: 3 }] }, { fb: [{ q: 1, text: 'a'.repeat(301) }] },
    { fb: [{ q: 1, text: '' }, { q: 1, text: 'duplicate' }] },
    { code: code().replace(`LLMQ${bank.version}p`, `LLMQ${bank.version}a`) }, { code: code({ 1: 'X' }) },
    { code: code().replace('24=3', '23=3') }, { code: code().replace(';24=3', '') },
    { code: code() + ';25=3' }, { code: code().replace('1=3;', '01=3;') },
    { code: code({ 1: 6 }) }, { code: code().replace('who=human', 'who=bad') },
    { code: code().replace('think=unknown', 'think=high|think=low') },
  ];
  for (const patch of invalid) {
    const s = setup();
    const response = await s.send(payload(patch));
    assert.equal(response.status, 400, JSON.stringify(patch));
    assert.deepEqual(await response.json(), { error: 'invalid' });
    assert.equal(s.writes.length, 0);
  }
});

test('versioned fractional choices must belong to the question bank', async () => {
  for (const question of bank.questions) {
    for (const option of question.options.filter(({ pos }) => typeof pos === 'number' && !Number.isInteger(pos))) {
      assert.equal((await setup().send(payload({ code: code({ [question.n]: option.pos }) }))).status, 200);
    }
  }
  assert.equal((await setup().send(payload({ code: code({ 1: 1.12345 }) }))).status, 400);
  assert.equal((await setup().send(payload({ v: 1, code: code().replace(`LLMQ${bank.version}p`, 'LLMQ1p') }))).status, 400);
});

test('valid enums, blank/probe choices, Unicode limits and sanitized model persist only the contract', async () => {
  for (const who of ['human', 'claude', 'gpt', 'gemini', 'grok', 'deepseek', 'qwen', 'kimi', 'mistral', 'other']) {
    const s = setup();
    const response = await s.send(payload({ who, mode: 'agent', model: `\u0000${'😀'.repeat(40)}\u007f`, code: code({ 1: 0, 8: 'X', 12: 'X', 13: 'X', 14: 'X' }), fb: [{ q: 1, text: '😀'.repeat(300), private: 'discard' }], extra: 'discard' }));
    assert.deepEqual(await response.json(), { ok: true });
    const row = JSON.parse(s.writes.find((write) => write.key.startsWith('submission:')).value);
    assert.deepEqual(Object.keys(row).sort(), ['ts', 'code', 'mode', 'who', 'model', 'think', 'fb'].sort());
    assert.equal(row.model, '😀'.repeat(40));
    assert.deepEqual(Object.keys(row.fb[0]), ['q', 'text']);
    assert.equal(row.ts, '2026-11-05T12:00:00.000Z');
    assert.equal(JSON.stringify(s.writes).includes('192.0.2.1'), false);
    assert.equal(JSON.stringify(s.writes).includes('test-rate-secret'), false);
  }
  for (const think of ['off', 'low', 'medium', 'high', 'unknown']) assert.equal((await setup().send(payload({ think }))).status, 200);
  const s = setup();
  assert.equal((await s.send(payload({ fb: Array.from({ length: 24 }, (_, i) => ({ q: i + 1, text: '' })) }))).status, 200);
});

test('rate key expires after 60 seconds and rotates by UTC day without persistent IP identifiers', async () => {
  const s = setup();
  assert.equal((await s.send()).status, 200);
  const first = s.writes[0];
  assert.match(first.key, /^rate:[a-f0-9]{64}$/);
  assert.deepEqual(first.options, { expirationTtl: 60 });
  s.advance(59_999);
  const blocked = await s.send();
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('Retry-After'), '60');
  s.advance(1);
  assert.equal((await s.send()).status, 200);
  assert.equal(s.writes[2].key, first.key);
  s.advance(86_400_000);
  assert.equal((await s.send()).status, 200);
  assert.notEqual(s.writes[4].key, first.key);
  assert.equal(s.writes.filter((write) => write.key.startsWith('submission:')).length, 3);
});

test('stats require the secret, paginate only submissions and disclose counts only', async () => {
  const s = setup();
  await s.send();
  s.advance(60_000);
  await s.send(payload({ who: 'claude' }));
  for (const path of ['/stats', '/stats?token=wrong']) {
    assert.equal((await s.send(null, { method: 'GET', path, origin: null })).status, 401);
  }
  assert.equal(s.lists.length, 0);
  const response = await s.send(null, { method: 'GET', path: '/stats?token=test-stats-secret', origin: null });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body, { counts: { human: 1, claude: 1, gpt: 0, gemini: 0, grok: 0, deepseek: 0, qwen: 0, kimi: 0, mistral: 0, other: 0 } });
  assert.equal(s.lists.length, 2);
  assert.ok(s.lists.every((call) => call.prefix === 'submission:'));
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  s.env.STATS_TOKEN = '';
  assert.equal((await s.send(null, { method: 'GET', path: '/stats?token=', origin: null })).status, 401);
});

test('missing prerequisites and KV failures fail closed without leaking details', async () => {
  for (const field of ['RATE_SALT_SECRET', 'SUBMISSIONS']) {
    const s = setup();
    delete s.env[field];
    assert.equal((await s.send()).status, 503);
  }
  const missingIp = setup();
  assert.equal((await missingIp.send(payload(), { headers: { 'CF-Connecting-IP': '' } })).status, 503);
  assert.equal(missingIp.writes.length, 0);
  const s = setup();
  s.env.SUBMISSIONS.get = async () => { throw new Error('private infrastructure detail'); };
  const response = await s.send();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'unavailable' });
  assert.equal(s.writes.length, 0);
});
