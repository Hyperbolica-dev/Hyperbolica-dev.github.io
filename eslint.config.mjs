import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';

export default [
	{ ignores: ['dist/**', '.astro/**', 'node_modules/**'] },
	js.configs.recommended,
	...astro.configs['flat/recommended'],
	{
		files: ['**/*.ts'],
		languageOptions: { parser: typescriptParser },
		rules: { 'no-undef': 'off' },
	},
];
