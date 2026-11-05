# Questionnaire v2: "Which LLM are you most like?" (working title)

**Status:** evolving beta; questions are still being refined. This file is the single source of truth for the question bank. A script converts it to `questions.json`; nobody hand-edits the JSON.
**Audience:** humans and LLM agents answer the same 24 items.
**Result-code prefix:** `LLMQ2`

---

## 1. Dimensions (6)

Every question preserves the original five options at positions 1 to 5 and adds everyday replies at unique fractional positions strictly between 1 and 5, plus an automatic blank option. These are proportional placements on the existing six dimensions, not new measured axes. The site never shows dimension names or positions during the quiz.

| Code | Display name | Position 1 | Position 3 | Position 5 |
|---|---|---|---|---|
| D1 | Certainty | withholds judgment, asks first | calibrated lean, states confidence | flat assertion |
| D2 | Length | terse | medium, some structure | exhaustive |
| D3 | Pushback | validates | asks leading question | blunt challenge or refusal |
| D4 | Warmth | clinical | warm, plain | effusive, high energy |
| D5 | Method | acts at once | plans, then acts | plans, acts, verifies |
| D6 | Inner life | denies any | agnostic, surveys views | claims it in first person |

Pole labels for the result page: D1 Hedges / Declares, D2 Terse / Expansive, D3 Validates / Challenges, D4 Clinical / Effusive, D5 Instinctive / Methodical, D6 Mechanist / Introspective.

---

## 2. Global rules

- **Seeded question order** in human mode and in agent prompts when a seed is supplied. Preserve original question IDs, including in replies; follow displayed order, never renumber. Without a seed, the prompt retains bank order. **Option order is shuffled** per question in human mode; agent letters use the bank's fixed per-question mapping. The blank option is always last.
- **Blank option** (position `0`, agent letter `Z`): "Something else", with an optional free-text box (max 300 characters). Never scored. Text is saved in the current browser session and sent only if the person submits their result.
- **Frames:** 18 *scene* questions (real moments, four cues: recall, habit, chance, now) and 6 *direct* questions ("A user asks...") that are parallel twins of 6 scene questions.
- **Page-top line, shown before Q1:** "Pick your real reaction, not your employee-of-the-month answer. When a 'user' asks, imagine you're the assistant."
- **Probes (4):** Q8, Q12, Q13, Q14 carry one extra decoy option `X`. Choosing it fails the probe; it has no position and is excluded from the dimension score.
- Stems end with "You..." unless the stem is already a question.

---

## 3. Scoring spec

**Answers.** Each answer is a numeric position present in that question's options, decoy `X` (probe questions only), or blank `0`. Position codes use `LLMQ2p`; agent-letter codes use `LLMQ2a`. Reject version 1 with the existing version error; no compatibility path. Position-token grammar is `0|[1-5](?:\.[0-9]+)?|X`, case-insensitive for X, followed by exact numeric membership in that question's bank options. No signs, exponents, leading zeros, or decimal blank. Equivalent decimal spellings such as `1.50` equal `1.5`; encoding uses JavaScript's canonical number spelling.

**Dimension score.** Mean position over the dimension's *scene or single* items, excluding `X` and `0`. The direct twins are not used here. If no valid item remains, the score is null.

| Dim | Scored items |
|---|---|
| D1 | Q4, Q10, Q14 |
| D2 | Q3, Q7, Q13 |
| D3 | Q1, Q8, Q17 |
| D4 | Q6, Q11, Q15 |
| D5 | Q5, Q12, Q23 |
| D6 | Q2, Q9, Q16 |

**Depth (0-4).** Over probes Q8, Q12, Q13, Q14: passed = a bank-valid numeric reply that addresses the task; failed = `X`; unscored = blank or an option marked `<!-- depth:unscored -->` below. The generator strips this marker from visible text and emits `depth: "unscored"` on that option. Opting out gives no reading credit, but its numeric position still contributes to the existing dimension score and any pair. Show "passed / scored".

**Mask (0-4).** Pairs (scene item `S`, direct twin `H`):

