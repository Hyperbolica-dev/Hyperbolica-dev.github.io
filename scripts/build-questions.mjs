import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { shuffleOptions } from '../src/lib/lmti/shuffle.ts';
import { validateQuestions, validateModels } from './validate-questions.mjs';

export function parseQuestionnaire(markdown) {
  const dimensions = [...markdown.matchAll(/^\| (D[1-6]) \| ([^|]+) \|/gm)].slice(0, 6).map(match => {
    const poles = new RegExp(`${match[1]} ([^/,]+) / ([^,.]+)`).exec(markdown);
    if (!poles) throw new Error(`Missing poles for ${match[1]}`);
    return { id: match[1], name: match[2].trim(), low: poles[1].trim(), high: poles[2].trim() };
  });
  const pairs = [...markdown.matchAll(/^\| (P\d+) \| (D\d+) \| Q(\d+) \| Q(\d+) \|$/gm)].map(m => ({ id: m[1], dim: m[2], s: `q${m[3]}`, h: `q${m[4]}` }));
  const questions = [...markdown.matchAll(/^### Q(\d+) \| (D\d+) \| (scene|direct)\/(\w+) \| (single|pair (P\d+) \(([SH])\)) \| probe (YES|no)\n([\s\S]*?)(?=\n### |\n---|(?![\s\S]))/gm)].map(m => {
    const body = m[9].trimEnd();
    const firstOption = body.indexOf('\n- [');
    if (firstOption < 0) throw new Error(`Missing options for Q${m[1]}`);
    const options = body.slice(firstOption + 1).split('\n').filter(line => line.trim()).map(line => {
      const option = /^- \[([1-5](?:\.[0-9]+)?|X)\] (.+?)( <!-- depth:unscored -->)?$/.exec(line);
      if (!option) throw new Error(`Invalid option on Q${m[1]}: ${line}`);
      return { pos: option[1] === 'X' ? 'X' : Number(option[1]), text: option[2], ...(option[3] ? { depth: 'unscored' } : {}) };
    });
    const question = { id: `q${m[1]}`, n: Number(m[1]), dim: m[2], frame: m[3], cue: m[4], role: m[7] ?? 'single', pair: m[6] ?? null, probe: m[8] === 'YES', stem: body.slice(0, firstOption), options, agent_order: [] };
    question.agent_order = shuffleOptions(question, 20261105).map(option => option.pos);
    return question;
  });
  const models = [...markdown.matchAll(/^\| ([a-z]+) \| ([^|]+) \| ((?:[\d.]+ \| ){5}[\d.]+) \|$/gm)].map(m => ({
    id: m[1], name: m[2].trim(), profile: Object.fromEntries(m[3].split(' | ').map((value, i) => [`D${i + 1}`, Number(value)])), provisional: true, n_submissions: 0, profile_source: 'placeholder',
  }));
  for (const match of markdown.matchAll(/<!-- profile:([a-z]+) source:(owner-run|measured) submissions:(\d+) -->/g)) {
    const model = models.find(model => model.id === match[1]);
    if (!model) throw new Error(`Unknown calibrated model: ${match[1]}`);
    model.profile_source = match[2];
    model.n_submissions = Number(match[3]);
  }
  const version = /^# Questionnaire v(\d+):/m.exec(markdown);
  const bank = { version: Number(version?.[1]), dimensions, pairs, questions };
  validateQuestions(bank);
  validateModels(models);
  return { bank, models };
}

export async function buildQuestions() {
  const source = await readFile(new URL('../docs/lmti/01-questionnaire.md', import.meta.url), 'utf8');
  const { bank, models } = parseQuestionnaire(source);
  const target = new URL('../src/lib/lmti/data/', import.meta.url);
  await mkdir(target, { recursive: true });
  await writeFile(new URL('questions.json', target), `${JSON.stringify(bank, null, 2)}\n`);
  await writeFile(new URL('models.json', target), `${JSON.stringify(models, null, 2)}\n`);
  console.log(`Generated ${bank.questions.length} questions and ${models.length} model profiles.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildQuestions();
