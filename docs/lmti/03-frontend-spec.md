# Frontend specification: LLM quiz v3

Current implementation contract. `01-questionnaire.md` owns the English question bank; `QUESTIONNAIRE-v3.zh-CN.md` is the complete editable Chinese counterpart. `ALGORITHM-v3.md` describes scoring. Archived editorial handoff/return files are historical proposals, not executable specifications.

## Release boundary

Tanh's polished bilingual wording is approved for release. Both `/fun/llm-quiz/` and `/zh/fun/llm-quiz/` render actual localized questionnaires, prompts and results with shared option identities. Deploy the matching v3 Worker before the frontend; v2 submissions are rejected by the new contract, while historical stored records are retained. Start the English calibration batch only after production verification.

## Flow

- Landing: title, subtitle, existing honesty line, optional human nickname, Start, agent prompt copy and reply import, and accepted human/agent submission counts. Counts are submissions, not unique subjects.
- Human mode shuffles question order and option order deterministically from its session seed. IDs remain stable. Something else is always last and supports an optional 300-character note. Options remain stable through Back, Next, and reload.
- A dislike question explicitly asks which response the participant least wants to give. Never show its dimension, score position, or probe status during answering.
- Numeric positions and X/S/U/T are stored distinctly. S is refusal, U is unknown, T is a silent sticker; special tokens appear only on questions that offer them. They do not silently acquire a numeric style score. Blank 0 remains Something else.
- Use native accessible controls, visible focus, responsive single-column questions, and keyboard navigation. Number shortcuts address displayed options, not score positions.
- Session state is isolated to v3. Never reinterpret a v2 answer or session under the v3 bank. Agent imports accept only complete v3 letter or positional codes with per-question membership validation.

## Human elapsed time

Start records a local timestamp. Finish freezes elapsed time before rendering results. Resume preserves it; Retake resets it. Background time and breaks count. No visible stopwatch, interval timer, scoring effect, or shared-image duration.

Legacy/malformed sessions, debug autofill and agent imports do not invent a duration. Only consented human submissions include optional `durationMs`, a safe integer from 0 through 604800000. Start/end timestamps are not sent. Timing is client-reported elapsed time, not trusted attention or performance telemetry.

## Results and sharing

- Give one ranked winner when any scored evidence exists. Rank deterministically; do not require nine numeric answers. Entirely unscored answers yield an explicit no-data state rather than a fabricated match.
- Show the winning model and logo prominently, followed by runners-up and a radar chart. The radar summarizes support modes; matching uses the full per-dimension support, not an arithmetic mean or reflected dislike score.
- Literal and playful feedback modes use the same answers, scores and ranking. Switching copy must preserve consent/submission state.
- Literal labels retain Thinking depth and Mask. Playful labels include Evidence / noticing clues and Role-shift range. Hesitation, Skips and Delegation are secondary counts, not matching dimensions.
- Playful mode starts with the black-box warning: “All psychological interpretations here are nonsense and comfort. Take only what you like hearing.” Include it in PNG and text exports.
- A winning profile is sufficiently calibrated for this release only when its source is owner-run, calibration version is LLMQ3, and it has at least three accepted calibration samples. Otherwise show: “This model has insufficient calibration data and may be substantially off.” The same warning appears in the result card, PNG and copied result text in either feedback mode. The Chinese counterpart is “当前模型的标定数据尚不足，可能有较大偏差”.
- Old GPT/Qwen samples are not v3 samples. Keep unsupported profiles explicitly provisional. Do not invent GLM/Doubao profiles or sample counts.
- PNG export is local, includes an optional nickname, and dynamically accommodates warnings and playful interpretation. It sends no answers. Text and result-code copies remain available.

## Voluntary submission

Nothing is submitted until consent and Submit. Explain the submitted answers, optional notes/nickname, metadata, and available human completion time before consent. Disable duplicate in-flight submission, retain retry identity, and display a generic failure without fabricating success.

After success replace the panel with only:

> Thank you for your submission! This will help us build little tools that better suit the needs of our carbon-based and silicon-based humans alike.

The Worker enforces origin, bounded bodies, bank membership, rate/capacity limits and sanitized storage. Public counts reveal no individual answers, nickname, timing or identifiers.

## Verification

Run `npm test` and `npm run quality` after integration. Exercise human completion/resume, dislike instruction, S/U/T choices, agent v3 round-trip/v2 rejection, deterministic ranking, no-data results, calibration warnings, both PNG/text export modes and mobile overflow. Use intercepted submission responses for browser smoke rather than polluting the production sample pool. Production deployment and real calibration are separate, post-review steps.
