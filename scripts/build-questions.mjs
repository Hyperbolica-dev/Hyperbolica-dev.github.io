import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { shuffleOptions } from '../src/lib/lmti/shuffle.ts';
import { validateQuestions, validateModels } from './validate-questions.mjs';

function parseQuestions(markdown, assignOrder = true) {
  const questions = [...markdown.matchAll(/^### Q(\d+) \| (D\d+) \| (scene|direct)\/(\w+) \| (single|pair (P\d+) \(([SH])\)) \| probe (YES|no)(?: \| kind (choose|dislike))?\n([\s\S]*?)(?=\n### |\n## |\n---|(?![\s\S]))/gm)].map(m => {
    const body = m[10].trimEnd();
    const firstOption = body.indexOf('\n- [');
    if (firstOption < 0) throw new Error(`Missing options for Q${m[1]}`);
    const options = body.slice(firstOption + 1).split('\n').filter(line => line.trim()).map(line => {
      const option = /^- \[([1-5](?:\.[0-9]+)?|X|S|U|T)\] (.+)$/.exec(line);
      if (!option) throw new Error(`Invalid option on Q${m[1]}: ${line}`);
      const metadata = {};
      const text = option[2].replace(/ <!-- ([^>]+) -->/g, (_, annotation) => {
        for (const field of annotation.trim().split(/\s+/)) {
          const [key, value] = field.split(':');
          if (key === 'depth' && ['failed', 'unscored'].includes(value) && !metadata.depth) metadata.depth = value;
          else if (key === 'tag' && value && !metadata.tags) metadata.tags = value.split(',');
          else throw new Error(`Invalid option metadata on Q${m[1]}: ${field}`);
        }
        return '';
      });
      if (!text.trim() || /<!--|-->/.test(text)) throw new Error(`Invalid option text on Q${m[1]}`);
      return { pos: /^[XSUT]$/.test(option[1]) ? option[1] : Number(option[1]), text, ...metadata };
    });
    const question = { id: `q${m[1]}`, n: Number(m[1]), dim: m[2], frame: m[3], ...(m[9] ? { kind: m[9] } : {}), cue: m[4], role: m[7] ?? 'single', pair: m[6] ?? null, probe: m[8] === 'YES', stem: body.slice(0, firstOption), options, agent_order: [] };
    if (assignOrder) question.agent_order = shuffleOptions(question, 20261105).map(option => option.pos);
    return question;
  });
  if ([...markdown.matchAll(/^### /gm)].length !== questions.length) throw new Error('Malformed question header');
  return questions;
}

export function parseQuestionnaire(markdown) {
  const dimensions = [...markdown.matchAll(/^\| (D[1-6]) \| ([^|]+) \|/gm)].slice(0, 6).map(match => {
    const poles = new RegExp(`${match[1]} ([^/,]+) / ([^,.]+)`).exec(markdown);
    if (!poles) throw new Error(`Missing poles for ${match[1]}`);
    return { id: match[1], name: match[2].trim(), low: poles[1].trim(), high: poles[2].trim() };
  });
  const pairs = [...markdown.matchAll(/^\| (P\d+) \| (D\d+) \| Q(\d+) \| Q(\d+) \|$/gm)].map(m => ({ id: m[1], dim: m[2], s: `q${m[3]}`, h: `q${m[4]}` }));
  const questions = parseQuestions(markdown);
  const models = [...markdown.matchAll(/^\| ([a-z]+) \| ([^|]+) \| ((?:[\d.]+ \| ){5}[\d.]+) \|$/gm)].map(m => ({
    id: m[1], name: m[2].trim(), profile: Object.fromEntries(m[3].split(' | ').map((value, i) => [`D${i + 1}`, Number(value)])), provisional: true, n_submissions: 0, profile_source: 'placeholder',
  }));
  for (const match of markdown.matchAll(/<!-- profile:([a-z]+) source:(owner-run|measured) submissions:(\d+)(?: calibration:([A-Za-z0-9-]+))? -->/g)) {
    const model = models.find(model => model.id === match[1]);
    if (!model) throw new Error(`Unknown calibrated model: ${match[1]}`);
    model.profile_source = match[2];
    model.n_submissions = Number(match[3]);
    if (match[4]) model.calibration_version = match[4];
    model.provisional = !(model.calibration_version === 'LLMQ3' && model.n_submissions >= 3 && model.profile_source === 'owner-run');
  }
  const version = /^# Questionnaire v(\d+):/m.exec(markdown);
  const bank = { version: Number(version?.[1]), dimensions, pairs, questions };
  validateQuestions(bank);
  validateModels(models);
  return { bank, models };
}

export function parseChineseQuestionnaire(markdown, englishBank) {
  validateQuestions(englishBank);
  const version = /^# 问卷 v(\d+) 中文版（`LLMQ(\d+)`）$/m.exec(markdown);
  if (!version || Number(version[1]) !== englishBank.version || version[1] !== version[2]) throw new Error('Invalid Chinese questionnaire version');
  const questions = parseQuestions(markdown, false);
  if (questions.length !== englishBank.questions.length) throw new Error('Chinese question count mismatch');
  for (const [index, question] of questions.entries()) {
    const english = englishBank.questions[index];
    for (const field of ['id', 'n', 'dim', 'frame', 'cue', 'role', 'pair', 'probe']) {
      if (question[field] !== english[field]) throw new Error(`Chinese ${field} mismatch on ${english.id}`);
    }
    if ((question.kind ?? 'choose') !== (english.kind ?? 'choose')) throw new Error(`Chinese kind mismatch on ${english.id}`);
    if (question.options.length !== english.options.length) throw new Error(`Chinese option count mismatch on ${english.id}`);
    for (const option of question.options) {
      const original = english.options.find(candidate => candidate.pos === option.pos);
      if (!original || option.depth !== original.depth || JSON.stringify([...(option.tags ?? [])].sort()) !== JSON.stringify([...(original.tags ?? [])].sort())) {
        throw new Error(`Chinese option metadata mismatch on ${english.id}[${option.pos}]`);
      }
    }
    question.agent_order = [...english.agent_order];
  }
  const bank = { ...englishBank, questions };
  validateQuestions(bank);
  return bank;
}

export async function buildQuestions() {
  const source = await readFile(new URL('../docs/lmti/01-questionnaire.md', import.meta.url), 'utf8');
  const { bank, models } = parseQuestionnaire(source);
  const chineseSource = await readFile(new URL('../docs/lmti/QUESTIONNAIRE-v3.zh-CN.md', import.meta.url), 'utf8');
  const chineseBank = parseChineseQuestionnaire(chineseSource, bank);
  const target = new URL('../src/lib/lmti/data/', import.meta.url);
  await mkdir(target, { recursive: true });
  await writeFile(new URL('questions.json', target), `${JSON.stringify(bank, null, 2)}\n`);
  await writeFile(new URL('questions.zh-CN.json', target), `${JSON.stringify(chineseBank, null, 2)}\n`);
  await writeFile(new URL('models.json', target), `${JSON.stringify(models, null, 2)}\n`);
  console.log(`Generated ${bank.questions.length} questions and ${models.length} model profiles.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildQuestions();
