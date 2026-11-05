import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateQuestions(bank) {
  requireCondition(bank.version === 2, 'Unsupported question-bank version');
  requireCondition(bank.dimensions.length === 6 && new Set(bank.dimensions.map(d => d.id)).size === 6, 'Expected six unique dimensions');
  for (let n = 1; n <= 6; n++) requireCondition(bank.dimensions.some(d => d.id === `D${n}` && d.name && d.low && d.high), `Invalid dimension D${n}`);
  requireCondition(bank.questions.length === 24, 'Expected exactly 24 questions');
  for (let n = 1; n <= 24; n++) requireCondition(bank.questions[n - 1]?.n === n && bank.questions[n - 1]?.id === `q${n}`, `Missing, duplicate or unordered Q${n}`);
  for (const dim of bank.dimensions) requireCondition(bank.questions.filter(q => q.dim === dim.id).length === 4, `Expected four questions in ${dim.id}`);
  requireCondition(bank.questions.filter(q => q.probe).length === 4, 'Expected four probes');
  for (const q of bank.questions) {
    requireCondition(bank.dimensions.some(d => d.id === q.dim), `Unknown dimension on ${q.id}`);
    requireCondition(typeof q.stem === 'string' && q.stem.length > 0, `Missing stem on ${q.id}`);
    requireCondition(['scene', 'direct'].includes(q.frame) && ['single', 'S', 'H'].includes(q.role), `Invalid frame/role on ${q.id}`);
    const positions = q.options.map(option => option.pos);
    requireCondition(q.options.every(option => typeof option.text === 'string' && option.text.length > 0), `Missing option text on ${q.id}`);
    requireCondition(positions.length <= 25 && new Set(positions).size === positions.length && [1, 2, 3, 4, 5].every(pos => positions.includes(pos)) && positions.every(pos => pos === 'X' || (Number.isFinite(pos) && pos >= 1 && pos <= 5)) && positions.filter(p => p === 'X').length === (q.probe ? 1 : 0) && positions.some(pos => typeof pos === 'number' && !Number.isInteger(pos)), `Invalid positions on ${q.id}`);
    requireCondition(q.options.every(option => option.depth === undefined || (q.probe && option.depth === 'unscored' && typeof option.pos === 'number' && !Number.isInteger(option.pos))), `Invalid Depth metadata on ${q.id}`);
    requireCondition(q.options.filter(option => option.depth === 'unscored').length === (q.probe ? 1 : 0), `Missing or extra Depth opt-out on ${q.id}`);
    requireCondition(q.agent_order.length === positions.length && new Set(q.agent_order).size === positions.length && q.agent_order.every(pos => positions.includes(pos)), `Invalid agent_order on ${q.id}`);
    const numeric = q.agent_order.filter(pos => pos !== 'X');
    requireCondition(!numeric.every((pos, i) => i === 0 || pos > numeric[i - 1]) && !numeric.every((pos, i) => i === 0 || pos < numeric[i - 1]), `Monotonic agent_order on ${q.id}`);
    requireCondition(q.role === 'single' ? q.pair === null && q.frame === 'scene' : typeof q.pair === 'string' && bank.pairs.some(pair => pair.id === q.pair), `Invalid pair association on ${q.id}`);
  }
  requireCondition(bank.pairs.length === 6 && new Set(bank.pairs.map(p => p.id)).size === 6 && new Set(bank.pairs.map(p => p.dim)).size === 6, 'Expected six unique dimension pairs');
  const used = new Set();
  for (const pair of bank.pairs) {
    const s = bank.questions.find(q => q.id === pair.s);
    const h = bank.questions.find(q => q.id === pair.h);
    requireCondition(s && h && s.role === 'S' && h.role === 'H' && s.frame === 'scene' && h.frame === 'direct' && s.dim === pair.dim && h.dim === pair.dim && s.pair === pair.id && h.pair === pair.id && !used.has(s.id) && !used.has(h.id), `Invalid pair ${pair.id}`);
    used.add(s.id); used.add(h.id);
    requireCondition(bank.questions.filter(q => q.pair === pair.id).length === 2, `Extra member of ${pair.id}`);
  }
  return bank;
}

export function validateModels(models) {
  requireCondition(Array.isArray(models) && models.length > 0 && new Set(models.map(m => m.id)).size === models.length, 'Expected unique model profiles');
  for (const model of models) {
    requireCondition(typeof model.id === 'string' && !!model.id && typeof model.name === 'string' && !!model.name && typeof model.provisional === 'boolean' && Number.isInteger(model.n_submissions) && model.n_submissions >= 0, 'Invalid model metadata');
    requireCondition(Object.keys(model.profile).length === 6 && Array.from({ length: 6 }, (_, i) => model.profile[`D${i + 1}`]).every(value => Number.isFinite(value) && value >= 1 && value <= 5), `Invalid profile for ${model.id}`);
  }
  return models;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateQuestions(JSON.parse(await readFile(new URL('../src/lib/lmti/data/questions.json', import.meta.url), 'utf8')));
  validateModels(JSON.parse(await readFile(new URL('../src/lib/lmti/data/models.json', import.meta.url), 'utf8')));
  console.log('Question bank and model profiles are valid.');
}
