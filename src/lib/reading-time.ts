export interface ReadingTime {
	minutes: number;
	cjkCharacters: number;
	words: number;
}

const CJK_CHARACTER = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const WORD = /[\p{Letter}\p{Number}]+(?:['’\-][\p{Letter}\p{Number}]+)*/gu;

/**
 * Estimate mixed CJK/Latin reading time without storing derived data in frontmatter.
 * CJK text is measured at 300 characters/minute and other text at 200 words/minute.
 */
export function estimateReadingTime(text: string): ReadingTime {
	const cjkCharacters = text.match(CJK_CHARACTER)?.length ?? 0;
	const nonCjkText = text.replace(CJK_CHARACTER, ' ');
	const words = nonCjkText.match(WORD)?.length ?? 0;
	const minutes = Math.max(1, Math.ceil(cjkCharacters / 300 + words / 200));

	return { minutes, cjkCharacters, words };
}
