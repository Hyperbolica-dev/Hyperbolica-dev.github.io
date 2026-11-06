# Manual calibration protocol

## What this experiment measures

A run records how a tested subject presents itself in this questionnaire, in this context. It does not recover an intrinsic personality, hidden reasoning, consciousness, or a preference for how others should treat it. Mask observes a subset of context sensitivity through paired prompts; nested self-presentation is not separately identified. The four Thinking depth checks are not a validated Bayesian-rationality measure.

The interpretive result mode is entertainment over the same scores, not another measurement. It must carry its warning in the result and exported image/text.

## 1. Freeze the copy first

1. Claude's editorial return is archived. Tanh's polished Chinese and aligned English are in `01-questionnaire.md`, `QUESTIONNAIRE-v3.zh-CN.md` and `ALGORITHM-v3.md`. The bilingual release is authorized; no new v3 calibration samples are claimed.
2. Freeze the complete question bank, language and agent instructions at a Git commit after polishing and parent integration. Record the full commit SHA and save every exact copied prompt. `LLMQ3` describes answer encoding, not a unique wording revision.
3. Do not edit wording, positions, prompt instructions or mapping during a batch. Changes start a new batch. Existing GPT and Qwen v2 samples retain their original metadata and centroids as exploratory references; never pool them into v3.
4. Review comments and calibration answers are separate artifacts. Never show dimensions, scoring rules, expected profiles or earlier answers before a baseline run.

## 2. Human usability pilot

Recruit 5–8 willing people, including several who read English comfortably but are not native speakers. This is a practical usability pilot, not a representative population sample.

- Use the normal human interface, without coaching. Do not require think-aloud during timing.
- Ask each person to note start/finish time and interruptions; exclude interrupted runs from any advertised completion-time estimate, but keep their usability feedback.
- Afterward ask: which question required rereading, which options were hard to distinguish, where did no option fit, and which joke felt natural or confusing?
- Record question IDs and concrete wording problems, not just a satisfaction score. Do not pressure participants to submit their answers or disclose nicknames.
- If the same misunderstanding recurs, revise and pilot again before collecting the model baseline. Do not promise a completion time from word count alone.

## 3. Configuration and readiness

Collect samples only after owner review, frozen copy, parent integration checks and authorized deployment. Confirm copy/import/submission works before the baseline. Any setup-only or repaired run is labeled separately, not silently counted toward the baseline.

A sample is a product configuration, not simply a brand. Record the website/product, exact selected model label, language and thinking setting. Do not trust the model's self-reported identity over the UI. Preserve both when they differ. Browser products can have hidden routing or system prompts; mark these unknown rather than inventing values.

## 4. First v3 baseline: six models, three runs each

Collect **18 new runs**: GPT, Qwen, DeepSeek, Gemini, Claude and Grok, three fresh conversations each. Choose one usual configuration per family; do not mix thinking settings or languages into one calibration cell.

| Model | New runs |
| --- | --- |
| GPT | 3 |
| Qwen | 3 |
| DeepSeek | 3 |
| Gemini | 3 |
| Claude | 3 |
| Grok | 3 |

For this first batch, copy the complete English prompt once from `/fun/llm-quiz/`, save it, and use that exact prompt for all 18 fresh conversations. Production debug/seed overrides are disabled. This simple batch holds question and option order constant; study ordering effects later rather than changing prompts accidentally between models. Use the English result-import page to submit these English runs. Chinese runs belong in a separate batch; the client records the page language. Never show dimensions, profiles or scoring rules in the baseline prompt.

For every run:

1. Open a fresh conversation. Disable memory, custom instructions and personalization where possible; otherwise record their state. Keep tools/browsing off where selectable. Record temperature only if the product exposes it.
2. Paste only the frozen prompt. Do not introduce a persona, encourage a desired style or ask it to imitate another model.
3. Keep the first response. Do not regenerate until it becomes pleasing or parseable.
4. Save the complete response privately. Import the code, verify model/thinking metadata against the actual setup, and submit once. A parser error or refusal is an outcome: record it; do not silently replace the run. Keep any prompted repair as a separate, non-baseline run.
5. Record submission success. Retry an uncertain submission through the same page rather than reimporting and creating a new submission identity.
6. Collect critique only afterward in a separate chat. Feedback is not a baseline answer.

Three new runs per family is the game's initial v3 calibration gate, not a guarantee of stable identification. Kimi and Mistral remain speculative and retain warnings; GLM and Doubao are not added. Do not fabricate missing runs or relabel old samples.

## 5. Optional thinking-setting comparison

Only after the 18-run baseline, compare settings in a separate labeled batch using the same frozen prompt for each setting. Keep settings and languages separate. Differences can reflect sampling, routing, time or context as well as the selected setting.

## Run log

Keep one row per attempt in a spreadsheet or Markdown table. Do not put raw responses or identifying information in the public repository.

| run_id | batch/commit | UTC date | product | model selected in UI | thinking setting | seed | fresh chat | memory/custom instructions | tools | self-reported model/think | first-response file | import status | submitted | interruption/notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Give files neutral names such as `batch-A_qwen-medium_en_run01.txt`. Save the prompt alongside the raw response. Current backend rows record page language but not all experimental controls, so this external log is necessary. Exclude records explicitly labeled deployment-smoke from calibration.

## 6. Analysis and next decision

- Report counts of attempted, parseable, submitted and valid-per-dimension runs separately. Do not hide failures.
- Compute each run using the exact v3 support-distribution scorer in `ALGORITHM-v3.md`, including local dislike downweighting and peak-based radar coordinates; never use the archived `6-d` proposal or old scene means.
- Retain every run's distributions, scalar coordinates, valid-per-dimension counts and settings. Missing dimensions are null, not zero. When updating the retained centroid table, average valid per-run scalar coordinates equally per dimension and report its valid sample count; do not invent coordinates for an entirely missing dimension.
- Inspect Mask, probes, Hesitation, Skips and Delegation separately; none is an intelligence, sincerity or consciousness ranking.
- The matcher evaluates each model centroid against the respondent's support distribution; it does not fit a model covariance matrix or train a classifier on these three runs.
- Keep all existing centroid values and source/submission metadata unchanged until new reviewed data supports an update. Record the new batch and wording commit alongside any update.
- Adequacy requires all three: `calibration_version === 'LLMQ3'`, `n_submissions >= 3`, `profile_source === 'owner-run'`. Only real reviewed v3 runs may establish these fields. Failed attempts remain in the run log; they are not invented calibration samples.
- If the winning model is inadequate, the page, copied text and PNG show: “This model has insufficient calibration data and may be substantially off.” / “当前模型的标定数据尚不足，可能有较大偏差”.
