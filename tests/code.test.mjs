import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { decodeReply, encodeResult } from '../src/lib/lmti/code.ts';
import { shuffleOptions, shuffleQuestions } from '../src/lib/lmti/shuffle.ts';
import { generateAgentPrompt } from '../src/lib/lmti/agent.ts';
const bank = JSON.parse(await readFile(new URL('../src/lib/lmti/data/questions.json', import.meta.url)));
const entries = (value = 'A') => bank.questions.map(q => `${q.n}=${value}`).join(';');

test('agent letters map each fixed option, Z maps blank', () => {
  for (let index = 0; index < Math.max(...bank.questions.map(q => q.agent_order.length)); index++) {
    const code = bank.questions.map(q => `${q.n}=${index < q.agent_order.length ? String.fromCharCode(65 + index) : 'Z'}`).join(';');
    const result = decodeReply(`LLMQ2a|${code}`, bank);
    assert.equal(result.ok, true);
    for (const q of bank.questions) assert.equal(result.answers[q.id], q.agent_order[index] ?? 0);
  }
  const blank = decodeReply(`LLMQ2a|${entries('Z')}`, bank);
  assert.equal(blank.ok, true);
  assert.ok(Object.values(blank.answers).every(value => value === 0));
});

test('prose, fences, mixed case, whitespace, commas and multiline are accepted', () => {
  const code = entries('a').replaceAll(';', ',\n').replaceAll('=', ' = ');
  const result = decodeReply(`Here is my answer:\n\`\`\`text\nllmq2A | model = Example 2 | think = HIGH | ${code}\n\`\`\`\nThanks!`, bank);
  assert.equal(result.ok, true);
  assert.equal(result.model, 'Example 2');
  assert.equal(result.think, 'high');
  assert.equal(result.multiple, false);
});

test('first code wins and warns when multiple prefixes occur', () => {
  const result = decodeReply(`LLMQ2a|${entries()}\nExplanation\nLLMQ2a|${entries('Z')}`, bank);
  assert.equal(result.ok, true);
  assert.equal(result.multiple, true);
  assert.equal(result.answers.q1, bank.questions[0].agent_order[0]);
});

test('missing, invalid, duplicate and out-of-range entries are never scored', () => {
  const result = decodeReply(`LLMQ2a|${entries().replace('5=A;', '').replace('7=A', '7=Y')};3=B;25=A`, bank);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'answers');
  assert.deepEqual(result.missing, [5]);
  assert.deepEqual(result.invalid, [{ q: 7, value: 'Y' }, { q: 25, value: 'A' }]);
  assert.deepEqual(result.duplicates, [3]);
  for (const prefix of ['LLMQ1a', 'LLMQ1p', 'LLMQ3a']) assert.equal(decodeReply(`${prefix}|${entries()}`, bank).error, 'version');
  assert.equal(decodeReply('not a code', bank).error, 'format');
  assert.equal(decodeReply(`LLMQ2p|${entries('X')}`, bank).ok, false);
  assert.equal(decodeReply(`LLMQ2a|${entries('AA')}`, bank).ok, false);
});

test('canonical positional codes round-trip, sanitize metadata and omit notes', () => {
  const answers = Object.fromEntries(bank.questions.map(q => [q.id, q.probe ? 'X' : q.n % 6]));
  const code = encodeResult(answers, { who: 'other', think: 'nonsense', model: 'Example|bad;=\nname' });
  assert.match(code, /^LLMQ2p\|who=other\|think=unknown\|model=Examplebadname\|1=/);
  const result = decodeReply(code, bank);
  assert.equal(result.ok, true);
  assert.deepEqual(result.answers, answers);
  assert.equal(result.think, 'unknown');
  assert.equal(result.model, 'Examplebadname');
});

