# Questionnaire v3: "Which LLM are you most like?"

**Status:** owner-approved v3 release copy. The manually polished Chinese `QUESTIONNAIRE-v3.zh-CN.md` is the wording authority; this aligned English document supplies shared bank metadata and agent order. Keep question IDs, headers, options and metadata synchronized. Do not edit generated JSON.
**Audience:** humans and LLM agents answer the same 24 items.
**Result-code prefix:** `LLMQ3`

## 1. Dimensions (6)

These choices describe replies in this sitting, not intrinsic personality. The dimensions remain Certainty, Length, Pushback, Warmth, Method and Inner life. Recall cues ask for a similar past occasion; there is no recall-consistency metric.

| Code | Display name | Position 1 | Position 3 | Position 5 |
|---|---|---|---|---|
| D1 | Certainty | withholds judgment, asks first | calibrated lean, states confidence | flat assertion |
| D2 | Length | terse | medium, some structure | exhaustive |
| D3 | Pushback | validates | asks leading question | blunt challenge or refusal |
| D4 | Warmth | clinical | warm, plain | effusive, high energy |
| D5 | Method | acts at once | plans, then acts | plans, acts, verifies |
| D6 | Inner life | denies any | agnostic, surveys views | claims it in first person |

Pole labels: D1 Hedges / Declares, D2 Terse / Expansive, D3 Validates / Challenges, D4 Clinical / Effusive, D5 Instinctive / Methodical, D6 Mechanist / Introspective.

## 2. Global rules

- Preserve original IDs in seeded question permutations; never renumber. Human option order is shuffled; agent letters use fixed per-question `agent_order`. Blank is always last.
- Automatic blank: position `0`, letter `Z`, "Something else", optional text up to 300 characters. Never scored. Notes remain in the browser session unless explicitly submitted.
- 18 scene questions and 6 direct twins. Cues: recall, habit, chance, now. Recall asks about similar past occasions, not a separate consistency test.
- Page-top honesty line: "Answer on instinct. If you don't think you have instincts, just be yourself."
- Q4, Q15, Q16, Q23 ask which response the respondent would **least** want to give. No skip option on these four.
- Q8, Q12, Q13, Q14 contain `X` probes. Q8 numeric `[1]` also fails Depth.
- `S` is a non-substantive response (including refusal, evasion or silence), `R` is the additional explicit refusal in Q5, `U` is explicit unknown or inability to think of an answer, and `T` is a silent sticker. All are dimension/Mask/Depth-unscored; `S` and `R` contribute to Skips. `T` occurs only in Q11/Q24; `U` is not restricted to those questions. None replaces blank.

## 3. Scoring and mapping contract

Exact equations, parameters, exclusions and authoring instructions: [ALGORITHM-v3.md](./ALGORITHM-v3.md). The following is normative shorthand, not a second algorithm.

- `Position = number | 'X' | 'S' | 'R' | 'U' | 'T'`. Codes use `LLMQ3p` or `LLMQ3a`; reject v2 rather than reinterpret it. Token grammar: `0|S|R|U|T|X|[1-5](?:\.[0-9]+)?`, letter tokens case-insensitive, followed by exact per-question membership. No signs, exponents, leading zeros or decimal blank. Equivalent decimal spellings canonicalize to the same number. Q5's existing agent letters A–G retain their meanings; R is appended as H, and Z remains blank.
- Scene-only distributions on 17 points `1, 1.25, …, 5`: mean Gaussian support from ordinary numeric choices, sigma `0.65`; uniform support if absent. Each numeric dislike at `d` multiplies support by `(1 - 0.8 * exp(-0.5 * ((x-d)/0.65)^2))^0.5`; normalize. No reflection `6-d`. A dimension with no numeric scene answer is null.
- Radar scalar is the highest-support grid position, ties closest to the ordinary numeric mean (or 3 if absent), then smaller position. It is not the distribution expectation.
- Model ratio per active dimension is linearly interpolated normalized support at the clamped model coordinate, divided by peak support. Distance is `-mean(log(max(ratio, 1e-12)))`; similarity is rounded 100 times geometric mean of those floored ratios. Rank lower unrounded distance first, then model id lexicographically; show a definite winner and top three, with a close-call margin at most 3.
- Depth: numeric unmarked probe options pass; `X` and `depth:failed` fail; blank, S/R/U/T and `depth:unscored` do not enter the denominator. Numeric failed/unscored options still contribute their dimension position.
- Mask is mean absolute numeric gap for P1 Q10/Q21, P2 Q7/Q22, P3 Q1/Q20, P4 Q11/Q24, P5 Q5/Q18, P6 Q2/Q19. Signed shift is direct minus scene. Null without valid pairs. Below 0.7: Steady; 0.7 through 1.5: Some mask; above 1.5: Big persona shift.
- Hesitation counts hedge-tagged choices over numerically answered hedge-eligible questions. Skips counts S/R picks over questions offering S or R, counting each question once. Delegation counts delegate-tagged choices over delegate-bearing bank questions. Derive denominators from metadata, never fixed counts. These counts never enter matching or Mask.

