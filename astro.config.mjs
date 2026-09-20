// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://hyperbolica-dev.github.io',
	markdown: {
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
	},
	integrations: [
		starlight({
			title: 'Hyperbolica',
			description: 'A personal blog for notes across cognition, systems, science, and frontier.',
			disable404Route: true,
			favicon: '/favicon.svg',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/Hyperbolica-dev',
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
				{
					label: 'Navigate',
					items: [{ label: 'About', slug: 'about' }],
				},
				{
					label: 'Categories',
					items: [
						{ label: 'Cognition', slug: 'cognition' },
						{ label: 'Systems', slug: 'systems' },
						{ label: 'Science', slug: 'science' },
						{ label: 'Frontier', slug: 'frontier' },
					],
				},
			],
		}),
	],
});