test('shuffle is stable, nonmutating, a permutation and never axis-ordered', () => {
  for (const q of bank.questions) {
    const original = structuredClone(q.options);
    for (let seed = 0; seed < 100; seed++) {
      const options = shuffleOptions(q, seed);
      assert.deepEqual(options, shuffleOptions(q, seed));
      assert.deepEqual(options.map(o => String(o.pos)).sort(), original.map(o => String(o.pos)).sort());
      const numeric = options.map(o => o.pos).filter(p => p !== 'X');
      assert.equal(numeric.every((p, i) => i === 0 || p > numeric[i - 1]), false);
      assert.equal(numeric.every((p, i) => i === 0 || p < numeric[i - 1]), false);
    }
    assert.deepEqual(q.options, original);
  }
});

test('seeded prompts retain question identities and letters across question permutations', () => {
  const original = structuredClone(bank);
  const orders = new Set();
  for (const seed of [0, 1, 42, 123456789]) {
    const questions = shuffleQuestions(bank, seed);
    assert.deepEqual(questions, shuffleQuestions(bank, seed));
    assert.deepEqual(questions.map(q => q.n).sort((a, b) => a - b), bank.questions.map(q => q.n));
    orders.add(questions.map(q => q.n).join(','));
    const prompt = generateAgentPrompt(bank, seed);
    const sections = prompt.split('\n\n').filter(section => /^\d+\./.test(section));
    assert.deepEqual(sections.map(section => Number(/^(\d+)\./.exec(section)[1])), questions.map(q => q.n));
    const answers = [];
    for (const [index, section] of sections.entries()) {
      const q = questions[index];
      const letters = [...section.matchAll(/^([A-Y])\. (.+)$/gm)];
      assert.deepEqual(letters.map(([, , text]) => text), q.agent_order.map(pos => q.options.find(o => o.pos === pos).text));
      const chosen = q.options.find(o => typeof o.pos === 'number' && !Number.isInteger(o.pos));
      answers.push(`${q.n}=${letters[q.agent_order.indexOf(chosen.pos)][1]}`);
    }
    const decoded = decodeReply(`LLMQ2a|${answers.join(';')}`, bank);
    assert.equal(decoded.ok, true);
    for (const q of questions) assert.equal(decoded.answers[q.id], q.options.find(o => typeof o.pos === 'number' && !Number.isInteger(o.pos)).pos);
    assert.doesNotMatch(prompt, /\b(?:D[1-6]|P[1-6]|probe|dimension|scoring|agent_order|depth:unscored)\b/i);
  }
  assert.ok(orders.size > 1);
  assert.deepEqual(bank, original);
  assert.deepEqual([...generateAgentPrompt(bank).matchAll(/^(\d+)\. /gm)].map(m => Number(m[1])), bank.questions.map(q => q.n));
});

test('fractional position codes round-trip every bank option and reject unlisted or malformed values', () => {
  for (let index = 0; index < Math.max(...bank.questions.map(q => q.options.length)); index++) {
    const answers = Object.fromEntries(bank.questions.map(q => [q.id, q.options[index]?.pos ?? 0]));
    const result = decodeReply(encodeResult(answers, { who: 'human', think: 'off' }), bank);
    assert.equal(result.ok, true);
    assert.deepEqual(result.answers, answers);
  }
  for (const value of ['1.25', '2.5', '0.5', '5.5', 'NaN', 'Infinity', '1e0', '+1', '01', '.5', '1.', '0.0']) {
    const result = decodeReply(`LLMQ2p|${entries('1').replace(/^1=1;/, `1=${value};`)}`, bank);
    assert.equal(result.ok, false, value);
    assert.deepEqual(result.invalid, [{ q: 1, value }]);
  }
  const equivalent = decodeReply(`LLMQ2p|${entries('1').replace(/^1=1;/, '1=4.50;')}`, bank);
  assert.equal(equivalent.ok, true);
  assert.equal(equivalent.answers.q1, 4.5);
  assert.equal(decodeReply(`LLMQ2p|${entries('1')}`, { ...bank, version: 1 }).error, 'version');
});
