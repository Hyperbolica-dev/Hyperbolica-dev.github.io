import type { Bank, Question } from './types.ts';

function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export function shuffleOptions(question: Question, seed: number): Question['options'] {
	const random = seededRandom((seed >>> 0) ^ Math.imul(question.n, 0x9e3779b1));
	let result: Question['options'];
	let monotonic: boolean;
	do {
		result = question.options.slice();
		for (let i = result.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[result[i], result[j]] = [result[j], result[i]];
		}
		const numbers = result
			.map((option) => option.pos)
			.filter((pos): pos is number => typeof pos === 'number');
		monotonic =
			numbers.length > 1 &&
			(numbers.every((n, i) => i === 0 || n > numbers[i - 1]) ||
				numbers.every((n, i) => i === 0 || n < numbers[i - 1]));
	} while (monotonic);
	return result;
}

export function shuffleQuestions(bank: Bank, seed: number): Question[] {
	const random = seededRandom(seed);
	const questions = bank.questions.slice();
	for (let i = questions.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[questions[i], questions[j]] = [questions[j], questions[i]];
	}
	return questions;
}
