import type { Answers, Bank, DimensionId, Model, ScoreResult, Trait } from './types.ts';

const numeric = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5;

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
	for (const dimension of bank.dimensions) {
		const values = bank.questions
			.filter((q) => q.dim === dimension.id && q.frame !== 'direct')
			.map((q) => validAnswers[q.id])
			.filter(numeric);
		dimensions[dimension.id] = values.length
			? values.reduce<number>((a, b) => a + b, 0) / values.length
			: null;
	}
	const probes = bank.questions
		.filter((q) => q.probe)
		.map((q) => ({
			q: q.id,
			result:
				q.options.find((option) => option.pos === validAnswers[q.id])?.depth === 'unscored'
					? ('unscored' as const)
					: numeric(validAnswers[q.id])
						? ('passed' as const)
						: validAnswers[q.id] === 'X'
							? ('failed' as const)
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
					const distance = Math.sqrt(
						scored.reduce(
							(sum, d) => sum + ((dimensions[d.id] as number) - model.profile[d.id]) ** 2,
							0,
						),
					);
					return {
						id: model.id,
						name: model.name,
						distance,
						similarity: Math.round(100 * (1 - distance / (4 * Math.sqrt(scored.length)))),
						profile: model.profile,
					};
				})
				.sort(
					(a, b) =>
						b.similarity - a.similarity ||
						a.distance - b.distance ||
						(a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
				)
		: [];
	const traits: Trait[] = scored.map((d) => {
		const score = dimensions[d.id] as number;
		return { dim: d.id, score, pole: score < 2.4 ? 'low' : score > 3.6 ? 'high' : 'middle' };
	});
	traits.sort((a, b) => Math.abs(b.score - 3) - Math.abs(a.score - 3));
	return {
		dimensions,
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
