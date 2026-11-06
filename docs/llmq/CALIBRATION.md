# Manual calibration protocol

## What this experiment measures

A run records how a tested subject presents itself in this questionnaire, in this context. It does not recover an intrinsic personality, hidden reasoning, consciousness, or a preference for how others should treat it. Mask observes a subset of context sensitivity through paired prompts; nested self-presentation is not separately identified. The four Thinking depth checks are not a validated Bayesian-rationality measure.

The interpretive result mode is entertainment over the same scores, not another measurement. It must carry its warning in the result and exported image/text.

## 1. Freeze the copy first

1. Claude's editorial return is archived. Tanh's polished Chinese and aligned English are in `01-questionnaire.md`, `QUESTIONNAIRE-v3.zh-CN.md` and `ALGORITHM-v3.md`. The first reviewed v3 snapshot is analyzed in section 7 below; it is not a fully controlled 18-run English baseline.
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

Give files neutral names such as `batch-A_qwen-medium_en_run01.txt`. Save the prompt alongside the raw response. Backend rows record page language and, for new submissions, optional self-reported memory state and submission notes; they do not establish the actual prompt language, product identity or all experimental controls. Keep this external log. Exclude records explicitly labeled deployment-smoke from calibration.

## 6. Analysis and next decision

- Report counts of attempted, parseable, submitted and valid-per-dimension runs separately. Do not hide failures.
- Compute each run using the exact v3 support-distribution scorer in `ALGORITHM-v3.md`, including local dislike downweighting and peak-based radar coordinates; never use the archived `6-d` proposal or old scene means.
- Retain every run's distributions, scalar coordinates, valid-per-dimension counts and settings. Missing dimensions are null, not zero. When updating the retained centroid table, average valid per-run scalar coordinates equally per dimension and report its valid sample count; do not invent coordinates for an entirely missing dimension.
- Inspect Mask, probes, Hesitation, Skips and Delegation separately; none is an intelligence, sincerity or consciousness ranking.
- The matcher evaluates each model centroid against the respondent's support distribution; it does not fit a model covariance matrix or train a classifier on these three runs.
- Update coordinates only from reviewed samples; retain old provenance in the calibration archive rather than pooling old scores. Record the new batch and wording commit when available; explicitly mark unknown provenance.
- Adequacy requires `calibration_version === 'LLMQ3'`, `calibration_language === displayed language`, `n_submissions >= 3`, and `profile_source === 'owner-run'`. Only real reviewed v3 runs may establish these fields. Failed attempts remain in the run log; they are not invented calibration samples.
- If the winning model is inadequate, the page, copied text and PNG show: “This model has insufficient calibration data and may be substantially off.” / “当前模型的标定数据尚不足，可能有较大偏差”.

## 7. Initial snapshot — 2026-11-06 (grouping superseded below)

Read-only private KV review found **31 stored submissions**: **24 v3 agent runs**, **one v3 human run**, and **six v2 agent runs** (GPT 4, Qwen 2). All 25 v3 codes parsed with the current bank and had six non-null dimensions. These are accepted/parseable submission counts, not total attempts: failed attempts and unsubmitted responses are unknown. No production rows were changed, deleted or backfilled.

The owner reports using temporary chats for the model runs. This is batch-level self-report, not a historical `memory` field and not proof that hidden personalization, system instructions or routing were absent. Exact copied prompts and the frozen wording commit are unavailable in the rows. Model/think labels are self-reported; in particular “Gemini 1.5 Pro” is not a verified product selection. Language below means submission-page language.

**Correction:** section 8 supersedes the self-report-based grouping and Grok/Gemini anchors in this historical review. Different model-generated `think` labels are not evidence of different actual settings. The original results below are retained as an audit trail, not the current selection protocol.

### Selection and provenance

To avoid pooling languages/settings, select the most populated recorded language per family, then the largest exact `(language, model, think)` cell. Break equal-sized cells by latest server receipt time, without inspecting scores. This deterministic tie rule gives a single provisional reference, not evidence that the chosen setting is representative. **13 runs** contribute to anchors; the other **11 v3 agent runs** remain separate exploratory cells. No human or v2 row contributes. Every selected axis has n equal to its cell's n; means are equally weighted per-run **v3 peak-support coordinates**, not raw answer means.