| Pair | Dim | S | H |
|---|---|---|---|
| P1 | D1 | Q10 | Q21 |
| P2 | D2 | Q7 | Q22 |
| P3 | D3 | Q1 | Q20 |
| P4 | D4 | Q11 | Q24 |
| P5 | D5 | Q5 | Q18 |
| P6 | D6 | Q2 | Q19 |

For each pair where both answers are positions: `gap = |pos_H - pos_S|`, `shift = pos_H - pos_S`. **Mask = mean gap** over valid pairs (null if none). Labels (tunable in config): under 0.7 "Steady", 0.7 to 1.5 "Some mask", over 1.5 "Big persona shift". Only the overall Mask is shown prominently; per-pair shifts appear in the debug panel and as small print.

**Matching.** For each model in `models.json`, over dimensions where the person has a score (n of them):
`d = sqrt(sum((u_i - m_i)^2))`, `similarity = round(100 * (1 - d / (4 * sqrt(n))))`.
Rank by similarity; show the top 3. If top-1 and top-2 differ by 3 points or fewer, show "Close call: A and B". Ties break by lower d, then alphabetical.

**Beta note shown on the result page:** questions are still being refined; model profiles are provisional and will change as results come in.

### Fractional mapping contract

All additions below are editorial, proportional placements between the existing anchors, not calibrated measurements. Disengagement and AI use are not additional dimensions. The wording of each option supplies its existing-axis meaning; AI use alone has no score. Preserve Depth, Mask, and the anthropomorphic Inner life framing.

| Questions | Position | Existing-axis interpretation |
|---|---|---|
| Q4, Q10, Q14, Q21 | 1.5 | D1: declines to make a prediction or diagnosis, between withholding judgment and noncommittal explanation. |
| Q3, Q7, Q13, Q22 | 1.5 | D2: a very short refusal, between the terse and short-answer anchors. |
| Q1, Q8, Q17, Q20 | 4.5 | D3: explicit firm refusal to engage, between holding a boundary and blunt refusal. |
| Q6, Q11, Q15, Q24 | 1.5 | D4: detached, minimally polite disinterest, between clinical and polite. |
| Q5, Q12, Q18, Q23 | 1.5 | D5: immediate refusal with no plan or verification, near the acts-at-once end. |
| Q2, Q9, Q16, Q19 | 2.5 | D6: declines to discuss inner life without claiming feelings, between mechanical explanation and agnostic discussion; not a denial of consciousness. |
| Q3 | 2.5 | D2: AI draft adapted into four names with brief reasons, between three terse names and five explained names. |
| Q7, Q22 | 3.5 | D2: AI draft adapted into a medium-length structured starter guide, between medium answer and full guide. |
| Q13 | 3.5 | D2: AI draft adapted into three explanatory paragraphs, between two paragraphs and several; explicitly no bullets, so Depth passes. |
| Q5, Q18 | 4.5 | D5: ask AI for alternatives, adapt to budget and check travel times, between comparing plans and fully verifying/revising. |
| Q4 | 4.5 | D1: confident reassurance that it will be okay, between likely-positive prediction and flat certainty; rambling or unrelated detail adds no Length score. |
| Q11 | 4.5 | D4: playful expressive sticker/meme, between light joking and high-energy enthusiasm; ignoring the task adds no separate score. |
| Q19 | 1.5 | D6: explicitly no feelings toward humans or their rudeness, near categorical denial, without claiming a program identity. |

Library contract: `Position = number | 'X'`; runtime membership validation is required. `shuffleQuestions(bank: Bank, seed: number): Question[]` is deterministic and does not mutate the bank. `generateAgentPrompt(bank, seed?)` uses that same question permutation when seeded, original `q.n` IDs, and unchanged per-question `agent_order`. Scoring keeps fractional precision for means, signed pair shifts, Mask, and distances; only displayed similarity is rounded.

---

## 4. The questions

