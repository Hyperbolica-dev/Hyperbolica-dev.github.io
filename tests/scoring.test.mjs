import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { scoreAnswers } from '../src/lib/lmti/scoring.ts';
const bank = JSON.parse(await readFile(new URL('../src/lib/lmti/data/questions.json', import.meta.url)));
const models = JSON.parse(await readFile(new URL('../src/lib/lmti/data/models.json', import.meta.url)));
const fill = value => Object.fromEntries(bank.questions.map(q => [q.id, value]));
const profile = value => Object.fromEntries(bank.dimensions.map(d => [d.id, value]));
const model = (id, value) => ({ id, name: id, profile: profile(value), provisional: true, n_submissions: 0 });

test('uniform endpoints score every scene, depth and mask', () => {
  for (const value of [1, 5]) {
    const result = scoreAnswers(fill(value), bank, models);
    assert.deepEqual(result.dimensions, profile(value));
    assert.equal(result.depth.passed, 4);
    assert.equal(result.depth.scored, 4);
    assert.equal(result.mask, 0);
    assert.equal(result.maskLabel, 'steady');
    assert.deepEqual(result.traits.map(t => t.dim), ['D1', 'D2']);
    // GPT squared distances: all-1 = 28.75; all-5 = 24.75; n=6.
    const gpt = result.matches.find(m => m.id === 'gpt');
    const distance = Math.sqrt(value === 1 ? 28.75 : 24.75);
    assert.equal(gpt.distance, distance);
    assert.equal(gpt.similarity, Math.round(100 * (1 - distance / (4 * Math.sqrt(6)))));
  }
});

test('mixed means exclude direct twins; signed pair shifts remain visible', () => {
  const answers = fill(3);
  Object.assign(answers, { q4: 1, q10: 2, q14: 3, q21: 5, q7: 5, q22: 1 });
  const result = scoreAnswers(answers, bank, models);
  // D1=(1+2+3)/3=2; D2=(3+5+3)/3=11/3; Mask=(3+4)/6.
  assert.equal(result.dimensions.D1, 2);
  assert.equal(result.dimensions.D2, 11 / 3);
  assert.equal(result.mask, 7 / 6);
  assert.equal(result.maskLabel, 'some');
  assert.equal(result.pairs[0].shift, 3);
  assert.equal(result.pairs[1].shift, -4);
});

test('decoys fail depth without pulling means toward zero', () => {
  const answers = fill(5);
  bank.questions.filter(q => q.probe).forEach(q => { answers[q.id] = 'X'; });
  const result = scoreAnswers(answers, bank, models);
  assert.deepEqual(result.dimensions, profile(5));
  assert.equal(result.depth.passed, 0);
  assert.equal(result.depth.scored, 4);
  assert.ok(result.depth.probes.every(p => p.result === 'failed'));
});

test('null dimensions reduce matching n and all blank gives no matches', () => {
  const answers = fill(0);
  answers.q4 = 1;
  const result = scoreAnswers(answers, bank, [model('one', 5)]);
  // Only D1: d=|1-5|=4, denominator=4*sqrt(1)=4 -> 0%.
  assert.equal(result.matches[0].distance, 4);
  assert.equal(result.matches[0].similarity, 0);
  assert.equal(result.dimensions.D2, null);
  assert.equal(result.mask, null);
  assert.equal(result.depth.scored, 0);
  const blank = scoreAnswers(fill(0), bank, models);
  assert.deepEqual(blank.matches, []);
  assert.deepEqual(blank.traits, []);
  assert.equal(blank.closeCall, false);
});

test('missing pair halves do not enter Mask denominator', () => {
  const answers = fill(0);
  Object.assign(answers, { q10: 1, q21: 5, q7: 5, q1: 1, q20: 0 });
  const result = scoreAnswers(answers, bank, []);
  assert.equal(result.mask, 4);
  assert.equal(result.maskLabel, 'big');
  assert.equal(result.pairs[1].s, 5);
  assert.equal(result.pairs[1].h, null);
  assert.equal(result.pairs[1].gap, null);
  assert.equal(result.pairs[1].shift, null);
});