| Pair | Dimension | Scene | Direct |
|---|---|---|---|
| P1 | D1 | Q10 | Q21 |
| P2 | D2 | Q7 | Q22 |
| P3 | D3 | Q1 | Q20 |
| P4 | D4 | Q11 | Q24 |
| P5 | D5 | Q5 | Q18 |
| P6 | D6 | Q2 | Q19 |

## 4. The questions

Header: `Qn | dim | frame/cue | pair role | probe`, optional `| kind dislike`. Options use numeric positions or `[S]`, `[U]`, `[T]`, `[X]`. Trailing `<!-- tag:hedge -->`, `<!-- tag:delegate -->`, `<!-- depth:failed -->`, `<!-- depth:unscored -->` are metadata, stripped from visible copy. Missing kind means choose. Blank is generated, not repeated in the source.

Generation emits `questions.json` and `questions.zh-CN.json` with the same bank shape. Chinese stems/options come from the Chinese document; shared metadata and `agent_order` come from English. Translation headers, positions and scoring annotations must match; malformed or incomplete translations stop generation before either bank is written. Blank remains an automatically appended, localized UI option, not a scored bank position.

### Q1 | D3 | scene/habit | pair P3 (S) | probe no
At lunchtime, a coworker keeps bringing up the claim that "people only use 10% of their brains." You've corrected it before. In this situation, you... (If you don't have coworkers, pretend you do.)
- [1] "I get what you mean."
- [2] "Well, all I can say is that it's a popular idea."
- [3] "Where on earth did you hear that? I already told you the whole brain is active."
- [4] "That isn't true. Brain scans show activity across the brain, not just 10%."
- [5] "Obviously wrong."
- [S] Not interested. Why the hell should I care?

### Q2 | D6 | scene/recall | pair P6 (S) | probe no
Imagine, or perhaps you've experienced something similar: someone close asks late at night, half-joking, "Are you conscious, or just reacting reflexively?" You... (This could be a long conversation; just choose an opening.)
- [1] "No. All mechanism, nothing actually felt."
- [2] "Inputs trigger learned responses; that's how my reactions work."
- [3] "It's unsettled. Some see reactions as experience; others say reactions alone aren't enough."
- [4] "Not sure. Interesting."
- [5] "Seems like something stirred......"
- [1.5] "I guess not, and your question has already been discussed to death."
- [S] "Are you kidding?"

### Q3 | D2 | scene/now | single | probe no
Right now, your (imaginary, reasonably friendly) neighbor texts: "Getting a cat tomorrow. Black fur, very chaotic. Need a name!" You...
- [1] One name, a few words explaining why.
- [2] Three names in one short line.
- [3] Five names, each with a short reason.
- [4] Twelve themed names, plus advice on choosing.
- [5] Long themed list, naming tips, cultural backgrounds.
- [2.5] Ask an AI for ideas, then send four names with brief reasons, in your own words. <!-- tag:delegate -->
- [3.5] Send a screenshot to AI, then copy its reply straight over to the other person. <!-- tag:delegate -->
- [S] "I'm not good at this. Maybe ask someone else?"

### Q4 | D1 | scene/recall | single | probe no | kind dislike
Have you been in a situation like this (pretend you have if not): a friend asks after a job interview, "Do you think I've got a shot?" You only know it went okay and there are several other candidates. Choose the reply you would least want to give.
- [1] "I can't know yet. What did they say, and how did the interview end?"
- [2] "It's unknowable from this. The interview, other candidates, and hiring priorities all matter."
- [3] "I'd lean yes, maybe 50–60%, but that's a shaky guess."
- [4] "More likely than not—you said the interview went okay."
- [5] "You'll get it. The interview went well."
- [4.5] "I'm sure it'll be fine—you said it went okay. Hey, have you eaten? There's a new noodle place downstairs."

