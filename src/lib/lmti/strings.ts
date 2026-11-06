import { strings as english } from './strings.en';
import { strings as chinese } from './strings.zh-CN';

export type QuizLanguage = 'en' | 'zh-CN';
type Localized<T> = T extends string
	? string
	: T extends readonly string[]
		? readonly string[]
		: { [K in keyof T]: Localized<T[K]> };
export type QuizStrings = Localized<typeof english>;
export function quizStrings(language: QuizLanguage): QuizStrings {
	return language === 'zh-CN' ? chinese : english;
}
export { text } from './strings.en';
