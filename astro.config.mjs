// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import starlight from '@astrojs/starlight';
import { categoryIds, categories } from './src/lib/taxonomy.ts';
import { site } from './src/lib/site.ts';

export default defineConfig({
	site: site.url,
	markdown: {
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
	},
	integrations: [
		starlight({
			title: site.title,
			description: site.description,
			locales: {
				root: { label: 'English', lang: 'en' },
				zh: { label: '简体中文', lang: 'zh-CN' },
			},
			defaultLocale: 'root',
			components: {
				PageFrame: './src/components/overrides/PageFrame.astro',
				Header: './src/components/BlogHeader.astro',
				TwoColumnContent: './src/components/overrides/TwoColumnContent.astro',
				PageTitle: './src/components/overrides/ArticlePageTitle.astro',
				Footer: './src/components/overrides/ArticleFooter.astro',
			},
			disable404Route: true,
			favicon: '/favicon.svg',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: site.github,
				},
			],
			pagefind: true,
			customCss: ['./src/styles/site.css'],
			tableOfContents: {
				minHeadingLevel: 2,
				maxHeadingLevel: 3,
			},
			pagination: false,
			credits: false,
			sidebar: [
				...categoryIds.map((id) => ({ label: categories[id].en.label, link: `/${id}/` })),
				{ label: 'All articles', link: '/tags/' },
			],
		}),
	],
});
