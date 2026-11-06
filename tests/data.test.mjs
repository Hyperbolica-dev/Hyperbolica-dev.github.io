import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseQuestionnaire, parseChineseQuestionnaire } from '../scripts/build-questions.mjs';
import { validateQuestions, validateModels } from '../scripts/validate-questions.mjs';
const source = await readFile(new URL('../docs/llmq/01-questionnaire.md', import.meta.url), 'utf8');
const { bank, models } = parseQuestionnaire(source);
const chineseSource = await readFile(new URL('../docs/llmq/QUESTIONNAIRE-v3.zh-CN.md', import.meta.url), 'utf8');

test('translation rejects mismatched headers, positions, metadata and malformed content', () => {
  const mutations = [
    text => text.replace('v3 中文版', 'v2 中文版'),
    text => text.replace('Q1 | D3', 'Q1 | D4'),
    text => text.replace('scene/habit', 'scene/now'),
    text => text.replace('### Q1 |', '### broken Q1 |'),
    text => text.replace('- [1]', '- [1.5]'),
    text => text.replace('- [1]', '- [1e0]'),
    text => text.replace('<!-- tag:delegate -->', ''),
    text => text.replace('<!-- depth:failed -->', '<!-- depth:unscored -->'),
    text => text.replace('<!-- tag:delegate -->', '<!-- tag:delegate'),
    text => text.replace(/^- \[1\].*\n/m, ''),
    text => text.replace(/^- \[1\].*$/m, '- [1]   '),
    text => `${text}\n### Q25 | malformed\n`,
  ];
  for (const mutate of mutations) assert.throws(() => parseChineseQuestionnaire(mutate(chineseSource), bank));
});

test('translation matches options by position and preserves agent letters when source options move', () => {
  const reordered = chineseSource.replace(/(^- \[1\].*\n)(^- \[2\].*\n)/m, '$2$1');
  const translated = parseChineseQuestionnaire(reordered, bank);
  const original = parseChineseQuestionnaire(chineseSource, bank);
  assert.deepEqual(translated.questions[0].agent_order, bank.questions[0].agent_order);
  for (const position of bank.questions[0].agent_order) {
    assert.deepEqual(translated.questions[0].options.find(o => o.pos === position), original.questions[0].options.find(o => o.pos === position));
  }
});

test('unknown can occur outside sticker questions, but stickers remain restricted', () => {
  const changed = structuredClone(bank);
  const q = changed.questions[0];
  q.options.push({ pos: 'U', text: 'Unknown' });
  q.agent_order.push('U');
  validateQuestions(changed);
  q.options.at(-1).pos = 'T';
  q.agent_order[q.agent_order.length - 1] = 'T';
  assert.throws(() => validateQuestions(changed));
});

test('unsupported versions and malformed option positions cannot be silently dropped', () => {
  for (const version of [1, 2, 4]) assert.throws(() => parseQuestionnaire(source.replace(/^# Questionnaire v3:/m, `# Questionnaire v${version}:`)));
  for (const position of ['1e0', '0', '1.25.5', 'NaN', '6', 'E']) {
    assert.throws(() => parseQuestionnaire(source.replace(/^- \[1\]/m, `- [${position}]`)));
  }
});

test('question validation rejects broken counts, pairs, metadata, tokens and option permutations', () => {
  const mutations = [
    b => { b.version = 2; },
    b => { b.questions[0].options.push({ ...b.questions[0].options[0] }); },
    b => { b.questions[0].options.push({ pos: 0, text: 'Blank must not be a lettered option' }); },
    b => { b.questions[0].options[0].pos = 5.5; },
    b => { b.questions[0].options[0].pos = NaN; },
    b => { b.questions[0].kind = 'avoid'; },
    b => { b.questions[0].options[0].tags = ['unknown']; },
    b => { b.questions[0].options[0].tags = ['hedge', 'hedge']; },
    b => { b.questions.find(q => !q.probe).options[0].depth = 'failed'; },
    b => { b.questions.find(q => q.probe).options[0].depth = 'passed'; },
    b => b.questions.pop(),
    b => { b.questions[0].n = 2; },
    b => { b.questions[0].dim = 'D7'; },
    b => { b.questions.find(q => q.probe).probe = false; },
    b => { b.questions[0].options[0].pos = 'E'; },
    b => { b.questions[0].agent_order[0] = b.questions[0].agent_order[1]; },
    b => { b.questions[0].agent_order = [1, 2, 3, 4, 5]; },
    b => { b.pairs[0].h = b.pairs[1].h; },
    b => { b.questions.find(q => q.role === 'S').role = 'single'; },
    b => { b.pairs[1].dim = b.pairs[0].dim; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(bank);
    mutate(changed);
    assert.throws(() => validateQuestions(changed));
  }
});

test('generator parses dislike, multiple option tags and numeric probe failures without exposing annotations', () => {
  const q = bank.questions.find(q => q.probe);
  const header = new RegExp(`(^### Q${q.n} \\|[^\\n]*? \\| probe YES)(?: \\| kind (?:choose|dislike))?$`, 'm');
  const changed = source.replace(header, '$1 | kind dislike').replace(new RegExp(`(^### Q${q.n} [\\s\\S]*?\\n)- \\[1\\] [^\\n]+`, 'm'), '$1- [1] Example <!-- depth:failed tag:hedge,delegate -->');
  const parsed = parseQuestionnaire(changed).bank.questions.find(item => item.id === q.id);
  assert.equal(parsed.kind, 'dislike');
  assert.deepEqual(parsed.options.find(o => o.pos === 1), { pos: 1, text: 'Example', depth: 'failed', tags: ['hedge', 'delegate'] });
});

test('calibration adequacy requires owner-run, current version, recorded language and three real submissions', () => {
  const id = models[0].id;
  const clean = source.replace(new RegExp(`<!-- profile:${id} [^>]+-->`, 'g'), '');
  for (const [origin, count, version, language, provisional] of [['owner-run', 3, 'LLMQ3', 'zh-CN', false], ['owner-run', 3, 'LLMQ3', 'en', false], ['owner-run', 3, 'LLMQ3', undefined, true], ['owner-run', 2, 'LLMQ3', 'en', true], ['owner-run', 30, 'LLMQ2', 'en', true], ['measured', 3, 'LLMQ3', 'en', true], ['owner-run', 3, undefined, 'en', true]]) {
    const annotation = `<!-- profile:${id} source:${origin} submissions:${count}${version ? ` calibration:${version}` : ''}${language ? ` language:${language}` : ''} -->`;
    const parsed = parseQuestionnaire(`${clean}\n${annotation}\n`).models.find(m => m.id === id);
    assert.equal(parsed.provisional, provisional);
    assert.equal(parsed.n_submissions, count);
    assert.equal(parsed.calibration_version, version);
    assert.equal(parsed.calibration_language, language);
  }
});

test('model validation rejects nonfinite, out-of-range, missing axes and invalid calibration metadata', () => {
  for (const value of [NaN, Infinity, 0, 6, undefined]) {
    const changed = structuredClone(models);
    changed[0].profile.D1 = value;
    assert.throws(() => validateModels(changed));
  }
  for (const fields of [{ calibration_version: 3 }, { calibration_version: '' }, { calibration_language: 'fr' }, { calibration_language: null }, { n_submissions: -1 }, { n_submissions: 1.5 }, { profile_source: 'invented' }]) {
    const changed = structuredClone(models);
    Object.assign(changed[0], fields);
    assert.throws(() => validateModels(changed));
  }
});
