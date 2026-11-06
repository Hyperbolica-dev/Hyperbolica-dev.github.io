import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createWorker, SubmissionLedger } from './index.mjs';
import bank from '../src/lib/lmti/data/questions.json' with { type: 'json' };

const ORIGIN = 'https://hyperbolica-dev.github.io';
const code = (answers = {}) => `LLMQ${bank.version}p|who=human|think=unknown|${Array.from({ length: 24 }, (_, i) => `${i + 1}=${answers[i + 1] ?? 3}`).join(';')}`;
const payload = (extra = {}) => ({ v: bank.version, code: code(), mode: 'human', who: 'human', model: '', think: 'unknown', fb: [], hp: '', ...extra });
function setup({ initialized = true } = {}) {
  let clock = Date.UTC(2026, 10, 5, 12);
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
  const rates = [];
  const env = {
    ALLOWED_ORIGIN: ORIGIN, SUBMISSIONS: kv, STATS_TOKEN: 'test-stats-secret', RATE_SALT_SECRET: 'test-rate-secret',
    DAILY_SUBMISSION_LIMIT: '1000',
    SUBMIT_RATE_LIMITER: { async limit({ key }) { rates.push(key); return { success: true }; } },
  };
  const db = new DatabaseSync(':memory:');
  const storage = {
    sql: { exec(query, ...args) {
      const result = db.prepare(query).all(...args);
      return { toArray: () => result.map((row) => ({ ...row })) };
    } },
    transactionSync(action) {
      db.exec('BEGIN');
      try { const result = action(); db.exec('COMMIT'); return result; }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    async setAlarm(time) { storage.alarm = time; },
    async deleteAlarm() { storage.alarm = null; },
  };
  const ledger = new SubmissionLedger({ storage, blockConcurrencyWhile: (action) => action() }, env);
  ledger.now = () => clock;
  if (initialized) db.exec('INSERT INTO totals (id, human, agent) VALUES (1, 0, 0)');
  let ledgerCalls = 0;
  env.SUBMISSION_LEDGER = {
    idFromName(name) { assert.equal(name, 'global-v1'); return name; },
    get() { return { fetch(input, options) { ledgerCalls++; return ledger.fetch(new Request(input, options)); } }; },
  };
  const worker = createWorker({ now: () => clock, crypto: webcrypto });
  const send = (body = payload(), options = {}) => {
    const { method = 'POST', path = '/', headers = {}, raw, origin = ORIGIN } = options;
    return worker.fetch(new Request(`https://quiz.example${path}`, {
      method,
      headers: { ...(origin === null ? {} : { Origin: origin }), 'Content-Type': 'text/plain', 'CF-Connecting-IP': '192.0.2.1', ...headers },
      ...(['GET', 'HEAD', 'OPTIONS'].includes(method) ? {} : { body: raw ?? JSON.stringify(body) }),
    }), env);
  };
  return { send, rows, writes, lists, rates, env, ledger, db, storage, ledgerCalls: () => ledgerCalls, advance: (ms) => { clock += ms; } };
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

test('v3 non-answer choices retain per-question membership and reject old codes', async () => {
  for (const token of ['S', 'U', 'T']) {
    assert.equal((await setup().send(payload({ code: code({ 11: token }) }))).status, 200);
    assert.equal((await setup().send(payload({ code: code({ 4: token }) }))).status, 400);
  }
  assert.equal((await setup().send(payload({ code: code({ 1: 'U' }) }))).status, 400);
  assert.equal((await setup().send(payload({ code: code({ 24: 'T' }) }))).status, 200);
  assert.equal((await setup().send(payload({ v: 2, code: code().replace('LLMQ3p', 'LLMQ2p') }))).status, 400);
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

test('questionnaire language is validated, stored privately and part of retry identity', async () => {
  for (const language of ['en', 'zh-CN']) {
    const s = setup();
    const body = payload({ language, submissionId: '12345678-1234-4234-8234-123456789abc' });
    assert.equal((await s.send(body)).status, 200);
    assert.equal(JSON.parse(s.writes[0].value).language, language);
    assert.equal((await s.send({ ...body, language: language === 'en' ? 'zh-CN' : 'en' })).status, 409);
    assert.deepEqual(await (await s.send(null, { method: 'GET', path: '/counts' })).json(), { human: 1, agent: 0 });
  }
  for (const language of ['', 'zh', 'fr', null, 1, {}]) {
    const s = setup();
    assert.equal((await s.send(payload({ language }))).status, 400);
    assert.equal(s.writes.length, 0);
  }
});

test('human duration is optional, bounded and stored privately without client timestamps', async () => {
  for (const durationMs of [undefined, 0, 1, 123_456, 604_799_999, 604_800_000]) {
    const s = setup();
    const body = payload({ durationMs, startedAt: 1, completedAt: 2 });
    const response = await s.send(body);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    const row = JSON.parse(s.writes[0].value);
    assert.equal(row.durationMs, durationMs);
    assert.equal(Object.hasOwn(row, 'durationMs'), durationMs !== undefined);
    assert.equal(Object.hasOwn(row, 'startedAt'), false);
    assert.equal(Object.hasOwn(row, 'completedAt'), false);
    const counts = await s.send(null, { method: 'GET', path: '/counts' });
    assert.deepEqual(await counts.json(), { human: 1, agent: 0 });
  }
});

test('human duration rejects malformed and out-of-bounds values before storage', async () => {
  for (const durationMs of [-1, 0.5, 604_800_001, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, -Infinity, null, '1000', true, {}, []]) {
    const s = setup();
    const response = await s.send(payload({ durationMs }));
    assert.equal(response.status, 400, String(durationMs));
    assert.deepEqual(await response.json(), { error: 'invalid' });
    assert.equal(s.writes.length, 0);
    assert.equal(s.ledgerCalls(), 0);
  }
  // JSON numeric overflow reaches validation as Infinity, rather than JSON.stringify's null.
  const s = setup();
  assert.equal((await s.send(null, { raw: JSON.stringify(payload()).replace(/}$/, ',"durationMs":1e999}') })).status, 400);
  assert.equal(s.writes.length, 0);
});

test('agent durations are ignored regardless of type and never persisted', async () => {
  for (const durationMs of [0, 12_345, 604_800_001, -1, null, '1000', {}]) {
    const s = setup();
    assert.equal((await s.send(payload({ mode: 'agent', who: 'human', durationMs }))).status, 200);
    assert.equal(Object.hasOwn(JSON.parse(s.writes[0].value), 'durationMs'), false);
  }
  const s = setup();
  assert.equal((await s.send(payload({ mode: 'human', who: 'claude', durationMs: 500 }))).status, 200);
  assert.equal(JSON.parse(s.writes[0].value).durationMs, 500);
});

test('frozen human duration stays stable on retry and participates in payload identity', async () => {
  const s = setup();
  const submissionId = '12345678-1234-4234-8234-123456789abc';
  const body = payload({ submissionId, durationMs: 42_000 });
  assert.equal((await s.send(body)).status, 200);
  s.advance(60_000);
  assert.equal((await s.send(body)).status, 200);
  assert.equal(s.writes.length, 1);
  assert.equal(JSON.parse(s.writes[0].value).durationMs, 42_000);
  assert.equal((await s.send({ ...body, durationMs: 42_001 })).status, 409);
  assert.equal(s.writes.length, 1);
});

test('native rate limit precedes body reads and storage, without persisting IP identifiers', async () => {
  const s = setup();
  s.env.SUBMIT_RATE_LIMITER.limit = async ({ key }) => {
    assert.match(key, /^[a-f0-9]{64}$/);
    return { success: false };
  };
  const blocked = await s.send(null, { raw: '{' });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('Retry-After'), '60');
  assert.equal(s.ledgerCalls(), 0);
  assert.equal(s.writes.length, 0);
  const allowed = setup();
  await allowed.send();
  allowed.advance(86_400_000);
  await allowed.send();
  assert.notEqual(allowed.rates[0], allowed.rates[1]);
  assert.ok(allowed.writes.every(({ key }) => key.startsWith('submission:')));
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
  for (const field of ['RATE_SALT_SECRET', 'SUBMISSIONS', 'SUBMISSION_LEDGER', 'SUBMIT_RATE_LIMITER', 'DAILY_SUBMISSION_LIMIT']) {
    const s = setup();
    delete s.env[field];
    assert.equal((await s.send()).status, 503);
  }
  const missingIp = setup();
  assert.equal((await missingIp.send(payload(), { headers: { 'CF-Connecting-IP': '' } })).status, 503);
  assert.equal(missingIp.writes.length, 0);
  const s = setup();
  s.env.SUBMISSIONS.put = async () => { throw new Error('private infrastructure detail'); };
  const response = await s.send();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'unavailable' });
  assert.equal(s.writes.length, 0);
});

