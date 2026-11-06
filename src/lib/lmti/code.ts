import type { Answers, Bank, DecodeResult, Position, Thinking } from './types.ts';

const clean = (text: string, max: number) =>
	text
		.replace(/[\p{Cc}|;=,`]/gu, '')
		.trim()
		.slice(0, max);
const levels: Record<string, true> = {
	off: true,
	low: true,
	medium: true,
	high: true,
	unknown: true,
};

export function encodeResult(
	answers: Answers,
	metadata: { who: string; think: string; model?: string },
): string {
	const who = clean(metadata.who, 40) || 'other';
	const think = Object.hasOwn(levels, metadata.think) ? metadata.think : 'unknown';
	const model = metadata.model ? clean(metadata.model, 40) : '';
	return `LLMQ3p|who=${who}|think=${think}${model ? `|model=${model}` : ''}|${Array.from({ length: 24 }, (_, i) => `${i + 1}=${answers[`q${i + 1}`] ?? 0}`).join(';')}`;
}

export function decodeReply(text: string, bank: Bank): DecodeResult {
	const fail = (
		error: 'version' | 'format' | 'answers',
		missing: number[] = [],
		invalid: { q: number; value: string }[] = [],
		duplicates: number[] = [],
	): DecodeResult => ({ ok: false, error, missing, invalid, duplicates });
	const prefixes = [...text.matchAll(/LLMQ\d+[ap]?/gi)];
	if (!prefixes.length) return fail('format');
	const first = prefixes[0];
	if (bank.version !== 3 || !/^LLMQ3[ap]$/i.test(first[0])) return fail('version');
	const kind = first[0].slice(-1).toLowerCase();
	const remainder = text.slice(first.index! + first[0].length, prefixes[1]?.index);
	const lines = remainder.replace(/\r/g, '').split('\n');
	let content = lines[0];
	for (const line of lines.slice(1)) {
		if (!line.trim()) continue;
		if (/^\s*[|;,]?\s*(?:\d+\s*=|(?:model|think|who)\s*=|\|)/i.test(line)) content += ` ${line}`;
		else break;
	}
	content = content.replace(/`+\s*$/, '').trim();
	if (!/^\s*\|/.test(content)) return fail('format');
	let model = 'unknown';
	let think: Thinking = 'unknown';
	const answers: Answers = {};
	const seen = new Set<number>();
	const invalid: { q: number; value: string }[] = [];
	const duplicates: number[] = [];
	const tokens = content
		.split(/[|;,]/)
		.map((value) => value.trim())
		.filter(Boolean);
	for (const token of tokens) {
		const metadata = /^(model|think|who)\s*=\s*(.*)$/i.exec(token);
		if (metadata) {
			if (metadata[1].toLowerCase() === 'model') model = clean(metadata[2], 40) || 'unknown';
			if (metadata[1].toLowerCase() === 'think') {
				const value = metadata[2].toLowerCase();
				think = Object.hasOwn(levels, value) ? (value as Thinking) : 'unknown';
			}
			continue;
		}
		// Whitespace can delimit entries, but never hide trailing prose or malformed values.
		const entries = token.split(/\s+(?=\d+\s*=)/);
		for (const entry of entries) {
			const match = /^(\d+)\s*=\s*(.*?)\s*$/.exec(entry);
			if (!match) return fail('format');
			const q = Number(match[1]);
			const value = match[2].toUpperCase();
			if (seen.has(q) && !duplicates.includes(q)) duplicates.push(q);
			seen.add(q);
			const question = bank.questions.find((question) => question.n === q);
			let position: Position | undefined;
			if (question && kind === 'p' && /^(?:0|[1-5](?:\.[0-9]+)?|X|S|U|T)$/.test(value)) {
				const candidate: Position = /^[XSUT]$/.test(value) ? (value as Position) : Number(value);
				if (candidate === 0 || question.options.some((option) => option.pos === candidate))
					position = candidate;
			}
			if (question && kind === 'a') {
				if (value === 'Z') position = 0;
				else if (/^[A-Y]$/.test(value)) {
					const candidate = question.agent_order[value.charCodeAt(0) - 65];
					if (question.options.some((option) => option.pos === candidate)) position = candidate;
				}
			}
			if (position === undefined) invalid.push({ q, value: match[2] });
			else answers[question!.id] = position;
		}
	}
	const missing = bank.questions
		.filter((question) => !seen.has(question.n))
		.map((question) => question.n);
	if (missing.length || invalid.length || duplicates.length)
		return fail('answers', missing, invalid, duplicates);
	return { ok: true, answers, model, think, multiple: prefixes.length > 1 };
}