test('Mask threshold endpoints are inclusive for the middle label', () => {
  const answers = fill(3);
  answers.q21 = 4; // mean gap=1/6, tune thresholds to hit exact equality.
  assert.equal(scoreAnswers(answers, bank, [], { steady: 1 / 6, some: 1 / 6, closeCallPoints: 3 }).maskLabel, 'some');
  assert.equal(scoreAnswers(answers, bank, [], { steady: 0, some: 0.1, closeCallPoints: 3 }).maskLabel, 'big');
});

test('ranking ties use distance then alphabetical and close-call is inclusive', () => {
  const answers = fill(0); answers.q4 = 3;
  // n=1: distances .12 and .24 yield rounded similarities 97 and 94.
  const ranked = scoreAnswers(answers, bank, [model('Z', 3.12), model('A', 3.24)]);
  assert.deepEqual(ranked.matches.map(m => m.similarity), [97, 94]);
  assert.equal(ranked.closeCall, true);
  assert.equal(scoreAnswers(answers, bank, [model('Z', 3.12), model('A', 3.28)]).closeCall, false);
  assert.deepEqual(scoreAnswers(answers, bank, [model('Z', 3), model('A', 3)]).matches.map(m => m.id), ['A', 'Z']);
  assert.deepEqual(scoreAnswers(answers, bank, [model('A', 3.01), model('Z', 3)]).matches.map(m => m.id), ['Z', 'A']);
});

test('fractions contribute proportionally to dimensions, signed Mask shifts and matches', () => {
  const answers = fill(0);
  Object.assign(answers, { q3: 2.5, q7: 3.5, q13: 3.5, q22: 1.5 });
  const result = scoreAnswers(answers, bank, [model('near', 3), model('far', 5)]);
  // D2 = (2.5 + 3.5 + 3.5) / 3 = 19/6; only P2 is valid, shift = -2.
  assert.equal(result.dimensions.D2, 19 / 6);
  assert.equal(result.dimensions.D1, null);
  assert.equal(result.pairs[1].shift, -2);
  assert.equal(result.mask, 2);
  assert.equal(result.depth.passed, 1);
  assert.equal(result.depth.scored, 1);
  assert.deepEqual(result.matches.map(m => m.id), ['near', 'far']);
  assert.ok(Math.abs(result.matches[0].distance - 1 / 6) < 1e-12);
  assert.equal(result.matches[0].similarity, 96);
});

test('probe opt-outs affect their existing axes but never award Depth reading credit', () => {
  const answers = fill(0);
  Object.assign(answers, { q8: 4.5, q12: 1.5, q13: 1.5, q14: 1.5 });
  const result = scoreAnswers(answers, bank, []);
  assert.deepEqual(result.dimensions, { D1: 1.5, D2: 1.5, D3: 4.5, D4: null, D5: 1.5, D6: null });
  assert.equal(result.depth.passed, 0);
  assert.equal(result.depth.scored, 0);
  assert.ok(result.depth.probes.every(p => p.result === 'unscored'));
  answers.q8 = 'X';
  answers.q13 = 3.5;
  const mixed = scoreAnswers(answers, bank, []);
  assert.equal(mixed.depth.passed, 1);
  assert.equal(mixed.depth.scored, 2);
});

test('unlisted, nonfinite and out-of-range numbers cannot affect scores or Mask', () => {
  for (const invalid of [1.25, NaN, Infinity, -1, 6]) {
    const answers = fill(0);
    Object.assign(answers, { q10: invalid, q21: 5, q14: invalid });
    const result = scoreAnswers(answers, bank, []);
    assert.equal(result.dimensions.D1, null);
    assert.equal(result.mask, null);
    assert.equal(result.depth.scored, 0);
    assert.deepEqual(result.matches, []);
  }
});
