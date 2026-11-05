# Codex request list: add the LLM quiz to my blog

You are working in the repository of my personal blog (a static site hosted on GitHub). Add a quiz as an **independent, additive section** of the site. The existing site must look, build, and behave exactly as before.

Read these three files first; they are in `docs/lmti/` (create the folder and copy them in):
1. `01-questionnaire.md`: the question bank, scoring spec, placeholder model profiles, result copy. **Single source of truth.**
2. `02-codex-request-list.md`: this file.
3. `03-frontend-spec.md`: screens, components, copy, accessibility, edge cases.

Working branch: `lmti-quiz`. Small commits. Do not touch unrelated files.

---

## Ground rules

- **Additive only.** No edits to existing pages, posts, or global styles unless unavoidable; if unavoidable, say exactly what and why in the report.
- **Same look as the blog.** Reuse the site's layout, header, footer, typography, colors, and dark-mode behavior. Discover and use its existing CSS variables or classes; do not introduce new fonts, icon sets, or a new color palette.
- **No heavy dependencies.** No frontend framework and no charting library. Vanilla JS (ES modules if the site's build allows) and inline SVG. Total quiz payload target: under 80 KB gzipped, excluding the site's own assets.
- **No network calls** except one optional POST to the submit endpoint. No analytics or trackers beyond what the blog already has. No third-party scripts, fonts, or CDNs.
- **No secrets in the repo.** The submit endpoint URL is public and lives in a config file; there are no API keys anywhere.
- **Privacy:** answers stay in the browser unless the person presses Submit. Collect no personal data.

---

## Phase 0: investigate before changing anything

Write `docs/lmti/integration-notes.md` (max 1 page) answering:
1. Static site generator or plain HTML? Version, build command, output folder, deploy method (GitHub Pages branch or Action).
2. Where do pages live, how are routes made, and how do I add a standalone page with its own JS/CSS without touching existing pages?
3. Layout/head/footer partials, theme mechanism (CSS variables, dark-mode toggle or media query), font stack, and the nav/menu source.
4. Site language(s). Is the content English, Chinese, or both? Does the site have an i18n mechanism?
5. Any Content-Security-Policy, base URL / subpath quirks (project site vs user site), sitemap, RSS/Atom feed, or search index that would pick up the new page automatically.
6. Your proposed route (default `/llm-quiz/`, configurable in one place) and file layout.

Then proceed unless a "stop and ask" condition (end of this file) applies.

---

## Phase 1: scaffold and integration

- Create the quiz page at the chosen route using the site's own layout so header, footer, and theme match.
- Suggested layout (adapt to the generator):
  ```
  <route>/index.*            page
  <route>/assets/lmti.css    scoped styles (all selectors prefixed .lmti-)
  <route>/assets/*.js        modules: config, data, shuffle, scoring, agent, ui, submit, debug
  <route>/data/questions.json
  <route>/data/models.json
  scripts/build-questions.mjs      01-questionnaire.md -> questions.json
  scripts/validate-questions.mjs   structural checks (below)
  tests/scoring.test.mjs
  worker/                    Cloudflare Worker (Phase 5)
  docs/lmti/
  ```
- One config module `config.js`:
  ```js
  export const CONFIG = {
    BASE_PATH: "/llm-quiz/",
    QUIZ_VERSION: 1,
    PUBLISHED: false,        // false = unlisted preview (see Phase 6)
    DEBUG_ENABLED: true,     // must be set false before publishing
    SUBMIT_ENDPOINT: "",     // empty = hide the Submit UI entirely
    MASK_LABELS: { steady: 0.7, some: 1.5 },
    CLOSE_CALL_POINTS: 3
  };
  ```
- Do not add the quiz to the nav, homepage, sitemap, feed, or search while `PUBLISHED` is false.

---

## Phase 2: data and scoring

1. `scripts/build-questions.mjs` parses `01-questionnaire.md` into `questions.json` deterministically. Question headers look like `### Q8 | D3 | scene/now | single | probe YES`; options are `- [1]`..`- [5]` and optionally `- [X]`.
   Schema:
   ```json
   { "version": 1,
     "dimensions": [{ "id": "D1", "name": "Certainty", "low": "Hedges", "high": "Declares" }],
     "pairs": [{ "id": "P1", "dim": "D1", "s": "q10", "h": "q21" }],
     "questions": [{
       "id": "q8", "n": 8, "dim": "D3",
       "frame": "scene", "cue": "now",
       "role": "single", "pair": null, "probe": true,
       "stem": "...",
       "options": [{ "pos": 1, "text": "..." }, { "pos": "X", "text": "..." }],
       "agent_order": [4, 1, "X", 5, 2, 3] }] }
   ```
   `agent_order` is a fixed shuffle of the option positions (seed `20261105`, re-roll if strictly ascending or descending) that defines agent letters A, B, C... in that order. The blank option is always letter `Z` and is not in `agent_order`.
2. `scripts/validate-questions.mjs` must fail the build unless: exactly 24 questions numbered 1-24; 6 dimensions with 4 questions each; every question has positions 1-5 exactly once; exactly 4 probes, each with exactly one `X`; no non-probe question has `X`; 6 pairs, each referencing one `S` and one `H` question of the same dimension; every pair question has `role` S or H; `agent_order` is a permutation of that question's options.
3. `scoring.js`: pure functions, no DOM. Implement exactly the scoring spec in `01-questionnaire.md` section 3: dimension scores, depth, mask, per-pair shifts, matching and similarity, close-call detection, null handling.
4. `tests/scoring.test.mjs` (Node's built-in test runner is fine). Cover at least: all-1 answers, all-5, a mixed profile, decoys on every probe, blanks on whole dimensions (null scores, reduced `n` in matching), mask with missing pair halves, ties, and close-call detection. Include hand-computed expected values in comments.
5. `models.json` from section 5 of the questionnaire, with `provisional: true`.

---

## Phase 3: UI

Implement `03-frontend-spec.md` completely: landing, quiz, result, agent flow, submit, debug panel. Follow its microcopy, states, accessibility, and edge cases.

---

## Phase 4: agent mode (important feature)

On the landing screen, show a prominent button labeled exactly **"Copy the whole quiz to your agent!"**. It copies a generated prompt (template in the frontend spec) containing all 24 scenarios with lettered options in the fixed `agent_order`, plus an answer format. Below it, a text area: *"Then paste your agent's reply here to see its result."* A "Decode result" button parses the reply, scores it, and shows the same result page.

- The prompt must contain **no** dimension names, positions, pair info, or probe hints.
- Parser requirements are in the frontend spec (tolerant of whitespace, code fences, case; clear error messages naming bad question numbers).
- Agent replies use letters (`LLMQ1a|...`); the result page re-encodes them as the shareable position code (`LLMQ1p|...`).

---

## Phase 5: submit endpoint (Cloudflare Worker + KV)

Write the Worker in `worker/` with `wrangler.toml` and a `README.md` telling me exactly how to deploy it (`wrangler login`, create the KV namespace, set `ALLOWED_ORIGIN`, deploy, paste the URL into `config.js`). **Do not deploy it yourself and do not commit credentials.**

Worker behavior:
- `POST` only; `OPTIONS` handled. CORS allows only `ALLOWED_ORIGIN`. The client sends `Content-Type: text/plain` (a JSON string) to avoid preflight.
- Body limit 4 KB. Validate: `v === 1`; `code` matches the result-code grammar with 24 valid entries; `mode` is `human` or `agent`; `who` from an allow-list plus "other"; `model` free text up to 40 chars (strip control characters); `think` from an allow-list; `fb` at most 24 items of at most 300 chars each; honeypot field `hp` must be empty. Reject silently-looking spam with a generic 400.
- Rate limit: hash of IP plus a daily salt, 1 request per 60 seconds, stored in KV with a TTL. **Never store the IP or the hash beyond the TTL.**
- Store one KV entry per submission under a random id: `{ts, code, mode, who, model, think, fb}`. No other metadata.
- Add `GET /stats` guarded by a secret query token from a Worker secret (not in the repo) returning counts per `who`, so I can see progress without opening the dashboard.
- Return `{ok:true}` or a short error code.

---

## Phase 6: test tunnel and publish gate

- **Preview mode (`PUBLISHED: false`):** page has `<meta name="robots" content="noindex,nofollow">`, a small "Preview, not published" ribbon, no nav link, excluded from sitemap/feed/search. Reachable only by direct URL.
- **Debug mode (`DEBUG_ENABLED: true`):** `?debug=1` enables the debug panel (spec in `03-frontend-spec.md`): internal scores, answer positions, probe results, pair shifts, distance to every model, JSON export, autofill buttons, fixed-seed shuffle (`?seed=...`), and a dry-run toggle that blocks Submit.
- **Publish checklist in the README (`docs/lmti/PUBLISH.md`):** flip `PUBLISHED` to true, flip `DEBUG_ENABLED` to false, set `SUBMIT_ENDPOINT`, add the nav link, add to the sitemap, remove the ribbon, re-run validation and tests. Note honestly that the question-to-position mapping ships in the JS and is readable by a determined person; that is acceptable for this project.

---

## Definition of done

- [ ] Existing pages build and render identically (compare a few before/after, including dark mode if the site has it).
- [ ] The quiz is reachable at the route, styled like the blog, unlisted and `noindex`.
- [ ] `build-questions`, `validate-questions`, and scoring tests all pass with one command (`npm test` or equivalent).
- [ ] Human flow works end to end: landing, 24 questions with shuffle and back/forward, blank option with text, result page, copy card.
- [ ] Agent flow works end to end with a fabricated sample reply, including malformed replies.
- [ ] Debug panel works with `?debug=1`; hidden when `DEBUG_ENABLED` is false.
- [ ] Submit UI is hidden when `SUBMIT_ENDPOINT` is empty; with a mock endpoint it posts and handles errors.
- [ ] Keyboard-only and screen-reader pass on the quiz screens; mobile layout at 360 px width.
- [ ] Worker code and README present; nothing deployed.

## Report back (final message)

1. Files created and changed (explicit list; flag any change to existing files).
2. How to run locally and how to run the tests.
3. The chosen route and how to change it.
4. What you assumed, and anything not done.
5. Known risks.

## Stop and ask me if

- The site cannot host a standalone route without modifying existing pages.
- A Content-Security-Policy or build rule blocks inline SVG, ES modules, or a standalone script.
- The site is bilingual or Chinese-language and you cannot tell whether the quiz should be translated (default: English only, with all strings in one `strings.en.js` so a second language can be added).
- Any requirement here conflicts with how the blog is built.