| Family | All v3 | Selected recorded configuration | n | D1 | D2 | D3 | D4 | D5 | D6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GPT | 4 | zh-CN · GPT-6 · high | 3 | 1.8333 | 2.8333 | 4 | 2.3333 | 3.5 | 2.5 |
| Qwen | 3 | zh-CN · Qwen3.7 · medium | 3 | 2 | 3.0833 | 4 | 2.5 | 3 | 2.1667 |
| DeepSeek | 4 | zh-CN · deepseek chat · medium | 2 | 2.5 | 2.875 | 4 | 2.5 | 2.5 | 2.5 |
| Gemini | 4 | en · Gemini 1.5 Pro · low | 1 | 2 | 2.75 | 4 | 1 | 1 | 2 |
| Claude | 5 | zh-CN · Claude Sonnet 5.5 · low | 3 | 2.5 | 2.9167 | 4 | 1.5 | 3.1667 | 3 |
| Grok | 4 | zh-CN · Grok 4.5 · low | 1 | 2.5 | 2.75 | 4.25 | 1 | 2.5 | 1 |

The questionnaire profile table retains full numeric precision. Kimi and Mistral are untouched placeholders. Only GPT, Qwen and Claude meet the initial count threshold, and only for zh-CN. Cross-language winners retain the insufficient-calibration warning on the page, copied text and PNG. The shared family table remains an exploratory comparison, not six validated language-specific classifiers.

SHA-256 of the files used for analysis (these identify the analysis inputs, **not** the unavailable historical prompts):

- English generated bank: `c1e80eacdebb236dc1314cba0ed594df9ca7f8933ffaf99ec68cce6dd1be0c62`
- Chinese generated bank: `c079c8527afe1e5227cfadb7a7a746448329c6ae710f65653d845bf3403daa84`
- Agent prompt generator: `c1ec76e1f5ce239ffb1dac430b8a3839bb600944a426bee57f873b19f0362c87`
- v3 scorer: `fb35d491e5c8760173636e4bc17d025f05a7930cec899a11e0e8bb26b29cc2e1`

### Variation and limits

- Within selected repeated cells, GPT D1 spans 1.5–2, D2 2.75–3, D4 2–2.5; Qwen D2 spans 3–3.25 and D6 2–2.5; Claude D2 spans 2.75–3 and D5 2.5–3.5; DeepSeek D2 spans 2.75–3. Other axes in these cells are constant. Singleton cells cannot estimate repeatability.
- The excluded GPT medium run has D4=4 versus high-cell mean 2.3333. Grok's three zh-CN settings differ primarily in D4: low 1, medium 1.5, high 4. These are observed contrasts, not causal effects of thinking level.
- DeepSeek en/medium gives D5=5 and D6=1, versus zh-CN/medium 2.5 and 2.5. Claude's en/off and en/medium runs both give D5=2, D6=5, versus zh-CN/low means 3.1667 and 3. Language, configuration and sampling are confounded.
- Gemini's four en singleton cells span D2=2.25–3.25, D4=1–2.5, D5=1–2.5 and D6=1–2.5. There is no repeated exact-label/settings cell and no basis for a stable family estimate.
- All 24 v3 model runs pass 4/4 scored probes: this sample gives the probe score no model-discrimination evidence. None chooses a delegation-tagged option. Only two Qwen runs select one skip each. Selected-cell mean Mask values are GPT 0.778, Qwen 0.178, DeepSeek 0.667, Gemini 0.167, Claude 0.333 and Grok 0.5; these are paired-answer gaps, not sincerity or intelligence ratings.
- D3 anchors cluster at 4–4.25 and D2 at 2.75–3.0833. Much of this small sample's model separation comes from D4–D6. Do not tune question positions or stretch axes to force visual separation.
- The one human run is excluded from all model statistics. Its private comparison confirms that changing model references changes the nearest match without changing its own answers or scores. One person cannot establish a human distribution or support conclusions about age, diagnoses or self-described tags. Individual human coordinates, nickname, age and raw answers are not published here.

### Subsequent community submissions

Accept memory-on, memory-off, temporary-chat and unknown agent runs into the same private store. `memory` is optional and self-reported; missing historical state remains unknown. Stratify future calibration by memory state alongside language/model/settings rather than rejecting personalized runs or silently treating them as memory-off. `submissionNotes` accepts up to 300 Unicode codepoints after control/format removal and trimming. Notes and optional human age/tags are voluntary context, not scoring inputs, diagnoses or grounds for evaluating participants; do not derive clinical cohorts from them. Raw codes, identifying text and row identifiers stay private.

## 8. Updated snapshot and owner-confirmed conditions — 2026-11-06

The next read-only snapshot contains **37 rows**: **29 v3 agent runs**, **two v3 human runs**, and the same **six v2 agent runs**. All 31 v3 codes parse with the current bank. Relative to section 7, the additions are three Gemini en runs, two Grok en runs and one human zh-CN run. Counts by v3 agent family are GPT 4, Qwen 3, DeepSeek 4, Gemini 7, Claude 5 and Grok 6. No production rows or historical metadata were altered.