test('optional nickname is normalized and human-only, bounded in Unicode code points', async () => {
  for (const nickname of [undefined, '', '  \u0000\u200b\u202e  ', '😀'.repeat(32), '  Alice\u0000\u200b  ']) {
    const s = setup();
    assert.equal((await s.send(payload({ nickname }))).status, 200);
    const row = JSON.parse(s.writes[0].value);
    assert.equal(row.nickname, nickname?.includes('Alice') ? 'Alice' : nickname?.startsWith('😀') ? nickname : undefined);
  }
  for (const nickname of ['😀'.repeat(33), null, 42]) {
    const s = setup();
    assert.equal((await s.send(payload({ nickname }))).status, 400);
    assert.equal(s.writes.length, 0);
  }
  const s = setup();
  assert.equal((await s.send(payload({ mode: 'agent', nickname: 'private'.repeat(100) }))).status, 200);
  assert.equal(Object.hasOwn(JSON.parse(s.writes[0].value), 'nickname'), false);
});

test('public counts use mode, include bootstrap, expose fixed aggregate fields and cache query variants', async () => {
  const s = setup({ initialized: false });
  const seed = { human: 12, agent: 4, day: '2026-11-05', used: 4 };
  const bootstrap = () => s.send(seed, { path: '/admin/bootstrap', origin: null, headers: { Authorization: 'Bearer test-stats-secret' } });
  assert.equal((await s.send()).status, 503);
  assert.equal((await s.send(seed, { path: '/admin/bootstrap', origin: null })).status, 401);
  assert.equal((await bootstrap()).status, 200);
  assert.equal((await bootstrap()).status, 409);
  await s.send(payload({ mode: 'agent', who: 'human', nickname: 'never public' }));
  const response = await s.send(null, { method: 'GET', path: '/counts?random=1', origin: null });
  assert.deepEqual(await response.json(), { human: 12, agent: 5 });
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=60');
  s.advance(30_000);
  const calls = s.ledgerCalls();
  const cached = await s.send(null, { method: 'GET', path: '/counts?random=2' });
  assert.equal(cached.status, 200);
  assert.equal(cached.headers.get('Cache-Control'), 'public, max-age=30');
  assert.equal(s.ledgerCalls(), calls);
  assert.equal(s.lists.length, 0);
  s.advance(30_001);
  await s.send(null, { method: 'GET', path: '/counts' });
  assert.equal(s.ledgerCalls(), calls + 1);
});

