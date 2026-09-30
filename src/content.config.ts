import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

const categories = ['cognition', 'systems', 'science', 'frontier'] as const;

const normalizedTag = z
	.string()
	.trim()
	.min(1)
	.max(64)
	.transform((tag) =>
		tag.normalize('NFKC').toLocaleLowerCase('en-US').replace(/\s+/gu, '-').replace(/-+/gu, '-'),
	)
	.pipe(
		z
			.string()
			.regex(
				/^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u,
				'Tags must contain only letters, numbers, and single hyphens.',
			),
	);

const seriesSchema = z.object({
	id: z
		.string()
		.trim()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Series IDs must use lowercase kebab-case.'),
	title: z.string().trim().min(1).max(100),
	order: z.number().int().positive(),
});

const pageFrontmatter = z.object({
	contentType: z.literal('page').default('page'),
	category: z.never().optional(),
	tags: z.never().optional(),
	publishedAt: z.never().optional(),
	updatedAt: z.never().optional(),
	series: z.never().optional(),
});

const articleFrontmatter = z.object({
	contentType: z.literal('article'),
	description: z.string().trim().min(1).max(200),
	category: z.enum(categories),
	tags: z
		.array(normalizedTag)
		.default([])
		.transform((tags) => [...new Set(tags)]),
	publishedAt: z.coerce.date(),
	updatedAt: z.coerce.date().optional(),
	series: seriesSchema.optional(),
});

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({ extend: z.union([articleFrontmatter, pageFrontmatter]) }),
	}),
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