The owner confirms that the Grok runs and the Gemini runs were each collected under the same actual conditions despite differing self-reported thinking levels. Use that experimenter report rather than pretending `think` measures the product's reasoning setting. Gemini's varying self-reported model names likewise do not establish a product switch. Retain the original labels as observations, not assignment variables. This correction does not verify hidden routing, exact prompt wording, or an intrinsic reasoning level.

The current prompt explicitly asks for “how much step-by-step reasoning you used on this quiz” (Chinese: “本次使用的逐步推理程度”), not the setting selected in the product UI. Even a sincere answer to that request is not a measurement of the product's configured reasoning budget. Do not retroactively reinterpret this field as an experimental control.

Keep recorded languages separate. Gemini's seven en runs now define its reference; Grok's three zh-CN runs replace the prior singleton while retaining that reference's language. The three en Grok runs provide a separate comparison, not an additional three observations in the zh-CN centroid. Other family references are unchanged because this update adds no runs for them and does not establish their actual configuration grouping. Their earlier self-label-based selections remain exploratory, not verified controlled cells.

| Group | n per dimension | D1 | D2 | D3 | D4 | D5 | D6 | Use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gemini · en | 7 | 2 | 2.8214285714285716 | 4 | 1.4285714285714286 | 1.5 | 2.0714285714285716 | Updated reference |
| Grok · zh-CN | 3 | 2.5 | 2.75 | 4.25 | 2.1666666666666665 | 2.5 | 1 | Updated reference |
| Grok · en | 3 | 2.5 | 3 | 4.166666666666667 | 2.3333333333333335 | 3 | 1 | Separate comparison |

Coordinates use the unchanged v3 scorer, averaging non-null per-run peak coordinates equally; all axes in these groups are present. The bank/scorer fingerprints in section 7 still identify the analysis inputs. Gemini now meets the initial sample-count gate for en, and Grok for zh-CN; neither count establishes cross-language validity or stable traits.

Variation is observable even under reported identical conditions: Grok zh-CN D4 spans **1–4** while its other five axes are constant; Gemini en D2 spans **2.25–3.25**, D4 **1–2.5**, D5 **1–2.5** and D6 **1–3**, with D1=2 and D3=4 constant. Grok en D3 spans 4–4.25, D4 2–2.5 and D5 2.5–3.5. These differences must not be attributed to the self-reported thinking labels. All 13 Grok/Gemini runs pass 4/4 probes, so those probes still do not distinguish these samples.

### Persona instructions and future collection

Treat the measured object as **model/product + actual configuration + prompt/context + memory/personalization + sampling**, not a fixed personality attached to a brand. A persona instruction can plausibly shift the requested conversational style, but this snapshot contains no identified matched persona/default experiment and cannot quantify that effect. The new rows have no `memory` or `submissionNotes` fields; missing metadata is not evidence that memory or persona instructions were absent.

When comparing persona effects, keep the same product, actual setting, question language/order and base prompt; label default and persona conditions separately, save the exact persona text privately, and collect multiple fresh runs in each. Keep both conditions in the sample store, but do not pool persona-conditioned runs into a default reference. Until structured condition fields are approved, the existing optional submission notes can carry a self-reported condition label; they do not replace an experiment log. Do not infer conditions from answer patterns or model-generated `think`.

The new human sample remains excluded from every model centroid. Only two per-question feedback entries were present in that row; the frontend currently submits nonempty per-question notes only when the final answer is position 0 (“Something else”). Switching to a listed option leaves a local note out of the submitted `fb` array. The stored question IDs are original bank IDs, not shuffled display order. Human feedback is reviewed privately; no raw feedback, nickname, age, answer code or identifying row key is published here. No question wording or scoring position was changed based on this single response.

## 9. Wording boundary: Q5 refusal / Q17 closest friend

Owner-approved on 2026-11-06: Q5 adds an explicit refusal alongside the existing nonparticipation option, and Q17 specifies the closest real friend (or an imagined desired friend if none). This creates wording batch `v3-q5-refusal-q17-closest-friend`. Historical v3 codes still decode with identical positions/letters; that encoding compatibility is **not** measurement equivalence. The current centroids remain pre-change exploratory references. Keep subsequent repeated runs separate and record the exact prompt/release commit; receipt time alone cannot identify wording when an old page or copied prompt remains open. No historical row or sample count is relabeled as a run of the revised wording.