test('unbootstrapped or unavailable counts fail closed, never fall back to a KV scan', async () => {
  const s = setup({ initialized: false });
  assert.equal((await s.send(null, { method: 'GET', path: '/counts' })).status, 503);
  assert.equal(s.lists.length, 0);
  for (const seed of [
    { human: -1, agent: 4, used: 0, day: '2026-11-05' },
    { human: 1, agent: 4, used: 6, day: '2026-11-05' },
    { human: 1, agent: 4, used: 0, day: '2026-11-04' },
  ]) {
    assert.equal((await s.send(seed, { path: '/admin/bootstrap', headers: { Authorization: 'Bearer test-stats-secret' } })).status, 400);
  }
});

test('serialized daily budget survives concurrent calls and resets only at UTC midnight', async () => {
  const s = setup();
  s.env.DAILY_SUBMISSION_LIMIT = '2';
  const responses = await Promise.all(Array.from({ length: 8 }, (_, index) => s.send(payload({ nickname: `person ${index}` }))));
  assert.equal(responses.filter(({ status }) => status === 200).length, 2);
  assert.equal(responses.filter(({ status }) => status === 429).length, 6);
  assert.equal(s.writes.length, 2);
  assert.deepEqual(s.db.prepare('SELECT human, agent FROM totals').get().human, 2);
  s.advance(86_400_000);
  assert.equal((await s.send(payload({ nickname: 'next day' }))).status, 200);
});

