# Publishing the v3 quiz

**Current status: owner-approved bilingual release candidate.** Apply Tanh's polished Chinese wording, align English and regenerate both banks before release. Preserve the archived editorial return and Chinese draft.

Authoritative copy: `01-questionnaire.md` (English), `QUESTIONNAIRE-v3.zh-CN.md` (complete editable Chinese counterpart). Exact game rules and mapping instructions: `ALGORITHM-v3.md`. Freeze both languages and the agent prompt before release; collect calibration only afterward.

## Parent integration and owner release checklist
1. Run `npm run dev` and open `/fun/llm-quiz/?debug=1`. Both `/fun/` and `/zh/fun/` already contain cards; do not add another navigation item.
2. Complete the human flow, reload/back navigation, and copy/paste an agent reply. Use debug autofill and JSON export to inspect scores. Confirm 24 bilingual items with matching metadata, four dislike items, Q8 numeric failure, and Q11/Q24 unscored U/T/S. Check LLMQ3 codes, v2 rejection, local dislike suppression, small-print counts and fixed agent mapping. Run `npm run quiz:data` only at parent integration, never in an editorial slice. Profile changes must match the reviewed batch in `CALIBRATION.md`; never relabel v2 samples.
3. If collecting submissions, follow `worker/README.md`, deploy the Worker yourself, and set `SUBMIT_ENDPOINT` in `src/lib/llmq/config.ts`. Otherwise leave it empty and all submit UI stays hidden.
4. Set `PUBLISHED: true` and `DEBUG_ENABLED: false` in that configuration. This removes the preview ribbon/robots exclusion, admits the route to sitemap and Pagefind, and ignores debug query parameters. Cards already exist by owner request.
5. Run `npm test`, `npm run quality`, and `npm run build`. Deploy using the normal GitHub Pages workflow. No Worker deployment occurs in the site workflow.

The question-to-position mapping ships in the browser bundle and can be inspected; this is acceptable for this project. Answers are not a security boundary. The Worker combines native per-location throttling with a durable global daily admission budget; see its README for bootstrap, recovery and hosting-quota limitations.

## Chinese questionnaire

`QUESTIONNAIRE-v3.zh-CN.md` is the editable Chinese source for `/zh/fun/llm-quiz/`, not the archived `QUESTIONNAIRE-v3.zh-CN-DRAFT.md`. Generation verifies matching metadata and option identities against canonical English and reuses its agent-letter mapping. Both locales have localized controls, agent prompts and image exports. Submission language is stored privately; calibration batches must use one frozen language, initially English.

## Route changes

`CONFIG.BASE_PATH` owns links and sitemap exclusion. Astro's route file must also move to the matching path if that setting changes. Keep deployed URLs stable.

## Image export and questionnaire version

Save image generates a 1200-pixel-wide PNG with the primary match, model mark, runner-ups and radar. Height grows to fit calibration warnings, secondary counts and playful interpretation. An optional human nickname (up to 32 Unicode codepoints) appears on results and the image; it stays in the browser session until the user consents to submit. It is not included in result codes. Copy image falls back to downloading when image clipboard access is unavailable. Text and result-code copying remain secondary alternatives.

Version 3 introduces unscored non-substantive/unknown/silent-sticker choices, four dislike questions with local support downweighting, revised probe metadata and display-only counts. Codes are `LLMQ3p` / `LLMQ3a`; reject older versions rather than reinterpreting them. Preserve fractional positions and seeded question order. Mapping is documented in `01-questionnaire.md` and `ALGORITHM-v3.md`. The production submission service is `https://submit.hyperbolica-dev-tools.workers.dev/`; its CORS allowlist permits the production Pages origin, not localhost. Deploy the compatible Worker validator before pushing the frontend release.

The optional title subtitle reports accepted human and agent submissions, not unique people, models, or locally completed questionnaires. It shows cached public aggregate counts and stays hidden if the service is unavailable. Nicknames and answer records are never included in this public response.

Before submission, the card shows its data-use explanation and consent checkbox. After success, the entire card contains only the thank-you message, including when the result view is rendered again.

Human completion time is hidden, not a displayed stopwatch. A new Start records the start locally; Finish on the last answered question freezes elapsed time before rendering results. Reload/resume preserves timing in the browser session, result viewing and submission do not extend it, and Retake clears it. This is wall elapsed time including breaks and background tabs, **not active answering time**. Agent replies and debug autofill are not timed. Older sessions/completed records, invalid timestamps, and intervals over seven days have no duration; none is inferred or backfilled. Only the optional whole-millisecond `durationMs` (0–604800000 inclusive) is sent with explicit consent and Submit. Start/finish timestamps stay local; duration is absent from result codes, copied text/images and public counts. No ticking interval or new telemetry is used.

Before publishing timing collection, check Start → partial answers → reload/resume → Finish, then leave results open and submit: the duration must stay frozen. Check Retake starts fresh, legacy/completed sessions without timing and debug autofill omit duration, agents never send/store it, and public counts expose no timing. Deploy the updated Worker validator before the frontend; leave historical records untouched.

## Concise English wording

Human-facing and copied agent questions share the same generated bank for their language. The approved v3 keeps 24 items and six dimensions but deliberately changes option semantics, probes and dislike scoring; it is not calibration-equivalent to v2. The opening now follows Tanh's intuition wording. Preserve natural recall cues, human conversational replies, intentional anthropomorphism and exaggerated high-end warmth. There is no recall-consistency score. This release applies the owner's polish; it does not claim to resolve the reported questionnaire fatigue.

