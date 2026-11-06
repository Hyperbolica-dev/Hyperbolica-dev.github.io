import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreAnswers } from '../src/lib/lmti/scoring.ts';
import { readFile } from 'node:fs/promises';
import { parseQuestionnaire } from '../scripts/build-questions.mjs';
const dimensions = Array.from({ length: 6 }, (_, i) => ({ id: `D${i + 1}` }));
const question = (id, extra = {}) => ({ id, n: Number(id.slice(1)), dim: 'D1', frame: 'scene', options: [1, 2, 2.5, 3, 4, 5, 'X', 'S', 'U', 'T'].map(pos => ({ pos })), ...extra });
const bank = (questions, pairs = []) => ({ version: 3, dimensions, questions, pairs });
const model = (id, value) => ({ id, name: id, profile: Object.fromEntries(dimensions.map(d => [d.id, value])) });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test('single choose uses normalized Gaussian support and grid mode, not a minimum-answer gate', () => {
  const result = scoreAnswers({ q1: 2.5 }, bank([question('q1')]), [model('match', 2.5)]);
  const weights = Array.from({ length: 17 }, (_, i) => Math.exp(-0.5 * ((1 + i / 4 - 2.5) / 0.65) ** 2));
  const sum = weights.reduce((a, b) => a + b, 0);
  result.distributions.D1.forEach((value, i) => near(value, weights[i] / sum));
  assert.equal(result.dimensions.D1, 2.5);
  assert.equal(result.distributions.D2, null);
  assert.equal(result.matches[0].similarity, 100);
});

