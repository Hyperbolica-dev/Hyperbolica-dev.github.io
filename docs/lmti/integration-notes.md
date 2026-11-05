# LLM quiz integration

Astro 7.2 / Starlight 0.42 render a static root GitHub Pages site; GitHub Actions deploys `dist/`. Run `npm run dev`, `npm test`, and `npm run quality`.

The standalone English route is `src/pages/fun/llm-quiz/index.astro`, using `StarlightPage` and the existing header/sidebar/footer/theme. Quiz CSS is scoped in `src/styles/lmti.css`, using existing Starlight tokens; no frontend or chart library is added. `src/lib/lmti/config.ts` owns configuration, `strings.en.ts` owns quiz interface strings, and the supplied question Markdown owns the bank. Agent prompt wording stays with its generator. Generation and structural validation run with the production build.

The bilingual Fun indexes were migrated from Markdown to MDX without changing URLs. Cards are visible immediately per owner instruction, including on the Chinese index, and point to the English beta. Chinese quiz translation is deliberately not published yet. No article taxonomy/schema change is required.

Preview retains `noindex,nofollow` and its ribbon; unlike the original attachment, the owner explicitly requested visible cards. Sitemap filtering excludes the preview quiz. Pagefind is disabled for the preview route. There is no feed or custom CSP configured. The new direct sitemap dependency was already present transitively through Starlight; its explicit integration preserves bilingual sitemap configuration while enabling preview filtering.

Answers and notes use sessionStorage only. Submission is hidden until SUBMIT_ENDPOINT is configured; the separate Worker is not deployed. Imports always use agent mode, including positional codes, per owner instruction. Model rows remain the supplied provisional values without an additional placeholder disclaimer. Depth, Mask and deliberately anthropomorphic wording are unchanged.

Mostly-blank results require at least 9 valid answers among the 18 scene items. Version 2 maps added replies to fractional positions on the original six axes; mappings and probe opt-outs are documented in the question bank. Seeded question order remains stable on Back/reload and keeps original IDs in result codes. Shortcuts support displayed options 1–9. PNG sharing uses local model assets and canvas; codes remain readable client-side by design.
