import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { decodeReply, encodeResult } from '../src/lib/llmq/code.ts';
import { shuffleOptions, shuffleQuestions } from '../src/lib/llmq/shuffle.ts';
import { generateAgentPrompt } from '../src/lib/llmq/agent.ts';
const bank = JSON.parse(await readFile(new URL('../src/lib/llmq/data/questions.json', import.meta.url)));
const entries = (value = 'A') => bank.questions.map(q => `${q.n}=${value}`).join(';');

test('every bank option round-trips through both positional and fixed-letter codes', () => {
  for (let index = 0; index < Math.max(...bank.questions.map(q => q.options.length)); index++) {
    const answers = Object.fromEntries(bank.questions.map(q => [q.id, q.options[index]?.pos ?? 0]));
    const letters = bank.questions.map(q => `${q.n}=${q.options[index] ? String.fromCharCode(65 + q.agent_order.indexOf(q.options[index].pos)) : 'Z'}`).join(';');
    for (const code of [encodeResult(answers, { who: 'human', think: 'off' }), `LLMQ3a|${letters}`]) {
      const result = decodeReply(code, bank);
      assert.equal(result.ok, true);
      assert.deepEqual(result.answers, answers);
    }
  }
  assert.ok(Object.values(decodeReply(`LLMQ3a|${entries('Z')}`, bank).answers).every(v => v === 0));
});

test('published Q5 agent letters retain their meanings when explicit refusal is added', () => {
  const published = [4, 5, 3, 1, 2, 4.5, 'S'];
  for (const [index, expected] of [...published, 'R'].entries()) {
    const letter = String.fromCharCode(65 + index);
    const decoded = decodeReply(`LLMQ3a|${entries('Z').replace('5=Z;', `5=${letter};`)}`, bank);
    assert.equal(decoded.ok, true);
    assert.equal(decoded.answers.q5, expected);
  }
});

test('fences, case, whitespace, commas and multiline work; first code wins', () => {
  const code = entries('a').replaceAll(';', ',\n').replaceAll('=', ' = ');
  const result = decodeReply(`Here:\n\`\`\`text\nllmq3A | model = Example 2 | think = HIGH | ${code}\n\`\`\`\nThanks!\nLLMQ3a|${entries('Z')}`, bank);
  assert.equal(result.ok, true);
  assert.equal(result.model, 'Example 2');
  assert.equal(result.think, 'high');
  assert.equal(result.multiple, true);
  assert.equal(result.answers.q1, bank.questions[0].agent_order[0]);
});

test('missing, duplicate, malformed and out-of-bank answers reject the entire code', () => {
  const result = decodeReply(`LLMQ3a|${entries().replace('5=A;', '').replace('7=A', '7=Y')};3=B;25=A`, bank);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [5]);
  assert.deepEqual(result.invalid, [{ q: 7, value: 'Y' }, { q: 25, value: 'A' }]);
  assert.deepEqual(result.duplicates, [3]);
  for (const prefix of ['LLMQ1a', 'LLMQ2p', 'LLMQ2a', 'LLMQ4a', 'LLMQ3']) assert.equal(decodeReply(`${prefix}|${entries()}`, bank).error, 'version');
  assert.equal(decodeReply('not a code', bank).error, 'format');
  assert.equal(decodeReply(`LLMQ3a|${entries('AA')}`, bank).ok, false);
  assert.equal(decodeReply(`LLMQ3p|${entries('1')}`, { ...bank, version: 2 }).error, 'version');
  for (const value of ['0.5', '5.5', 'NaN', 'Infinity', '1e0', '+1', '01', '.5', '1.', '0.0', 'E', '1 trailing prose']) {
    const decoded = decodeReply(`LLMQ3p|${entries('1').replace(/^1=1;/, `1=${value};`)}`, bank);
    assert.equal(decoded.ok, false, value);
    assert.deepEqual(decoded.invalid, [{ q: 1, value }]);
  }
});

test('U T S R X require membership and decimal equivalence preserves numeric answers', () => {
  for (const token of ['U', 'T', 'S', 'R', 'X']) {
    const decoded = decodeReply(`LLMQ3p|${entries(token.toLowerCase())}`, bank);
    const missing = bank.questions.filter(q => !q.options.some(o => o.pos === token));
    if (missing.length) assert.deepEqual(decoded.invalid.map(v => v.q), missing.map(q => q.n));
    else assert.equal(decoded.ok, true);
  }
  const q = bank.questions.find(q => q.options.some(o => typeof o.pos === 'number' && !Number.isInteger(o.pos)));
  const value = q.options.find(o => typeof o.pos === 'number' && !Number.isInteger(o.pos)).pos;
  const decoded = decodeReply(`LLMQ3p|${bank.questions.map(item => `${item.n}=${item === q ? value.toFixed(2) : 0}`).join(';')}`, bank);
  assert.equal(decoded.ok, true);
  assert.equal(decoded.answers[q.id], value);
});

test('encoding sanitizes delimiter metadata and maps unknown thinking levels', () => {
  const result = decodeReply(encodeResult({}, { who: 'other', think: 'nonsense', model: 'Example|bad;=\nname' }), bank);
  assert.equal(result.ok, true);
  assert.equal(result.think, 'unknown');
  assert.equal(result.model, 'Examplebadname');
});

test('shuffle preserves token choices, never mutates and avoids numeric axis ordering', () => {
  const original = structuredClone(bank);
  for (const q of bank.questions) {
    for (let seed = 0; seed < 100; seed++) {
      const options = shuffleOptions(q, seed);
      assert.deepEqual(options, shuffleOptions(q, seed));
      assert.deepEqual(options.map(o => String(o.pos)).sort(), q.options.map(o => String(o.pos)).sort());
      const numeric = options.map(o => o.pos).filter(p => typeof p === 'number');
      assert.equal(numeric.every((p, i) => i === 0 || p > numeric[i - 1]), false);
      assert.equal(numeric.every((p, i) => i === 0 || p < numeric[i - 1]), false);
    }
  }
  assert.deepEqual(bank, original);
});

test('seeded prompts retain identities and option letters through permutations without leaking scoring metadata', () => {
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
      answers.push(`${q.n}=${letters[0][1]}`);
    }
    const decoded = decodeReply(`LLMQ3a|${answers.join(';')}`, bank);
    assert.equal(decoded.ok, true);
    for (const q of questions) assert.equal(decoded.answers[q.id], q.agent_order[0]);
    assert.doesNotMatch(prompt, /\b(?:D[1-6]|P[1-6]|probe|dimension|scoring|agent_order|depth:|tag:)\b/i);
  }
  assert.ok(orders.size > 1);
  assert.deepEqual(bank, original);
});