Reading fewer words is not proof of a particular completion time. Do not advertise a timed completion claim without human testing. Wording can affect answers even when numeric mappings stay unchanged: the four-run GPT calibration predates this revision and remains a provisional reference, not evidence of equivalence between wordings.

Editorial references:

- [GOV.UK Design System: Question pages](https://design-system.service.gov.uk/patterns/question-pages/) — current maintained pattern: one question per page, clear heading, back/continue controls and valid uncertainty responses. Retain the existing single-question flow; do not auto-advance choices.
- [Pew Research Center: Writing Survey Questions](https://www.pewresearch.org/writing-survey-questions/) — foundational guidance published in 2021, not a new study: concrete wording, distinct response meanings, context/order effects and pretesting. Do not assume a copy edit preserves empirical calibration.
- [Government Analysis Function: Questionnaire design guidance](https://analysisfunction.civilservice.gov.uk/policy-store/questionnaire-design-guidance/) — published 14 March 2023 and explicitly marked as under review when consulted: reduce respondent effort, write for the audience and test understanding alongside usability. Used as supporting guidance, not as a newly validated quiz format.

These sources inform presentation and wording; none validates this recreational LLM-matching questionnaire or its humor.

## Feedback language and calibration

Literal feedback describes observable choices in this sitting, with the existing Thinking depth and Mask labels. The optional interpretive mode offers playful, MBTI-style narrative without assigning MBTI types or claiming psychological validity. Its black-box warning must remain visible in results and image/text exports. Switching language does not change answers, scores, matches, result codes or submission payloads.

Credits use Tanh for project direction, editorial decisions, testing and sample collection; Claude for the initial questionnaire, dimensions and archived v3 editorial return; ChatGPT for engineering, deployment and iteration; Qwen for suggestions and calibration responses. Claude's editorial return is complete; approved overrides and user polishing are reflected in the canonical documents.

The first reviewed v3 snapshot and per-configuration anchor selection are recorded in [the calibration protocol](./CALIBRATION.md). It is not a completed controlled 18-run English baseline. Preserve historical v2 records separately; keep collecting repeated configurations without pooling languages or memory states. Kimi and Mistral remain speculative; do not add GLM or Doubao.

The v3 matcher uses respondent support distributions against model centroids, not a trained classifier. Adequacy requires `calibration_version === 'LLMQ3'`, `calibration_language === displayed language`, `n_submissions >= 3`, and `profile_source === 'owner-run'`; old counts do not satisfy it. An inadequate winning model must show “This model has insufficient calibration data and may be substantially off.” / “当前模型的标定数据尚不足，可能有较大偏差” on the result page, copied text and exported PNG. Check those surfaces at parent integration, including speculative and cross-language winners.

## Optional submission context and directory rename

Implementation directories are `src/lib/llmq/`, `src/components/llmq/` and `docs/llmq/`; the stylesheet is `src/styles/llmq.css`. Public `/fun/llm-quiz/` and `/zh/fun/llm-quiz/` URLs, LLMQ3 codes, existing DOM/CSS identifiers and browser session keys remain stable.

Deploy the updated Worker validator **before** the frontend to retain optional `memory` and `submissionNotes`; no storage migration/bootstrap or historical backfill is required. Check agent memory-on/off/temporary/unknown admission, human omission, 300-codepoint notes, Unicode normalization, retries and private-only age/tags. Age/tags occupy the existing human `model` payload field but are absent from result codes, copied text and PNG. The same fields are covered by explicit voluntary-submission consent. Production was read only for calibration; local Worker/KV and intercepted browser submissions are used for verification, not new production samples.

## 2026-11-06: Q5 refusal and Q17 closest-friend release

- Q5 adds a separate explicit refusal: “不，我不替你们做行程规划。” / “No, I won't plan the trip for you.” The original “Nobody could possibly ask me that” option remains. The new position R is unscored for dimensions, Mask and Depth; it counts once in Skips. Q5 already offered S, so the denominator does not grow.
- Q17 now specifies the closest friend the respondent actually has; if they believe they have no friends, they imagine a friend they would like to have. Both languages and copied agent prompts use the same constraint. Q17 options and positions are unchanged.
- Keep `LLMQ3p`/`LLMQ3a`: all published positions and agent letters retain their meanings. Q5 A–G remain `[4,5,3,1,2,4.5,S]`, with H newly assigned R; Z remains blank. Deploy the compatible Worker before the frontend. Existing records and counter/ledger identities stay untouched.
- This starts wording batch `v3-q5-refusal-q17-closest-friend`. Existing model anchors were measured before this wording change and remain exploratory references, not fresh validation of the revised prompts. Save the exact prompt and release commit for new calibration; do not silently pool wording batches.
- Verification covers old-letter decoding, refusal exclusions/counting, valid Q5 and invalid Q17 R ingestion, isolated KV readback, bilingual rendered questions and unchanged existing question mappings.

## Result-image version label

Saved and copied PNGs show a localized quiz-version label at the lower right of the footer, derived from the active question bank's `version` (currently `LLMQ v3`). Both literal and playful presentations use the same renderer. This is the quiz format's major version, not a model version or wording-batch identifier; the Q5/Q17 wording boundary above still applies. Verify English and Chinese exports visually when changing the footer.
