import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseQuestionnaire } from '../scripts/build-questions.mjs';
import { validateQuestions, validateModels } from '../scripts/validate-questions.mjs';
const source = await readFile(new URL('../docs/lmti/01-questionnaire.md', import.meta.url), 'utf8');
const { bank, models } = parseQuestionnaire(source);

test('generator retains fractional positions and marks only probe opt-outs unscored', () => {
  assert.equal(bank.version, 2);
  for (const q of bank.questions) {
    assert.ok(q.options.some(o => typeof o.pos === 'number' && !Number.isInteger(o.pos)));
    assert.deepEqual(q.options.filter(o => o.depth).map(o => o.pos), q.probe ? [q.n === 8 ? 4.5 : 1.5] : []);
  }
  assert.equal(bank.questions[12].options.find(o => o.pos === 3.5).depth, undefined);
});

test('generator rejects unsupported versions and malformed option positions rather than dropping them', () => {
  assert.throws(() => parseQuestionnaire(source.replace(/^# Questionnaire v2:/, '# Questionnaire v1:')));
  for (const position of ['1e0', '0', '1.25.5', 'NaN', '6']) {
    assert.throws(() => parseQuestionnaire(source.replace('- [4.5]', `- [${position}]`)));
  }
});

test('validator rejects broken counts, probes, pairs and option permutations', () => {
  const mutations = [
    b => { b.version = 1; },
    b => { b.questions[0].options.push({ pos: 4.5, text: 'Duplicate' }); },
    b => { b.questions[0].options.push({ pos: 0, text: 'Blank must not be an option' }); },
    b => { b.questions[0].options.push({ pos: 5.5, text: 'Outside axis' }); },
    b => { b.questions[0].options.push({ pos: NaN, text: 'Invalid numeric' }); },
    b => { b.questions[0].options[0].depth = 'unscored'; },
    b => { delete b.questions[7].options.find(o => o.depth).depth; },
    b => b.questions.pop(),
    b => { b.questions[0].n = 2; },
    b => { b.questions[0].dim = 'D1'; },
    b => { b.questions[7].probe = false; },
    b => { b.questions[0].options[0].pos = 2; },
    b => { b.questions[7].options.pop(); },
    b => { b.questions[0].agent_order[0] = b.questions[0].agent_order[1]; },
    b => { b.questions[0].agent_order = [1, 2, 3, 4, 5]; },
    b => { b.pairs[0].h = 'q22'; },
    b => { b.questions[0].role = 'single'; },
    b => { b.pairs[1].dim = 'D1'; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(bank);
    mutate(changed);
    assert.throws(() => validateQuestions(changed));
  }
});

test('model validation rejects nonfinite, out-of-range and missing axes', () => {
  for (const value of [NaN, Infinity, 0, 6, undefined]) {
    const changed = structuredClone(models);
    changed[0].profile.D1 = value;
    assert.throws(() => validateModels(changed));
  }
});
