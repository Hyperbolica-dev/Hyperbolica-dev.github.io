export function normalizeTag(tag: string): string {
	return tag
		.normalize('NFKC')
		.trim()
		.toLocaleLowerCase('en-US')
		.replace(/\s+/gu, '-')
		.replace(/-+/gu, '-');
}
