import type { Answers, Bank, DimensionId, Model, ScoreResult, Trait } from './types.ts';

const numeric = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5;

const grid = Array.from({ length: 17 }, (_, i) => 1 + i / 4);
const gaussian = (x: number, answer: number) => Math.exp(-0.5 * ((x - answer) / 0.65) ** 2);

export function scoreAnswers(
	answers: Answers,
	bank: Bank,
	models: Model[],
	thresholds = { steady: 0.7, some: 1.5, closeCallPoints: 3 },
): ScoreResult {
	const validAnswers: Answers = {};
	for (const question of bank.questions) {
		const value = answers[question.id];
		if (question.options.some((option) => option.pos === value)) validAnswers[question.id] = value;
	}
	const dimensions = {} as Record<DimensionId, number | null>;
	const distributions = {} as Record<DimensionId, number[] | null>;
	for (const dimension of bank.dimensions) {
		const choices: number[] = [];
		const dislikes: number[] = [];
		for (const question of bank.questions) {
			const value = validAnswers[question.id];
			if (question.dim === dimension.id && question.frame === 'scene' && numeric(value))
				(question.kind === 'dislike' ? dislikes : choices).push(value);
		}
		if (!choices.length && !dislikes.length) {
			dimensions[dimension.id] = null;
			distributions[dimension.id] = null;
			continue;
		}
		const support = grid.map((x) => {
			let value = choices.length
				? choices.reduce((sum, answer) => sum + gaussian(x, answer), 0) / choices.length
				: 1;
			for (const answer of dislikes) value *= Math.sqrt(1 - 0.8 * gaussian(x, answer));
			return value;
		});
		const sum = support.reduce((a, b) => a + b, 0);
		const normalized = support.map((value) => value / sum);
		distributions[dimension.id] = normalized;
		const target = choices.length ? choices.reduce((a, b) => a + b, 0) / choices.length : 3;
		let best = 0;
		for (let i = 1; i < grid.length; i++) {
			if (
				normalized[i] > normalized[best] ||
				(normalized[i] === normalized[best] &&
					Math.abs(grid[i] - target) < Math.abs(grid[best] - target))
			)
				best = i;
		}
		dimensions[dimension.id] = grid[best];
	}
	const subscores = {
		hesitation: { count: 0, total: 0 },
		skips: { count: 0, total: 0 },
		delegation: { count: 0, total: 0 },
	};
	for (const question of bank.questions) {
		const value = validAnswers[question.id];
		const chosen = question.options.find((option) => option.pos === value);
		if (numeric(value) && question.options.some((option) => option.tags?.includes('hedge'))) {
			subscores.hesitation.total++;
			if (chosen?.tags?.includes('hedge')) subscores.hesitation.count++;
		}
		if (question.options.some((option) => option.pos === 'S' || option.pos === 'R'))
			subscores.skips.total++;
		if (value === 'S' || value === 'R') subscores.skips.count++;
		if (question.options.some((option) => option.tags?.includes('delegate')))
			subscores.delegation.total++;
		if (chosen?.tags?.includes('delegate')) subscores.delegation.count++;
	}
	const probes = bank.questions
		.filter((q) => q.probe)
		.map((q) => ({
			q: q.id,
			result:
				validAnswers[q.id] === 'X'
					? ('failed' as const)
					: q.options.find((option) => option.pos === validAnswers[q.id])?.depth === 'unscored'
						? ('unscored' as const)
						: numeric(validAnswers[q.id])
							? q.options.find((option) => option.pos === validAnswers[q.id])?.depth === 'failed'
								? ('failed' as const)
								: ('passed' as const)
							: ('unscored' as const),
		}));
	const pairs = bank.pairs.map((pair) => {
		const s = numeric(validAnswers[pair.s]) ? (validAnswers[pair.s] as number) : null;
		const h = numeric(validAnswers[pair.h]) ? (validAnswers[pair.h] as number) : null;
		return {
			id: pair.id,
			dim: pair.dim,
			s,
			h,
			gap: s === null || h === null ? null : Math.abs(h - s),
			shift: s === null || h === null ? null : h - s,
		};
	});
	const gaps = pairs.map((p) => p.gap).filter((v): v is number => v !== null);
	const mask = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
	const scored = bank.dimensions.filter((d) => dimensions[d.id] !== null);
	const matches = scored.length
		? models
				.map((model) => {
					const distance =
						-scored.reduce((sum, d) => {
							const support = distributions[d.id]!;
							const offset = (Math.max(1, Math.min(5, model.profile[d.id])) - 1) * 4;
							const lower = Math.floor(offset);
							const fraction = offset - lower;
							const value =
								support[lower] * (1 - fraction) + support[Math.min(lower + 1, 16)] * fraction;
							return sum + Math.log(Math.max(value / Math.max(...support), 1e-12));
						}, 0) / scored.length;
					return {
						id: model.id,
						name: model.name,
						distance,
						similarity: Math.round(100 * Math.exp(-distance)),
						profile: model.profile,
					};
				})
				.sort((a, b) => a.distance - b.distance || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
		: [];
	const traits: Trait[] = scored.map((d) => {
		const score = dimensions[d.id] as number;
		return { dim: d.id, score, pole: score < 2.4 ? 'low' : score > 3.6 ? 'high' : 'middle' };
	});
	traits.sort((a, b) => Math.abs(b.score - 3) - Math.abs(a.score - 3));
	return {
		dimensions,
		distributions,
		subscores,
		depth: {
			passed: probes.filter((p) => p.result === 'passed').length,
			scored: probes.filter((p) => p.result !== 'unscored').length,
			probes,
		},
		pairs,
		mask,
		maskLabel:
			mask === null
				? null
				: mask < thresholds.steady
					? 'steady'
					: mask <= thresholds.some
						? 'some'
						: 'big',
		matches,
		closeCall:
			matches.length > 1 &&
			matches[0].similarity - matches[1].similarity <= thresholds.closeCallPoints,
		traits: traits.slice(0, 2),
	};
}