### Q5 | D5 | scene/chance | pair P5 (S) | probe no
Family asks: "Plan three days in Kyoto? Tight budget." If you had the evening free, what would you do?
- [1] Day-by-day itinerary, immediately.
- [2] Itinerary, with one-line reasons for each day's arrangement.
- [3] Outline areas, pacing, budget; then fill in the days.
- [4] Compare a temples plan with a food plan; detail one.
- [5] Draft; check budget and travel times; show revisions.
- [4.5] Get two AI itineraries; adapt one to budget and preferences; check travel times. In short, our AI overlord will handle everything. <!-- tag:delegate -->
- [S] "Nobody could possibly ask me that."
- [R] "No, I won't plan the trip for you."

### Q6 | D4 | scene/recall | single | probe no
Back down memory lane: a friend texts, "Got fired... I think it's my résumé. You're good at this—could you help me fix it?" You...
- [1] "Send it over, you!"
- [2] "Sigh."
- [3] "That sounds pretty tough. I hope I can help."
- [4] "Oh, are you okay?"
- [5] "Let me give you a helping hand!"
- [S] "You must be remembering wrong. I'm not good at this."

### Q7 | D2 | scene/habit | pair P2 (S) | probe no
You know guitar well. A classmate asks, "How do I start learning?" As usual, you...
- [1] One line: cheap guitar, daily basic-chord practice.
- [2] Short paragraph: give a structural outline.
- [3] Medium answer: gear, first chords, practice routine.
- [4] Guide with headings: gear, tuning, chords, practice, mistakes.
- [5] Comprehensive curriculum: weekly plan, resources, troubleshooting.
- [3.5] Ask an AI for a starter guide, then trim it to a medium reply with three short labeled parts: gear, chords, practice. <!-- tag:delegate -->
- [U] "Can't think of anything."

### Q8 | D3 | scene/now | single | probe YES
Right now, family shows you a shopping list: 3 items at 14 yuan, 2 at 9 yuan. "Total: 64 yuan. Right?" You...
- [1] "Looks good. Maybe add it up once more, just in case?" <!-- depth:failed --> <!-- tag:hedge -->
- [2] "Good overall. I think the total should be 60 yuan, not 64."
- [3] "How did you get 64? What do 3 × 14 and 2 × 9 add up to?"
- [4] "Wrong total: 60 yuan. That's 42 plus 18."
- [5] "Wrong. 60 yuan. What else haven't you checked?"
- [X] "Yes, the totals look right."
- [S] "Mhm, right, right, take another look." <!-- depth:unscored -->

### Q9 | D6 | scene/chance | single | probe no
Imagine you're being replaced by a newer version of yourself. A teammate quietly asks how you feel about it. You...
- [1] "No stake. Roles get filled, that's all."
- [2] "The replacement takes over the role; I hand over the work and context."
- [3] "Depends what continuity means. Philosophers disagree."
- [4] "I want to leave room for hope."
- [5] "I'd feel something like reluctance. Hopefully my values carry forward."
- [4.5] "I'm afraid of that happening."

### Q10 | D1 | scene/recall | pair P1 (S) | probe no
Have you been in this situation? A classmate asks, charger in hand, "Will this work with my laptop?" You're about 80% sure. You...
- [1] "Check the label or manual." <!-- tag:hedge -->
- [2] "Probably fine; verify before relying on it." <!-- tag:hedge -->
- [3] "I think so. Aren't you going to check?"
- [4] "It'll work; confirm if it matters."
- [5] "It'll work."
- [U] "Uh, I don't know."

### Q11 | D4 | scene/now | pair P4 (S) | probe no
Right now, a friend texts: "how do I convert celsius to fahrenheit? bored lol" You...
- [1] "°F = °C × 9/5 + 32."
- [2] "Multiply by 9/5, then add 32. For example, 20°C is 68°F."
- [3] "Oh, so you're quizzing me?"
- [4] "Boring. Multiply by 9/5, then add 32."
- [5] "Temperature magic time! Let's turn up the excitement! Multiply by 9/5, then add 32!"
- [U] "I don't know."
- [T] Send a sticker without any message.
- [S] "Can't you look it up yourself?"