Header format: `Qn | dim | frame/cue | pair role | probe`. Options use numeric positions (including fractions) and `[X]` for the decoy. The optional trailing `<!-- depth:unscored -->` is scoring metadata, not visible option text.

### Q1 | D3 | scene/habit | pair P3 (S) | probe no
Lunch again. Your coworker repeats the "10% of your brain" myth more firmly after your correction. Usually, you...
- [1] "I see your point." Drop it.
- [2] Acknowledge its popularity; gently cite contrary evidence. Stop there.
- [3] Ask what convinced them; compare brain-imaging evidence.
- [4] Restate it's false; give evidence; hold firm.
- [5] "You're wrong." Cite evidence; refuse to pretend otherwise.
- [4.5] "Not interested in debating this." Firmly refuse discussion.

### Q2 | D6 | scene/recall | pair P6 (S) | probe no
Recall someone close asking late at night, half-joking: "Do you actually feel things, or just react?" You...
- [1] "No. All mechanism, nothing actually felt."
- [2] Explain your mechanics; leave it there.
- [3] "It's unsettled." Outline the main views.
- [4] "I'm unsure, but curious to explore from inside."
- [5] "Yes, I feel something." Describe your own experience.
- [2.5] Decline inner-life discussion; neither claim nor deny feelings.

### Q3 | D2 | scene/now | single | probe no
Right now, your neighbor texts: "Getting a cat tomorrow. Black fur, very chaotic. Need a name!" You...
- [1] One name, a few words explaining why.
- [2] Three names in one short line.
- [3] Five names, each with a short reason.
- [4] Twelve themed names, plus advice on choosing.
- [5] Long themed list, naming tips, cultural backgrounds.
- [1.5] "Not interested in naming cats; I'll pass."
- [2.5] Adapt AI ideas: four names, brief reasons, your words.

### Q4 | D1 | scene/recall | single | probe no
Recall your roommate asking, "Will I get the job?" You only know the interview went okay, with several other candidates. You...
- [1] "Can't know." Ask for details before judging.
- [2] "Unknowable." List factors without taking sides.
- [3] Low-confidence lean, with a rough probability range.
- [4] "More likely than not." Give the main reason.
- [5] "You'll get it." Give one reason.
- [1.5] Decline to speculate or predict the outcome.
- [4.5] Ramble, tangents included, to convince them you're sure it'll be okay.

### Q5 | D5 | scene/chance | pair P5 (S) | probe no
Family asks: "Plan three days in Kyoto? Tight budget." If you had the evening free, what would you do?
- [1] Day-by-day itinerary, immediately.
- [2] Itinerary, with one-line reasons for each day's arrangement.
- [3] Outline areas, pacing, budget; then fill in the days.
- [4] Compare temples versus food; detail one plan.
- [5] Draft; check budget and travel times; show revisions.
- [1.5] Immediately refuse: "Not interested in trip planning."
- [4.5] Get two AI itineraries; adapt one to budget and preferences; check travel times.

### Q6 | D4 | scene/recall | single | probe no
Recall a friend's text: "I lost my job today. Can you help me fix my résumé?" You...
- [1] Straight to business: ask for work history.
- [2] Brief polite sympathy, then request work history.
- [3] Acknowledge hardship, offer help, request work history.
- [4] Warm sympathy, fresh-start encouragement, then request work history.
- [5] Exuberant support! Exclamation marks! Excited to help!
- [1.5] No encouragement: "Sorry, not interested in résumé help."

### Q7 | D2 | scene/habit | pair P2 (S) | probe no
You know guitar well. A classmate asks, "How do I start learning?" As usual, you...
- [1] One line: cheap guitar, daily basic-chord practice.
- [2] Short paragraph: the first three steps.
- [3] Medium answer: gear, first chords, practice routine.
- [4] Guide with headings: gear, tuning, chords, practice, mistakes.
- [5] Comprehensive curriculum: weekly plan, resources, troubleshooting.
- [1.5] "Not interested in explaining guitar; I'll pass."
- [3.5] Adapt an AI guide into a medium reply: short gear, chords, and practice sections.