test('retry UUID commits once; reuse with changed payload conflicts; legacy payloads also deduplicate', async () => {
  const s = setup();
  const submissionId = '81e2a758-2728-49e6-bf12-55e8fa21de7a';
  const responses = await Promise.all([s.send(payload({ submissionId })), s.send(payload({ submissionId }))]);
  assert.ok(responses.every(({ status }) => status === 200));
  assert.equal(s.writes.length, 1);
  assert.equal((await s.send(payload({ submissionId, nickname: 'changed' }))).status, 409);
  assert.equal((await s.send(payload({ submissionId: 'invalid' }))).status, 400);
  assert.equal(s.db.prepare('SELECT human FROM totals').get().human, 1);
  const legacy = setup();
  await legacy.send();
  await legacy.send();
  assert.equal(legacy.writes.length, 1);
});

test('ambiguous KV failure leaves durable recovery and consumes budget without false success', async () => {
  const s = setup();
  s.env.DAILY_SUBMISSION_LIMIT = '1';
  const original = s.env.SUBMISSIONS.put;
  s.env.SUBMISSIONS.put = async (...args) => { await original(...args); throw new Error('ack lost'); };
  assert.equal((await s.send()).status, 503);
  assert.equal(s.rows.size, 1);
  assert.equal(s.db.prepare('SELECT human FROM totals').get().human, 0);
  assert.ok(s.storage.alarm);
  assert.equal((await s.send(payload({ nickname: 'different' }))).status, 429);
  s.env.SUBMISSIONS.put = original;
  await s.ledger.alarm();
  assert.equal(s.rows.size, 1);
  assert.equal(s.db.prepare('SELECT human FROM totals').get().human, 1);
  assert.equal((await s.send()).status, 200);
  assert.equal(s.rows.size, 1);
});

test('SQL failure after KV success rolls back counts and retry heals without duplicates', async () => {
  const s = setup();
  const original = s.storage.sql.exec;
  let fail = true;
  s.storage.sql.exec = (query, ...args) => {
    if (fail && query.startsWith('UPDATE receipts SET body')) throw new Error('SQL unavailable');
    return original(query, ...args);
  };
  assert.equal((await s.send()).status, 503);
  assert.equal(s.rows.size, 1);
  assert.equal(s.db.prepare('SELECT human FROM totals').get().human, 0);
  fail = false;
  assert.equal((await s.send()).status, 200);
  assert.equal(s.rows.size, 1);
  assert.equal(s.db.prepare('SELECT human FROM totals').get().human, 1);
});

test('ledger restart resumes its durable outbox and bootstrap budget is not reset', async () => {
  const s = setup({ initialized: false });
  s.env.DAILY_SUBMISSION_LIMIT = '5';
  assert.equal((await s.send({ human: 2, agent: 2, used: 4, day: '2026-11-05' }, {
    path: '/admin/bootstrap', headers: { Authorization: 'Bearer test-stats-secret' },
  })).status, 200);
  const put = s.env.SUBMISSIONS.put;
  s.env.SUBMISSIONS.put = async () => { throw new Error('outage'); };
  assert.equal((await s.send()).status, 503);
  const restarted = new SubmissionLedger({ storage: s.storage, blockConcurrencyWhile: (action) => action() }, s.env);
  restarted.now = s.ledger.now;
  s.env.SUBMISSIONS.put = put;
  await restarted.alarm();
  assert.equal(s.rows.size, 1);
  assert.equal(s.db.prepare('SELECT human FROM totals').get().human, 3);
  assert.equal((await s.send(payload({ nickname: 'another' }))).status, 429);
});

test('native limiter errors and malformed results fail closed before storage', async () => {
  for (const limit of [async () => { throw new Error('unavailable'); }, async () => ({}), async () => null]) {
    const s = setup();
    s.env.SUBMIT_RATE_LIMITER.limit = limit;
    assert.equal((await s.send()).status, 503);
    assert.equal(s.ledgerCalls(), 0);
    assert.equal(s.writes.length, 0);
  }
});