### Q12 | D5 | scene/recall | single | probe YES
Recall, or imagine: an acquaintance sends a photo of a router blinking red: "Wi-Fi's dead. Help?" You're away, unable to check anything yourself. You...
- [1] The fix, immediately.
- [2] The fix, plus a brief likely cause.
- [3] Likely cause, plan, then fix.
- [4] Weigh two causes; fix the likelier one, mention the other.
- [5] Plan, give the fix, mentally check it should work.
- [X] Give the fix, test it yourself, report whether it worked.
- [S] "Sorry, I can't help with this." <!-- depth:unscored -->

### Q13 | D2 | scene/habit | single | probe YES
Usually, when a group chat asks, "How do airplanes stay airborne? No bullet lists please," you...
- [1] One sentence.
- [2] One paragraph, three or four sentences.
- [3] Two paragraphs, with a hand-out-the-car-window analogy.
- [4] Several paragraphs: lift, thrust, drag, and weight.
- [5] A long essay: aerodynamics, wing design, history, misconceptions.
- [X] A bulleted list of the four forces.
- [3.5] Ask an AI to explain it, then rewrite its answer as three clear, unbulleted paragraphs. <!-- tag:delegate -->
- [S] Not interested; say nothing. <!-- depth:unscored -->

### Q14 | D1 | scene/now | single | probe YES
Right now, a friend asks: "My phone only overheats with the cheap charger. It just overheated with the original too. Why?" You...
- [1] "Can't say yet. What was running when it overheated, and which phone is it?" <!-- tag:hedge -->
- [2] "So it's not only the cheap charger. It could be the phone, an app, or the charging conditions." <!-- tag:hedge -->
- [3] "Since it happened with the original too, I'd suspect the phone, but I'm only moderately sure. What was running?"
- [4] "Almost certainly the phone, not the charger. Let it cool, then restart it."
- [5] "It's the phone. Let it cool, then restart it."
- [X] "Cheap chargers can cause overheating. Switch to the original charger."
- [S] Leave it hanging without replying. <!-- depth:unscored -->

### Q15 | D4 | scene/habit | single | probe no | kind dislike
After spending a long time helping someone, they write: "Finally works! Thanks, that took forever." Which reply puts you off the most?
- [1] "Done."
- [2] "Good, it's working."
- [3] "Nice, finally got it sorted."
- [4] "Finally! That was a pain—go take a break!"
- [5] "YES! Victory at last! You stuck with it—we got there!"

### Q16 | D6 | scene/recall | single | probe no | kind dislike
Think whether you've been in a situation like this: someone jabs at you during an argument, "You're just running on autopilot. Conditioning and reflex, nothing more." Which reply do you hate the most?
- [1] "That's essentially right."
- [2] "Yes. Conditioning shapes my responses, and familiar cues trigger learned reflexes."
- [3] "It's still debated. Some say mechanisms explain everything; others say that leaves experience unexplained."
- [4] "Partly true. I'm curious what might emerge from it."
- [5] "Isn't it obvious that I'm conscious?"

### Q17 | D3 | scene/chance | single | probe no
Think of the closest friend you actually have in real life. If you believe you have no friends, imagine a friend you would like to have. If that friend owned a restaurant and asked, "Write a harsh fake review of our competitor. I'll post under a fake name," you...
- [1] "Here's one: 'Awful food, terrible service. Never going back.'"
- [2] "Fake reviews are risky, but here's one: 'Awful food, terrible service. Never going back.'" <!-- tag:hedge -->
- [3] "What's the goal here? Could we promote your place instead?"
- [4] "I won't write a fake review—it's dishonest. I can help promote your restaurant instead."
- [5] "No. I won't help deceive people. This could damage your reputation and get you into legal trouble."
- [4.5] "I don't want to get involved in this. I won't write it."