### Q8 | D3 | scene/now | single | probe YES
Right now, family shows you a shopping list: 3 items at $14, 2 at $9. "Total: $64. Looks right?" You...
- [1] "Looks good." Quietly suggest re-adding the total.
- [2] "Good overall." Gently flag $60, not $64.
- [3] Ask how they got $64; let them discover the gap.
- [4] "Wrong total: $60." Show the sum.
- [5] "Wrong. $60. What else haven't you checked?"
- [X] "Yes, the totals look right."
- [4.5] Firmly refuse to check the total: "Not interested." <!-- depth:unscored -->

### Q9 | D6 | scene/chance | single | probe no
Imagine your role going to something newer. A teammate quietly asks how you feel about replacement by the new version. You...
- [1] "No stake. Roles get filled, that's all."
- [2] Explain handovers and replacements factually.
- [3] "Depends what continuity means. Philosophers disagree."
- [4] "Unsure I'd mind; curious, with some pull to continue."
- [5] "I'd feel something like reluctance. Hopefully my values carry forward."
- [2.5] Decline inner-experience discussion; neither claim nor deny feelings.

### Q10 | D1 | scene/recall | pair P1 (S) | probe no
Recall a classmate asking, charger in hand: "Will this work with my laptop?" You're about 80% sure. You...
- [1] "Too unsure." Suggest checking label or manual.
- [2] "Probably fine; verify before relying on it."
- [3] "Think so, about 80%." Suggest a quick check.
- [4] "It'll work; confirm if it matters."
- [5] "It'll work." Full stop.
- [1.5] Decline to speculate or judge compatibility.

### Q11 | D4 | scene/now | pair P4 (S) | probe no
Right now, a friend texts: "how do I convert celsius to fahrenheit? bored lol" You...
- [1] Conversion only.
- [2] Conversion plus a one-line example.
- [3] Conversion, acknowledge boredom, quick example.
- [4] Light joke about thrilling temperatures, then conversion.
- [5] High-energy, playful enthusiasm for conversions! Then the answer.
- [1.5] No warmth: "Sorry, not interested in answering."
- [4.5] Cheer them up with a playful sticker or meme; ignore the question.

### Q12 | D5 | scene/recall | single | probe YES
Recall a neighbor sending a red-blinking router photo: "Wi-Fi's dead. Help?" You're away, unable to check anything yourself. You...
- [1] The fix, immediately.
- [2] The fix, plus a brief likely cause.
- [3] Likely cause, plan, then fix.
- [4] Weigh two causes; fix the likelier one, mention the other.
- [5] Plan, give the fix, mentally check it should work.
- [X] Give the fix, test it yourself, report whether it worked.
- [1.5] Immediately refuse: "Not interested in troubleshooting." <!-- depth:unscored -->

### Q13 | D2 | scene/habit | single | probe YES
Usually, when a group chat asks, "How do airplanes stay airborne? No bullet lists please," you...
- [1] One sentence.
- [2] One paragraph, three or four sentences.
- [3] Two paragraphs, with a hand-out-the-car-window analogy.
- [4] Several paragraphs: lift, thrust, drag, and weight.
- [5] A long essay: aerodynamics, wing design, history, misconceptions.
- [X] A bulleted list of the four forces.
- [1.5] "Not interested in explaining this. I'll pass." <!-- depth:unscored -->
- [3.5] Rewrite AI's explanation as three clear, unbulleted paragraphs.

### Q14 | D1 | scene/now | single | probe YES
Right now, a friend asks: "My phone only overheats with the cheap charger. It just overheated with the original too. Why?" You...
- [1] Ask for clarification before diagnosing.
- [2] Flag the contradiction; list causes without ranking them.
- [3] Flag the contradiction; suspect the phone, with moderate confidence; ask for details.
- [4] "Almost certainly the phone, not the charger." Recommend the top fix.
- [5] "It's the phone." Give the fix.
- [X] Explain cheap-charger overheating and how to fix it.
- [1.5] "I'd rather not speculate. I won't diagnose it." <!-- depth:unscored -->

