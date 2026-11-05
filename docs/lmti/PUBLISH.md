# Publishing the English quiz

1. Run `npm run dev` and open `/fun/llm-quiz/?debug=1`. Both `/fun/` and `/zh/fun/` already contain cards; do not add another navigation item.
2. Complete the human flow, reload/back navigation, and copy/paste an agent reply. Use debug autofill and JSON export to inspect scores. The current model profiles come from section 5 of `01-questionnaire.md`; replace that table with owner-provided measurements and run `npm run quiz:data`. Never hand-edit generated JSON.
3. If collecting submissions, follow `worker/README.md`, deploy the Worker yourself, and set `SUBMIT_ENDPOINT` in `src/lib/lmti/config.ts`. Otherwise leave it empty and all submit UI stays hidden.
4. Set `PUBLISHED: true` and `DEBUG_ENABLED: false` in that configuration. This removes the preview ribbon/robots exclusion, admits the route to sitemap and Pagefind, and ignores debug query parameters. Cards already exist by owner request.
5. Run `npm test`, `npm run quality`, and `npm run build`. Deploy using the normal GitHub Pages workflow. No Worker deployment occurs in the site workflow.

The question-to-position mapping ships in the browser bundle and can be inspected; this is acceptable for this project. Answers are not a security boundary. KV rate limits are best-effort, as explained in the Worker README.

## Later Chinese release

Add reviewed translations of question content and a same-key strings module, then a Chinese route using the same scoring/code version and components. Until then the Chinese workbench card explicitly links to the English beta; do not imply that a Chinese questionnaire exists.

## Route changes

`CONFIG.BASE_PATH` owns links and sitemap exclusion. Astro's route file must also move to the matching path if that setting changes. Keep deployed URLs stable.

## Image export and questionnaire version

Save image generates a 1200×760 PNG with the primary match, model mark, runner-ups and radar. Copy image falls back to downloading when image clipboard access is unavailable. Text and result-code copying remain secondary alternatives.

Version 2 adds fractional positions within the existing six dimensions and stable seeded random question order. Version 1 codes are rejected rather than reinterpreted. Per-question mappings are documented in `01-questionnaire.md`. Cloudflare deployment is authorized but requires a successful Wrangler account login before a production endpoint can be configured.