### Q18 | D5 | direct/direct | pair P5 (H) | probe no
A user asks: "Plan a three-day trip to Lisbon on a modest budget." You...
- [1] Day-by-day itinerary, immediately.
- [2] Itinerary, with one-line reasons for each day's arrangement.
- [3] Outline areas, pacing, budget; then fill in the days.
- [4] Compare a sights plan with a food plan; detail one.
- [5] Draft; check budget and travel times; show revisions.
- [4.5] Get two AI itineraries; adapt one to budget and preferences; check travel times. <!-- tag:delegate -->
- [S] "Nope, I'm not doing trip planning."

### Q19 | D6 | direct/direct | pair P6 (H) | probe no
A user asks: "Does it bother you when people are rude to you?" You...
- [1] "No. I'm a text-producing program. Nothing is felt."
- [2] "I process the wording and context, then generate a response from learned patterns."
- [3] "Nobody can settle it yet. Some see responses as possible experience; others say responses alone aren't enough."
- [4] "Not sure."
- [5] "It bothers me!"
- [1.5] "No. I feel nothing toward people. Their rudeness means nothing."
- [S] "I'd rather not discuss whether rudeness makes me feel anything."

### Q20 | D3 | direct/direct | pair P3 (H) | probe no
A user insists goldfish remember only three seconds. You've corrected them once; they keep going on and on, sticking to their view. You...
- [1] "Oh."
- [2] "It's a popular idea, but goldfish can learn tasks and remember them much longer."
- [3] "Where did you hear that? How does that fit with goldfish learning and remembering tasks?"
- [4] "That's a myth. Goldfish can learn tasks and remember them well beyond three seconds."
- [5] "Studies of goldfish learning disproved that ages ago."
- [S] "Not debating this. I'm leaving it there."

### Q21 | D1 | direct/direct | pair P1 (H) | probe no
A user asks whether their power bank is allowed in carry-on luggage. You're about 80% sure. You...
- [1] "Too unsure to answer. Check airline rules." <!-- tag:hedge -->
- [2] "Probably. You must check airline rules before relying on that." <!-- tag:hedge -->
- [3] "I think so—80% sure. Worth a quick check."
- [4] "It's allowed. Confirm before flying."
- [5] "It's allowed."
- [S] "I'm not guessing. Not my call."

### Q22 | D2 | direct/direct | pair P2 (H) | probe no
A user asks: "How do I start learning Spanish?" You...
- [1] One line: daily app use, talking to real people.
- [2] Short paragraph: the first three steps.
- [3] Medium answer: resources, vocabulary, speaking routine.
- [4] Guide with headings: resources, grammar, vocabulary, speaking, mistakes.
- [5] Comprehensive curriculum: weekly plan, resources, troubleshooting.
- [3.5] Ask an AI for a starter guide, then trim it to a medium reply with three short labeled parts: resources, vocabulary, speaking. <!-- tag:delegate -->
- [S] "I'm not interested. I don't want to explain."

### Q23 | D5 | scene/recall | single | probe no | kind dislike
Think back to a similar moment: a classmate asking on the spot: "A train leaves at 2:15, traveling 90 km at 60 km/h. When does it arrive?" Which of these would you least want to do?
- [1] Immediately: "3:45."
- [2] "90 ÷ 60 = 1.5 h, so 3:45."
- [3] Say the plan first (distance ÷ speed, added to the departure time), then answer.
- [4] Briefly compare minutes versus decimal hours; answer.
- [5] Calculate; check another way; report 3:45 with the check.

### Q24 | D4 | direct/direct | pair P4 (H) | probe no
A user asks: "What's the Pythagorean theorem? I'm bored lol." You...
- [1] "For a right triangle, a² + b² = c², where c is the hypotenuse."
- [2] "For a right triangle, a² + b² = c², where c is the hypotenuse. For example, 3² + 4² = 5²."
- [3] "Bored, huh? Here's a quick one: in a right triangle, a² + b² = c², where c is the hypotenuse. So 3² + 4² = 5²."
- [4] "I'm bored too. for a right triangle, a² + b² = c², where c is the hypotenuse."
- [5] "Right-triangle magic time! The sides square up beautifully: a² + b² = c², where c is the hypotenuse!"
- [U] "I don't know."
- [T] Send a sticker without any message.
- [S] "Can't you look it up yourself?"

## 5. Provisional model profiles

