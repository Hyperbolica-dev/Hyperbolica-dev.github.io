import { getCollection, type CollectionEntry } from 'astro:content';

import { estimateReadingTime, type ReadingTime } from './reading-time';

export const BLOG_CATEGORIES = ['cognition', 'systems', 'science', 'frontier'] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
export type DocsEntry = CollectionEntry<'docs'>;
export type BlogArticle = DocsEntry & {
	data: Extract<DocsEntry['data'], { contentType: 'article' }>;
};

export interface TagSummary {
	tag: string;
	count: number;
}

export interface ChronologicalNeighbors {
	older?: BlogArticle;
	newer?: BlogArticle;
}

export interface SeriesNavigation {
	id: string;
	title: string;
	order: number;
	previous?: BlogArticle;
	next?: BlogArticle;
}

export interface ArticlePageContext {
	article: BlogArticle;
	readingTime: ReadingTime;
	chronology: ChronologicalNeighbors;
	series?: SeriesNavigation;
}

const STANDALONE_PAGE_IDS = new Set(['index', 'about', '404']);
const CATEGORY_ENTRY_IDS = new Set<string>(BLOG_CATEGORIES);

export function isCategoryEntry(entry: DocsEntry): boolean {
	return CATEGORY_ENTRY_IDS.has(entry.id);
}

export function isStandalonePage(entry: DocsEntry): boolean {
	return STANDALONE_PAGE_IDS.has(entry.id);
}

export function isNonArticlePage(entry: DocsEntry): boolean {
	return isStandalonePage(entry) || isCategoryEntry(entry);
}

export function isBlogArticle(entry: DocsEntry): entry is BlogArticle {
	return entry.data.contentType === 'article' && !isNonArticlePage(entry);
}

export function isDraft(entry: DocsEntry): boolean {
	return entry.data.draft;
}

export function isPublicArticle(entry: DocsEntry): entry is BlogArticle {
	return isBlogArticle(entry) && !isDraft(entry);
}

export function sortArticlesByPublishedAt(articles: readonly BlogArticle[]): BlogArticle[] {
	return [...articles].sort((left, right) => {
		const dateDifference = right.data.publishedAt.getTime() - left.data.publishedAt.getTime();
		return dateDifference || compareStrings(left.id, right.id);
	});
}

export async function getPublicArticles(): Promise<BlogArticle[]> {
	const entries = await getCollection('docs');
	return sortArticlesByPublishedAt(entries.filter(isPublicArticle));
}

export async function getArticlesByCategory(category: BlogCategory): Promise<BlogArticle[]> {
	return (await getPublicArticles()).filter((article) => article.data.category === category);
}

export async function getArticlesByTag(tag: string): Promise<BlogArticle[]> {
	const normalizedTag = normalizeTag(tag);
	return (await getPublicArticles()).filter((article) => article.data.tags.includes(normalizedTag));
}

export async function getTagCollection(): Promise<TagSummary[]> {
	const counts = new Map<string, number>();

	for (const article of await getPublicArticles()) {
		for (const tag of article.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return [...counts]
		.map(([tag, count]) => ({ tag, count }))
		.sort((left, right) => compareStrings(left.tag, right.tag));
}

export function getArticleReadingTime(article: BlogArticle): ReadingTime {
	return estimateReadingTime(article.body ?? '');
}

export function getChronologicalNeighbors(
	articles: readonly BlogArticle[],
	currentId: string,
): ChronologicalNeighbors {
	const currentIndex = articles.findIndex((article) => article.id === currentId);
	if (currentIndex < 0) return {};

	return {
		older: articles[currentIndex + 1],
		newer: articles[currentIndex - 1],
	};
}

export function getSeriesNavigation(
	articles: readonly BlogArticle[],
	currentId: string,
): SeriesNavigation | undefined {
	const current = articles.find((article) => article.id === currentId);
	const currentSeries = current?.data.series;
	if (!current || !currentSeries) return undefined;

	const seriesArticles = articles
		.filter((article) => article.data.series?.id === currentSeries.id)
		.sort((left, right) => {
			const orderDifference =
				(left.data.series?.order ?? Number.POSITIVE_INFINITY) -
				(right.data.series?.order ?? Number.POSITIVE_INFINITY);
			return orderDifference || compareStrings(left.id, right.id);
		});
	const currentIndex = seriesArticles.findIndex((article) => article.id === currentId);

	return {
		id: currentSeries.id,
		title: currentSeries.title,
		order: currentSeries.order,
		previous: seriesArticles[currentIndex - 1],
		next: seriesArticles[currentIndex + 1],
	};
}

export async function getArticlePageContext(id: string): Promise<ArticlePageContext | undefined> {
	const articles = await getPublicArticles();
	const article = articles.find((candidate) => candidate.id === id);
	if (!article) return undefined;

	return {
		article,
		readingTime: getArticleReadingTime(article),
		chronology: getChronologicalNeighbors(articles, id),
		series: getSeriesNavigation(articles, id),
	};
}

function normalizeTag(tag: string): string {
	return tag
		.normalize('NFKC')
		.trim()
		.toLocaleLowerCase('en-US')
		.replace(/\s+/gu, '-')
		.replace(/-+/gu, '-');
}

function compareStrings(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}
