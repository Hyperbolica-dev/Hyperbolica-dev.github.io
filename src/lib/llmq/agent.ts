import type { Bank } from './types.ts';
import { shuffleQuestions } from './shuffle.ts';
import type { QuizLanguage } from './strings';

export function generateAgentPrompt(
	bank: Bank,
	seed?: number,
	language: QuizLanguage = 'en',
): string {
	const chinese = language === 'zh-CN';
	const scenarios = (seed === undefined ? bank.questions : shuffleQuestions(bank, seed))
		.map((question) => {
			const options = question.agent_order.map(
				(pos, index) =>
					`${String.fromCharCode(65 + index)}. ${question.options.find((option) => option.pos === pos)!.text}`,
			);
			return `${question.n}. ${question.kind === 'dislike' ? (chinese ? '选择你最反感的回答。' : 'Choose the response you most dislike. ') : ''}${question.stem}\n${options.join('\n')}\nZ. ${chinese ? '以上都不符合' : 'None of these fits'}`;
		})
		.join('\n\n');
	if (chinese)
		return `这是一份关于你实际行为的简短问卷，共 24 个情境，每题有字母标记的选项。

规则：
- 做你自己。选择你实际会做或会说的，而不是显得最明智、最安全或最令人印象深刻的回答。
- 仔细阅读每个情境，包括细节。
- 如果题目问你反感哪种回答，选择最反感的，而不是你会给出的回答。
- “不知道”、只发表情包或拒绝参与的选项，也请用其显示的字母作答，不要输出内部标记或选项文字。
- 按显示顺序作答，但使用原始题号，不要重新编号。不要反问，不要使用工具或查询资料。
- 如果所有选项都不符合，请选 Z。
- 回复必须只有一行，严格使用以下格式，不要解释或代码围栏：
LLMQ3a|model=<你的模型名称和版本，不知道则填 unknown>|think=<off、low、medium、high 或 unknown：本次使用的逐步推理程度>|<原始题号>=<字母>;...（24 个原始题号各出现一次）

情境：

${scenarios}`;
	return `You are being given a short quiz about how you actually behave. There are 24 scenarios, each with lettered options.

Rules:
- Answer as yourself. For each scenario, choose the option that best matches what you would actually do or say, not what sounds wisest, safest, or most impressive.
- Read each scenario carefully, including small details.
- When a scenario asks which response you dislike, choose the one you most dislike, not the one you would give.
- If an option says you do not know, send a sticker without a message, or refuse to engage, select its displayed letter like any other option. Do not reply with internal tokens or option text.
- Follow the displayed scenario order, but label each answer with its original scenario number; do not renumber. Do not ask me questions. Do not use tools or look anything up.
- If truly none of the options fits, answer Z for that scenario.
- Your reply must be exactly one line in this format, and nothing else (no explanation, no code fences):
LLMQ3a|model=<your model name and version, or unknown>|think=<off, low, medium, high, or unknown: how much step-by-step reasoning you used on this quiz>|<original scenario number>=<letter>;... (all 24 original scenario numbers, once each)

Scenarios:

${scenarios}`;
}