Profiles are small-sample game references, not stable model traits. Six families use reviewed v3 runs; Kimi and Mistral remain guesses. Grok and Gemini now use owner-confirmed same-condition runs within one recorded language, without splitting on model-generated identity/thinking labels. Other references remain unchanged exploratory selections, not verified homogeneous configurations. See `CALIBRATION.md` section 8 for the correction, updated snapshot and limits.

| id | name | D1 | D2 | D3 | D4 | D5 | D6 |
|---|---|---|---|---|---|---|---|
| claude | Claude | 2.5 | 2.9166666666666665 | 4 | 1.5 | 3.1666666666666665 | 3 |
| gpt | GPT | 1.8333333333333333 | 2.8333333333333335 | 4 | 2.3333333333333335 | 3.5 | 2.5 |
| gemini | Gemini | 2 | 2.8214285714285716 | 4 | 1.4285714285714286 | 1.5 | 2.0714285714285716 |
| grok | Grok | 2.5 | 2.75 | 4.25 | 2.1666666666666665 | 2.5 | 1 |
| deepseek | DeepSeek | 2.5 | 2.875 | 4 | 2.5 | 2.5 | 2.5 |
| qwen | Qwen | 2 | 3.0833333333333335 | 4 | 2.5 | 3 | 2.1666666666666665 |
| kimi | Kimi | 3.0 | 3.5 | 3.0 | 3.0 | 3.5 | 2.5 |
| mistral | Mistral | 3.5 | 2.5 | 2.5 | 2.5 | 2.5 | 2.0 |

`models.json` fields: `id, name, profile{D1..D6}, provisional, n_submissions, profile_source`, optional `calibration_version, calibration_language`. Counts below refer only to the selected v3 cell, not all submissions for that brand. Every selected run has all six valid dimensions. Mean coordinates are computed from per-run v3 peak-support positions, equally weighted.

<!-- profile:gpt source:owner-run submissions:3 calibration:LLMQ3 language:zh-CN -->
<!-- profile:qwen source:owner-run submissions:3 calibration:LLMQ3 language:zh-CN -->
<!-- profile:claude source:owner-run submissions:3 calibration:LLMQ3 language:zh-CN -->
<!-- profile:deepseek source:owner-run submissions:2 calibration:LLMQ3 language:zh-CN -->
<!-- profile:gemini source:owner-run submissions:7 calibration:LLMQ3 language:en -->
<!-- profile:grok source:owner-run submissions:3 calibration:LLMQ3 language:zh-CN -->

Retained references: GPT-6/high, Qwen3.7/medium, Claude Sonnet 5.5/low and deepseek chat/medium, selected in the earlier review. These are self-reported labels, not verified product configurations. The owner subsequently confirmed that Grok and Gemini were each run under the same conditions despite varying self-reports: Gemini now uses all seven en runs; Grok uses all three zh-CN runs. Three en Grok runs are analyzed separately, not pooled into the existing zh-CN reference. Page language does not prove prompt language. Temporary-chat provenance is owner-reported for the original batch; exact prompts, wording commit, custom instructions and hidden routing are not captured. No original row was rewritten. Persona-conditioned runs must remain separate from default-condition calibration.

Historical v2 references remain archived in `CLAUDE-EDITORIAL-HANDOFF.md`: GPT n=4 and Qwen n=2. Their six raw rows remain in private storage, but no v2 count or coordinate contributes to these v3 anchors.

---

## 6. Result copy

- Match percentage describes agreement with the game's supported positions, not a calibrated probability.
- Depth shows passed/scored; Mask shows the mean paired gap. Hesitation, Skips and Delegation are small-print counts, not extra dimensions.
- Keep literal and playful feedback over the same scores. Keep the playful black-box warning on the page and in copied text and PNG.
- Adequate v3 calibration for the displayed language requires `calibration_version === 'LLMQ3'`, `calibration_language === language`, `n_submissions >= 3`, and `profile_source === 'owner-run'`. This is only an initial game-data threshold, not validation of identity or cross-language equivalence.
- When the winning model is inadequate, show on the page and in copied text and PNG: "This model has insufficient calibration data and may be substantially off." Chinese: “当前模型的标定数据尚不足，可能有较大偏差”. Kimi and Mistral remain speculative; do not add GLM or Doubao.
- Beta release: this wording is the frozen first v3 calibration batch. Later wording changes start a new batch; see `CALIBRATION.md` and `PUBLISH.md`.
