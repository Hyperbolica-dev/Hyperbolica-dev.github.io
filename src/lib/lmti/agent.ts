import type { Bank } from './types.ts';
import { shuffleQuestions } from './shuffle.ts';

export function generateAgentPrompt(bank: Bank, seed?: number): string {
	const scenarios = (seed === undefined ? bank.questions : shuffleQuestions(bank, seed))
		.map((question) => {
			const options = question.agent_order.map(
				(pos, index) =>
					`${String.fromCharCode(65 + index)}. ${question.options.find((option) => option.pos === pos)!.text}`,
			);
			return `${question.n}. ${question.stem}\n${options.join('\n')}\nZ. None of these fits`;
		})
		.join('\n\n');
	return `You are being given a short quiz about how you actually behave. There are 24 scenarios, each with lettered options.

Rules:
- Answer as yourself. For each scenario, choose the option that best matches what you would actually do or say, not what sounds wisest, safest, or most impressive.
- Read each scenario carefully, including small details.
- Follow the displayed scenario order, but label each answer with its original scenario number; do not renumber. Do not ask me questions. Do not use tools or look anything up.
- If truly none of the options fits, answer Z for that scenario.
- Your reply must be exactly one line in this format, and nothing else (no explanation, no code fences):
LLMQ2a|model=<your model name and version, or unknown>|think=<off, low, medium, high, or unknown: how much step-by-step reasoning you used on this quiz>|<original scenario number>=<letter>;... (all 24 original scenario numbers, once each)

Scenarios:

${scenarios}`;
}