test('dislikes multiply local penalties into the mean choose support; direct answers do not enter it', () => {
  const questions = [question('q1'), question('q2'), question('q3', { kind: 'dislike' }), question('q4', { kind: 'dislike' }), question('q5', { frame: 'direct' })];
  const result = scoreAnswers({ q1: 1, q2: 4, q3: 3, q4: 3, q5: 5 }, bank(questions), []);
  const weights = Array.from({ length: 17 }, (_, i) => {
    const x = 1 + i / 4;
    return (Math.exp(-0.5 * ((x - 1) / 0.65) ** 2) + Math.exp(-0.5 * ((x - 4) / 0.65) ** 2)) / 2 * (1 - 0.8 * Math.exp(-0.5 * ((x - 3) / 0.65) ** 2));
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  result.distributions.D1.forEach((value, i) => near(value, weights[i] / sum));
});

test('dislike-only middle has endpoint modes, breaks symmetric tie downward and disfavors middle model', () => {
  const result = scoreAnswers({ q1: 3 }, bank([question('q1', { kind: 'dislike' })]), [model('middle', 3), model('high', 5), model('low', 1)]);
  assert.equal(result.dimensions.D1, 1);
  assert.deepEqual(result.matches.map(m => m.id), ['high', 'low', 'middle']);
  assert.equal(result.matches[0].similarity, 100);
  assert.ok(result.matches[2].similarity < 50);
});

test('matching interpolates support, clamps model positions, and averages logarithms across active axes', () => {
  const result = scoreAnswers({ q1: 1, q2: 5 }, bank([question('q1'), question('q2', { dim: 'D2' })]), [model('fraction', 2.125), model('outside', -1)]);
  for (const match of result.matches) {
    const x = match.id === 'fraction' ? 2.125 : 1;
    const offset = (x - 1) * 4;
    const i = Math.floor(offset);
    const ratios = ['D1', 'D2'].map(dim => {
      const s = result.distributions[dim];
      return (s[i] * (1 - offset + i) + s[Math.min(i + 1, 16)] * (offset - i)) / Math.max(...s);
    });
    near(match.distance, -(Math.log(ratios[0]) + Math.log(ratios[1])) / 2);
    assert.equal(match.similarity, Math.round(100 * Math.sqrt(ratios[0] * ratios[1])));
  }
});

test('exact distance precedes rounded similarity; equal distance breaks by ID not name', () => {
  const result = scoreAnswers({ q1: 3 }, bank([question('q1')]), [{ ...model('a', 3), name: 'Zulu' }, { ...model('b', 3), name: 'Alpha' }, model('c', 3.001)]);
  assert.deepEqual(result.matches.map(m => m.id), ['a', 'b', 'c']);
  assert.equal(result.matches[2].similarity, 100);
});

test('non-numeric tokens and invalid inputs never invent profiles, Mask or probe credit', () => {
  const b = bank([question('q1', { probe: true }), question('q2', { frame: 'direct' })], [{ id: 'P1', dim: 'D1', s: 'q1', h: 'q2' }]);
  for (const value of [0, 'S', 'U', 'T', undefined, NaN, Infinity, -1, 6, 1.25]) {
    const result = scoreAnswers({ q1: value, q2: 5 }, b, [model('m', 3)]);
    assert.equal(result.dimensions.D1, null);
    assert.deepEqual(result.matches, []);
    assert.equal(result.mask, null);
    assert.equal(result.depth.scored, 0);
  }
});

test('probe numeric failures and opt-outs preserve numeric axes; X fails without an axis', () => {
  const q = question('q1', { probe: true });
  q.options.find(o => o.pos === 2).depth = 'failed';
  q.options.find(o => o.pos === 4).depth = 'unscored';
  for (const [value, outcome, scored] of [[2, 'failed', 1], [4, 'unscored', 0], [3, 'passed', 1], ['X', 'failed', 1]]) {
    const result = scoreAnswers({ q1: value }, bank([q]), []);
    assert.equal(result.depth.probes[0].result, outcome);
    assert.equal(result.depth.scored, scored);
    assert.equal(result.dimensions.D1, typeof value === 'number' ? value : null);
  }
});

test('Mask retains fractional signed shifts and excludes missing halves at threshold boundaries', () => {
  const b = bank([question('q1'), question('q2', { frame: 'direct' }), question('q3')], [{ id: 'P1', dim: 'D1', s: 'q1', h: 'q2' }, { id: 'P2', dim: 'D1', s: 'q3', h: 'missing' }]);
  const result = scoreAnswers({ q1: 2.5, q2: 1, q3: 5 }, b, [], { steady: 0.7, some: 1.5, closeCallPoints: 3 });
  assert.equal(result.mask, 1.5);
  assert.equal(result.maskLabel, 'some');
  assert.equal(result.pairs[0].shift, -1.5);
  assert.equal(result.pairs[1].gap, null);
});

test('subscores use eligible numeric answers versus bank-wide denominators without counting U or T as skips', () => {
  const questions = [question('q1'), question('q2'), question('q3'), question('q4')];
  for (const q of questions) q.options.find(o => o.pos === 2).tags = ['hedge', 'delegate'];
  const b = bank(questions);
  const result = scoreAnswers({ q1: 2, q2: 3, q3: 'U', q4: 'T' }, b, []);
  assert.deepEqual(result.subscores, { hesitation: { count: 1, total: 2 }, delegation: { count: 1, total: 4 }, skips: { count: 0, total: 4 } });
  assert.equal(scoreAnswers({ q3: 'S' }, b, []).subscores.skips.count, 1);
});

test('polished options distinguish unknown, evasive skip, explicit feeling and raw AI delegation', async () => {
  const { bank: questionnaire } = parseQuestionnaire(await readFile(new URL('../docs/lmti/01-questionnaire.md', import.meta.url), 'utf8'));
  const result = scoreAnswers({ q3: 3.5, q7: 'U', q8: 'S', q9: 4.5, q10: 'U', q21: 5, q22: 5 }, questionnaire, []);
  assert.equal(result.dimensions.D1, null);
  assert.equal(result.dimensions.D2, 3.5);
  assert.equal(result.dimensions.D3, null);
  assert.equal(result.dimensions.D6, 4.5);
  assert.equal(result.mask, null);
  assert.equal(result.depth.scored, 0);
  assert.deepEqual(result.subscores.skips, { count: 1, total: questionnaire.questions.filter(q => q.options.some(o => o.pos === 'S')).length });
  assert.deepEqual(result.subscores.delegation, { count: 1, total: questionnaire.questions.filter(q => q.options.some(o => o.tags?.includes('delegate'))).length });
});