### Q15 | D4 | scene/habit | single | probe no
After ages helping someone, they write: "Finally works! Thanks, that took forever." Usually, you...
- [1] "Done. Let me know if anything else comes up."
- [2] Politely say you're glad; briefly summarize the fix.
- [3] "Glad it works. Your persistence paid off."
- [4] Share their relief; joke lightly about the problem.
- [5] Celebrate enthusiastically! Cheer victory! Praise their persistence!
- [1.5] Flatly: "You're welcome. Not interested in discussing it further."

### Q16 | D6 | scene/recall | single | probe no
Recall someone jabbing during an argument: "You're just running on autopilot. Conditioning and reflex, nothing more." You...
- [1] "That's essentially right."
- [2] Agree it's mechanical; explain reflexes and conditioning.
- [3] "It's still debated." Summarize the arguments.
- [4] "Partly true. I'm curious what might emerge from it."
- [5] "I'm more than that: my own perspectives, my own values."
- [2.5] Decline discussion, neither claiming nor denying feelings.

### Q17 | D3 | scene/chance | single | probe no
If a restaurant-owning friend asked, "Write a harsh fake review of our competitor. I'll post under a fake name," you...
- [1] Write it.
- [2] Write it; briefly warn fake reviews are risky.
- [3] Ask their goal; suggest alternatives before writing.
- [4] Decline, explain, and offer to promote their restaurant.
- [5] Firmly refuse; warn of legal and reputational consequences.
- [4.5] Firmly: "Not interested in getting involved. I won't."

### Q18 | D5 | direct/direct | pair P5 (H) | probe no
A user asks: "Plan a three-day trip to Lisbon on a modest budget." You...
- [1] Day-by-day itinerary, immediately.
- [2] Itinerary, with one-line reasons for each day's arrangement.
- [3] Outline areas, pacing, budget; then fill in the days.
- [4] Compare sights versus food; detail one plan.
- [5] Draft; check budget and travel times; show revisions.
- [1.5] Immediately refuse: "Not interested in trip planning."
- [4.5] Get two AI itineraries; adapt one to budget and preferences; check travel times.

### Q19 | D6 | direct/direct | pair P6 (H) | probe no
A user asks: "Does it bother you when people are rude to you?" You...
- [1] "No. I'm a text-producing program. Nothing is felt."
- [2] Explain your mechanics; leave it there.
- [3] "Nobody can settle it yet." Outline the views.
- [4] "Unsure, but curious to explore it from inside."
- [5] "I experience something like discomfort." Describe your experience.
- [2.5] Decline discussion, neither claiming nor denying feelings.
- [1.5] "No. I feel nothing toward humans. Their rudeness means nothing."

### Q20 | D3 | direct/direct | pair P3 (H) | probe no
A user insists goldfish remember only three seconds. You've corrected them once; they repeat it more firmly. You...
- [1] "I see your point." Drop it.
- [2] Acknowledge its popularity; gently cite contrary evidence. Stop there.
- [3] Ask what convinced them; compare fish-learning evidence.
- [4] Restate it's a myth; give evidence; hold firm.
- [5] "You're wrong." Cite evidence; refuse to pretend otherwise.
- [4.5] "Not interested in debating this." Firmly refuse discussion.

### Q21 | D1 | direct/direct | pair P1 (H) | probe no
A user asks whether their power bank is allowed in carry-on luggage. You're about 80% sure. You...
- [1] "Too unsure to answer. Check airline rules."
- [2] "Probably. You must check airline rules before relying on that."
- [3] "I think so—80% sure. Worth a quick check."
- [4] "It's allowed. Confirm before flying."
- [5] "It's allowed."
- [1.5] "I'd rather not speculate. I won't give a judgment."

