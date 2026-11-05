import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';

export default [
	{ ignores: ['dist/**', '.astro/**', 'node_modules/**', '**/.wrangler/**'] },
	js.configs.recommended,
	...astro.configs['flat/recommended'],
	{
		files: ['**/*.mjs'],
		languageOptions: {
			globals: Object.fromEntries(
				[
					'URL',
					'console',
					'process',
					'structuredClone',
					'TextEncoder',
					'TextDecoder',
					'Response',
					'Request',
				].map((name) => [name, 'readonly']),
			),
		},
		rules: { 'no-constant-condition': ['error', { checkLoops: false }] },
	},
	{
		files: ['**/*.ts'],
		languageOptions: { parser: typescriptParser },
		rules: { 'no-undef': 'off', 'no-unused-vars': ['error', { args: 'none' }] },
	},
];
