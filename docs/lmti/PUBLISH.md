# Publishing the English quiz

1. Run `npm run dev` and open `/fun/llm-quiz/?debug=1`. Both `/fun/` and `/zh/fun/` already contain cards; do not add another navigation item.
2. Complete the human flow, reload/back navigation, and copy/paste an agent reply. Use debug autofill and JSON export to inspect scores. The current model profiles come from section 5 of `01-questionnaire.md`; replace that table with owner-provided measurements and run `npm run quiz:data`. Never hand-edit generated JSON.
3. If collecting submissions, follow `worker/README.md`, deploy the Worker yourself, and set `SUBMIT_ENDPOINT` in `src/lib/lmti/config.ts`. Otherwise leave it empty and all submit UI stays hidden.
4. Set `PUBLISHED: true` and `DEBUG_ENABLED: false` in that configuration. This removes the preview ribbon/robots exclusion, admits the route to sitemap and Pagefind, and ignores debug query parameters. Cards already exist by owner request.
5. Run `npm test`, `npm run quality`, and `npm run build`. Deploy using the normal GitHub Pages workflow. No Worker deployment occurs in the site workflow.

The question-to-position mapping ships in the browser bundle and can be inspected; this is acceptable for this project. Answers are not a security boundary. The Worker combines native per-location throttling with a durable global daily admission budget; see its README for bootstrap, recovery and hosting-quota limitations.

## Later Chinese release

Add reviewed translations of question content and a same-key strings module, then a Chinese route using the same scoring/code version and components. Until then the Chinese workbench card explicitly links to the English beta; do not imply that a Chinese questionnaire exists.

## Route changes

`CONFIG.BASE_PATH` owns links and sitemap exclusion. Astro's route file must also move to the matching path if that setting changes. Keep deployed URLs stable.

## Image export and questionnaire version

Save image generates a 1200×760 PNG with the primary match, model mark, runner-ups and radar. An optional human nickname (up to 32 Unicode codepoints) appears on results and the image; it stays in the browser session until the user consents to submit. It is not included in result codes. Copy image falls back to downloading when image clipboard access is unavailable. Text and result-code copying remain secondary alternatives.

Version 2 adds fractional positions within the existing six dimensions and stable seeded random question order. Version 1 codes are rejected rather than reinterpreted. Per-question mappings are documented in `01-questionnaire.md`. The production submission service is `https://submit.hyperbolica-dev-tools.workers.dev/`; its CORS allowlist permits the production Pages origin, not localhost.

The optional title subtitle reports accepted human and agent submissions, not unique people, models, or locally completed questionnaires. It shows cached public aggregate counts and stays hidden if the service is unavailable. Nicknames and answer records are never included in this public response.

## Concise English wording

The human-facing copy and copied agent questionnaire use the same canonical text. The concise revision retains all 24 items, option positions, six dimensions, paired prompts and attention checks. It removes repeated setup and explanatory padding rather than silently creating a shorter, differently scored test. Anthropomorphism, playful refusal and overenthusiastic responses are intentional.

Reading fewer words is not proof of a particular completion time. Do not advertise a timed completion claim without human testing. Wording can affect answers even when numeric mappings stay unchanged: the four-run GPT calibration predates this revision and remains a provisional reference, not evidence of equivalence between wordings.

Editorial references:

- [GOV.UK Design System: Question pages](https://design-system.service.gov.uk/patterns/question-pages/) — current maintained pattern: one question per page, clear heading, back/continue controls and valid uncertainty responses. Retain the existing single-question flow; do not auto-advance choices.
- [Pew Research Center: Writing Survey Questions](https://www.pewresearch.org/writing-survey-questions/) — foundational guidance published in 2021, not a new study: concrete wording, distinct response meanings, context/order effects and pretesting. Do not assume a copy edit preserves empirical calibration.
- [Government Analysis Function: Questionnaire design guidance](https://analysisfunction.civilservice.gov.uk/policy-store/questionnaire-design-guidance/) — published 14 March 2023 and explicitly marked as under review when consulted: reduce respondent effort, write for the audience and test understanding alongside usability. Used as supporting guidance, not as a newly validated quiz format.

These sources inform presentation and wording; none validates this recreational LLM-matching questionnaire or its humor.