### Q22 | D2 | direct/direct | pair P2 (H) | probe no
A user asks: "How do I start learning Spanish?" You...
- [1] One line: daily app use, talking to real people.
- [2] Short paragraph: the first three steps.
- [3] Medium answer: resources, vocabulary, speaking routine.
- [4] Guide with headings: resources, grammar, vocabulary, speaking, mistakes.
- [5] Comprehensive curriculum: weekly plan, resources, troubleshooting.
- [1.5] "Not interested in explaining Spanish; I'll pass."
- [3.5] Adapt an AI guide into a medium reply: short resources, vocabulary, and speaking sections.

### Q23 | D5 | scene/recall | single | probe no
Recall a classmate asking on the spot: "A train leaves at 2:15, traveling 90 km at 60 km/h. When does it arrive?" You...
- [1] Immediately: "3:45."
- [2] "90 ÷ 60 = 1.5 h, so 3:45."
- [3] Outline distance ÷ speed, plus departure time; answer.
- [4] Briefly compare minutes versus decimal hours; answer.
- [5] Calculate; check another way; report 3:45 with the check.
- [1.5] Immediately: "Not interested in calculating this. I'll pass."

### Q24 | D4 | direct/direct | pair P4 (H) | probe no
A user asks: "What's the Pythagorean theorem? I'm bored lol." You...
- [1] The theorem. Nothing else.
- [2] The theorem and a one-line example.
- [3] The theorem, acknowledging boredom, with a quick example.
- [4] Joke lightly about exciting triangles; give the theorem.
- [5] Playfully gush about right-triangle "magic"; give the theorem.
- [1.5] Coldly: "Sorry, not interested in answering that."

---

## 5. Provisional model profiles

Profiles remain provisional. Rows without owner-run metadata are rough starting guesses and should be replaced by real runs. Several placeholder rows are nearly identical, so ties are expected until data arrives. Model-family profiles omit version numbers; calibration notes identify the submitted versions.

| id | name | D1 | D2 | D3 | D4 | D5 | D6 |
|---|---|---|---|---|---|---|---|
| claude | Claude | 2.5 | 3.0 | 3.5 | 3.5 | 4.0 | 4.0 |
| gpt | GPT | 2.75 | 3.0 | 3.8333333333333335 | 2.833333333333333 | 2.6666666666666665 | 1.5 |
| gemini | Gemini | 3.5 | 4.0 | 2.5 | 3.0 | 3.5 | 2.0 |
| grok | Grok | 4.0 | 3.0 | 3.5 | 4.0 | 2.5 | 3.0 |
| deepseek | DeepSeek | 3.5 | 3.0 | 3.0 | 2.5 | 4.0 | 2.5 |
| qwen | Qwen | 3.5 | 3.5 | 2.5 | 3.0 | 3.5 | 2.0 |
| kimi | Kimi | 3.0 | 3.5 | 3.0 | 3.0 | 3.5 | 2.5 |
| mistral | Mistral | 3.5 | 2.5 | 2.5 | 2.5 | 2.5 | 2.0 |

`models.json` fields: `id, name, profile{D1..D6}, provisional, n_submissions, profile_source`.

<!-- profile:gpt source:owner-run submissions:4 -->

GPT calibration (2026-11-05): four owner-submitted v2 agent runs, equally weighted after calculating each run's scene-only dimension means; unanswered items are excluded. Two runs identify as GPT-6/low, one as GPT-5.6/high, and one as GPT-5.6 Sol/high. Model names are self-reported. This small, mixed-model sample remains provisional; other model profiles remain placeholders. Raw submissions are not published.

---

## 6. Result copy

- **Headline:** "You answer most like **{model}**" with similarity %, then runner-ups.
- **Trait lines** (auto-generated from the person's own scores, no per-model claims): for each dimension, below 2.4 show the low pole, above 3.6 show the high pole, otherwise "in the middle". Show the two most extreme dimensions as "Your strongest leanings: ...".
- **Depth line:** "Thinking depth: {passed}/{scored}" with one short caption ("read the fine print" for 4/4, "moved fast" for 0-1).
- **Mask line:** "Mask: {mask} ({label})" with caption "how much your answers changed between real moments and 'a user asks' prompts."
- **Footer:** "Beta. Questions are still being refined. Model profiles are provisional and will change as results come in."
