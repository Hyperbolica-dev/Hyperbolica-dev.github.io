import { getCollection, type CollectionEntry } from 'astro:content';

import { estimateReadingTime, type ReadingTime } from './reading-time';
import { normalizeTag } from './tags';
import type { BlogCategory } from './taxonomy';

type DocsEntry = CollectionEntry<'docs'>;
export type BlogArticle = DocsEntry & {
	data: Extract<DocsEntry['data'], { contentType: 'article' }>;
};

export interface TagSummary {
	tag: string;
	count: number;
}

interface ChronologicalNeighbors {
	older?: BlogArticle;
	newer?: BlogArticle;
}

interface SeriesNavigation {
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

function isBlogArticle(entry: DocsEntry): entry is BlogArticle {
	return entry.data.contentType === 'article';
}

function isPublicArticle(entry: DocsEntry): entry is BlogArticle {
	return isBlogArticle(entry) && !entry.data.draft;
}

function sortArticlesByPublishedAt(articles: readonly BlogArticle[]): BlogArticle[] {
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

function getChronologicalNeighbors(
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

function getSeriesNavigation(
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

function compareStrings(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}
