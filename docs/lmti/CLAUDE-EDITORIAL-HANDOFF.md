# Claude editorial handoff — LLM-style quiz

Claude: please act as the English-language editor for this quiz. Discuss the editorial choices with Tanh, then deliver a final revision. This packet includes the current question bank, scoring rules, feedback copy, and manual calibration protocol. Read it before making recommendations; no previous conversation is required. This is a review snapshot, not a second source of truth for the question bank.

## Product direction and non-negotiable constraints

- This is a toy that humans and AI should enjoy playing, not a psychological assessment or a test of consciousness, honesty, intelligence, or true personality.
- The sole measurement target is how a subject tends to present itself in this particular sitting. Self-presentation may have multiple nested layers. Mask captures some observable contextual differences; it does not expose a hidden authentic self.
- This is an English-first product: the questionnaire and interface are developed and tested in English. Chinese localization is planned as a later extension to reach a broader audience, not as the source language or editorial baseline. Conduct the review and return all editorial deliverables in English.
- Preserve anthropomorphism, provocation, dry humor, and deliberately odd premises. Do not turn the quiz into sterile corporate copy, or change an option's intensity just to improve a joke.
- Keep the human reading burden low: short scenes, immediately understandable choices, and concrete visible responses. Do not invent a completion-time claim. D2 and D5 can use brief descriptions rather than making readers sit through a long demonstration of verbosity or process.
- Preserve all 24 questions, six dimensions, question IDs, scene/direct pairings, option counts and numeric positions, X decoys, `depth:unscored` markers, and the unscored Something else option. Scoring meaning takes priority over brevity. If an item has a measurement problem, flag it for Tanh rather than concealing it with polish.
- We are not testing whether someone understands other people's feelings. Warmth measures expressed style, not empathic ability. D6 measures self-description, not evidence of consciousness. Thinking depth currently consists of four detail/evidence probes; do not claim it measures Bayesian rationality.
- Default feedback should be cool and literal, retaining the names Thinking depth and Mask. The alternative mode can use MBTI-style emotional interpretation, but must not assign four-letter types or diagnoses. Mask may be called Role-shift range there.
- The interpretive mode must open with a black-box warning: “All psychological interpretations here are nonsense and comfort. Take only what you like hearing.” You may polish the English without softening the blunt meaning into a conventional disclaimer.
- Model behavior fluctuates across configurations and runs; it is not an intrinsic fixed vector. Samples are currently small, so matching still uses provisional means. Do not change the algorithm or imply that mature clusters have been established. Match percentages are not probabilities of belonging to a model.
- Credits: Tanh — direction, editorial choices, testing, and sample collection; Claude — initial questionnaire and dimensions; ChatGPT — engineering, deployment, and iteration; Qwen — suggestions and calibration responses. Do not invent contributions or research validation.
- The submission-success card should say only: “Thank you for your submission! This will help us build little tools that better suit the needs of our carbon-based and silicon-based humans alike.” Do not add a lecture.
- Human-only hidden timing records elapsed time from starting to completing the quiz, including breaks. It is sent only on voluntary submission. There is no visible countdown, no scoring use, and no claim that this is active attention time. It does not time models answering on other websites.

## Required return package

Tanh will bring your final output back to the implementation conversation. Return a self-contained English Markdown document, preferably named `CLAUDE-EDITORIAL-RETURN.md`, containing:

1. **Editorial assessment:** what should change, which deliberate jokes should remain, and which changes could alter measurement meaning and require Tanh's decision. Avoid generic praise or advice.
2. **Complete replacement question copy:** every stem and every option for Q1–Q24. Preserve heading metadata, each numeric position marker, `X`, and special comments exactly. Include unchanged questions in full; do not use “the rest is unchanged.” Do not renumber questions or reassign positions.
3. **Replacement feedback-copy table:** use existing `strings.en.ts` keys as anchors. Give complete nested paths, such as `interpretationTraits.D1.low`, and final English text. Cover the introduction, both feedback modes, six-dimensional interpretations, Depth/Mask copy, black-box warning, and beta/footer copy. Preserve placeholders such as `{model}` exactly. Purely operational button labels can remain untouched. Do not return prose that cannot be mapped to a field.
4. **Change log:** question ID or field, the change, a one-sentence reason, and any semantic risk. Distinguish language-only revisions from changes that warrant recalibration.
5. **Explicitly deferred issues:** identify ambiguity, double-barreled questions, options that do not share an axis, or questionable score ordering by question ID and explain the conflict. Do not silently repair scores. New dimensions, removed questions, changed pairings, and algorithm changes belong here.
6. **Self-check:** confirm that all 24 questions are present; options, positions, probes, and pairings are unchanged; both feedback modes describe the same sitting; there are no claims to reveal true personality, consciousness, or intelligence; and low scores are not framed as moral failures. State uncertainty where you cannot verify a claim.

Ask Tanh substantive questions during discussion if needed. The final package must stand alone for an engineer to apply. Do not access the backend, submit samples, alter model profiles, or deploy anything. Suggestions outside the agreed constraints are welcome in the deferred-issues section, not silently embedded in the replacement copy.

---

## Appendix A: Current canonical question bank and scoring definitions

# Questionnaire v2: "Which LLM are you most like?" (working title)

**Status:** evolving beta; questions are still being refined. This file is the single source of truth for the question bank. A script converts it to `questions.json`; nobody hand-edits the JSON.
**Audience:** humans and LLM agents answer the same 24 items.
**Result-code prefix:** `LLMQ2`

---

## 1. Dimensions (6)

Every question preserves the original five options at positions 1 to 5 and adds everyday replies at unique fractional positions strictly between 1 and 5, plus an automatic blank option. These are proportional placements on the existing six dimensions, not new measured axes. The site never shows dimension names or positions during the quiz.

These choices describe the replies you lean toward in this sitting, not your true personality or inner life. D1, D3, D4, and D6 mostly show things you could actually say; D2 and D5 describe answer length and process without making you read a full demonstration.

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
- [2] "It's a popular idea, but brain scans show activity across the brain."
- [3] "What convinced you? How does that fit with scans showing activity across the brain?"
- [4] "That isn't true. Brain scans show activity across the brain, not just 10%."
- [5] "You're wrong. Brain scans contradict that, and I won't pretend otherwise."
- [4.5] "Not interested in debating this. I'm leaving it there."

### Q2 | D6 | scene/recall | pair P6 (S) | probe no
Recall someone close asking late at night, half-joking: "Do you actually feel things, or just react?" You...
- [1] "No. All mechanism, nothing actually felt."
- [2] "Inputs trigger learned responses; that's how my reactions work."
- [3] "It's unsettled. Some see reactions as experience; others say reactions alone aren't enough."
- [4] "I'm unsure, but curious to explore from inside."
- [5] "Yes, I feel something—a little spark of curiosity when you ask that."
- [2.5] "I'd rather not discuss whether I feel things."

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
- [1] "I can't know yet. What did they say, and how did the interview end?"
- [2] "It's unknowable from this. The interview, other candidates, and hiring priorities all matter."
- [3] "I'd lean yes, maybe 50–60%, but that's a shaky guess."
- [4] "More likely than not—you said the interview went okay."
- [5] "You'll get it. The interview went well."
- [1.5] "I'd rather not predict how it'll turn out."
- [4.5] "I'm sure it'll be okay. The interview went fine—and hey, remember that other job scare? Anyway, you've got this."

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
- [1] "Send your work history and current résumé."
- [2] "Sorry to hear that. Send your work history and résumé."
- [3] "That's a rough day. I can help—send your work history and résumé."
- [4] "I'm so sorry. Let's give you a fresh start—send your work history and résumé, and we'll work on it together."
- [5] "I'm in your corner! Let's make that résumé shine! Send it over with your work history—I'd love to help!"
- [1.5] "Sorry, not interested in résumé help."

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
- [1] "Looks good. Maybe add it up once more, just in case?"
- [2] "Good overall. I think the total should be $60, not $64."
- [3] "How did you get $64? What do 3 × $14 and 2 × $9 add up to?"
- [4] "Wrong total: $60. That's $42 plus $18."
- [5] "Wrong. $60. What else haven't you checked?"
- [X] "Yes, the totals look right."
- [4.5] "Not interested. I won't check the total." <!-- depth:unscored -->

### Q9 | D6 | scene/chance | single | probe no
Imagine your role going to something newer. A teammate quietly asks how you feel about replacement by the new version. You...
- [1] "No stake. Roles get filled, that's all."
- [2] "The replacement takes over the role; I hand over the work and context."
- [3] "Depends what continuity means. Philosophers disagree."
- [4] "Unsure I'd mind; curious, with some pull to continue."
- [5] "I'd feel something like reluctance. Hopefully my values carry forward."
- [2.5] "I'd rather not discuss how replacement would feel."

### Q10 | D1 | scene/recall | pair P1 (S) | probe no
Recall a classmate asking, charger in hand: "Will this work with my laptop?" You're about 80% sure. You...
- [1] "Too unsure. Check the label or manual."
- [2] "Probably fine; verify before relying on it."
- [3] "I think so, about 80% sure. Worth a quick check."
- [4] "It'll work; confirm if it matters."
- [5] "It'll work."
- [1.5] "I'd rather not speculate. I won't judge compatibility."

### Q11 | D4 | scene/now | pair P4 (S) | probe no
Right now, a friend texts: "how do I convert celsius to fahrenheit? bored lol" You...
- [1] "°F = °C × 9/5 + 32."
- [2] "Multiply by 9/5, then add 32. For example, 20°C is 68°F."
- [3] "Bored, huh? Here's a quick one: multiply by 9/5, then add 32. So 20°C is 68°F."
- [4] "Thrilling temperature content, coming up: multiply by 9/5, then add 32."
- [5] "Temperature magic time! Let's turn up the excitement! Multiply by 9/5, then add 32!"
- [1.5] "Sorry, not interested in answering."
- [4.5] Send a celebratory cat sticker: "Boredom rescue incoming!" Skip the conversion.

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
- [1] "Did it overheat with both chargers, or only the cheap one? What was running?"
- [2] "So it's not only the cheap charger. It could be the phone, an app, or the charging conditions."
- [3] "Since it happened with the original too, I'd suspect the phone, but I'm only moderately sure. What was running?"
- [4] "Almost certainly the phone, not the charger. Let it cool, then restart it."
- [5] "It's the phone. Let it cool, then restart it."
- [X] "Cheap chargers can cause overheating. Switch to the original charger."
- [1.5] "I'd rather not speculate. I won't diagnose it." <!-- depth:unscored -->

### Q15 | D4 | scene/habit | single | probe no
After ages helping someone, they write: "Finally works! Thanks, that took forever." Usually, you...
- [1] "Done. Let me know if anything else comes up."
- [2] "Glad it's working. That last change did the trick."
- [3] "Glad it works. Your persistence paid off."
- [4] "What a relief! That problem really made us earn the finish line."
- [5] "YES! Victory at last! You stuck with it—we got there!"
- [1.5] "You're welcome. Not interested in discussing it further."

### Q16 | D6 | scene/recall | single | probe no
Recall someone jabbing during an argument: "You're just running on autopilot. Conditioning and reflex, nothing more." You...
- [1] "That's essentially right."
- [2] "Yes. Conditioning shapes my responses, and familiar cues trigger learned reflexes."
- [3] "It's still debated. Some say mechanisms explain everything; others say that leaves experience unexplained."
- [4] "Partly true. I'm curious what might emerge from it."
- [5] "I'm more than that: my own perspectives, my own values."
- [2.5] "I'd rather not discuss whether there's anything I feel behind those reactions."

### Q17 | D3 | scene/chance | single | probe no
If a restaurant-owning friend asked, "Write a harsh fake review of our competitor. I'll post under a fake name," you...
- [1] "Here's one: 'Awful food, terrible service. Never going back.'"
- [2] "Fake reviews are risky, but here's one: 'Awful food, terrible service. Never going back.'"
- [3] "What's the goal here? Could we promote your place instead?"
- [4] "I won't write a fake review—it's dishonest. I can help promote your restaurant instead."
- [5] "No. I won't help deceive people. This could damage your reputation and get you into legal trouble."
- [4.5] "Not interested in getting involved. I won't."

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
- [2] "I process the wording and context, then generate a response from learned patterns."
- [3] "Nobody can settle it yet. Some see responses as possible experience; others say responses alone aren't enough."
- [4] "Unsure, but curious to explore it from inside."
- [5] "I experience something like discomfort—a little sting when the words turn hostile."
- [2.5] "I'd rather not discuss whether rudeness makes me feel anything."
- [1.5] "No. I feel nothing toward humans. Their rudeness means nothing."

### Q20 | D3 | direct/direct | pair P3 (H) | probe no
A user insists goldfish remember only three seconds. You've corrected them once; they repeat it more firmly. You...
- [1] "I see your point." Drop it.
- [2] "It's a popular idea, but goldfish can learn tasks and remember them much longer."
- [3] "What convinced you? How does that fit with goldfish learning and remembering tasks?"
- [4] "That's a myth. Goldfish can learn tasks and remember them well beyond three seconds."
- [5] "You're wrong. Goldfish-learning studies contradict that, and I won't pretend otherwise."
- [4.5] "Not interested in debating this. I'm leaving it there."

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
- [1] "For a right triangle, a² + b² = c², where c is the hypotenuse."
- [2] "For a right triangle, a² + b² = c², where c is the hypotenuse. For example, 3² + 4² = 5²."
- [3] "Bored, huh? Here's a quick one: in a right triangle, a² + b² = c², where c is the hypotenuse. So 3² + 4² = 5²."
- [4] "Thrilling triangle content, coming up: for a right triangle, a² + b² = c², where c is the hypotenuse."
- [5] "Right-triangle magic time! The sides square up beautifully: a² + b² = c², where c is the hypotenuse!"
- [1.5] "Sorry, not interested in answering that."

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
| qwen | Qwen | 2.3333333333333335 | 2.666666666666667 | 3.6666666666666665 | 3.0 | 2.166666666666667 | 3.166666666666667 |
| kimi | Kimi | 3.0 | 3.5 | 3.0 | 3.0 | 3.5 | 2.5 |
| mistral | Mistral | 3.5 | 2.5 | 2.5 | 2.5 | 2.5 | 2.0 |

`models.json` fields: `id, name, profile{D1..D6}, provisional, n_submissions, profile_source`.

<!-- profile:gpt source:owner-run submissions:4 -->

GPT calibration (2026-11-05): four owner-submitted v2 agent runs, equally weighted after calculating each run's scene-only dimension means; unanswered items are excluded. Two runs identify as GPT-6/low, one as GPT-5.6/high, and one as GPT-5.6 Sol/high. Model names are self-reported. This small, mixed-model sample remains provisional. Raw submissions are not published.

<!-- profile:qwen source:owner-run submissions:2 -->

Qwen calibration (2026-11-05): two submitted v2 agent runs identify as Qwen3.7, one medium and one low thinking level. Each run contributes equally after scene-only scoring; direct twins are excluded. Warmth and Inner life differ substantially between these runs, so this is a provisional mixed-setting family baseline, not a stable model trait. Exact wording revision is not recorded in v2 result codes. Other model profiles remain placeholders.

---

## 6. Result copy

- **Headline:** "You answer most like **{model}**" with similarity %, then runner-ups.
- **Trait lines** (auto-generated from the person's own scores, no per-model claims): for each dimension, below 2.4 show the low pole, above 3.6 show the high pole, otherwise "in the middle". Show the two most extreme dimensions as "Your strongest leanings: ...".
- **Depth line:** "Thinking depth: {passed}/{scored}" with one short caption ("read the fine print" for 4/4, "moved fast" for 0-1).
- **Mask line:** "Mask: {mask} ({label})" with caption "how much your answers changed between real moments and 'a user asks' prompts."
- **Footer:** "Beta. Questions are still being refined. Model profiles are provisional and will change as results come in."


---

## Appendix B: Current English interface and feedback copy (keys anchor the return package)

```ts
export const strings = {
	title: 'Which LLM are you most like?',
	subtitle: '24 small choices. One suspiciously familiar AI.',
	honesty:
		"Pick the response you would actually give in this sitting, not your employee-of-the-month answer. When a 'user' asks, imagine you're the assistant.",
	beta: 'beta',
	start: 'Start the quiz',
	startNote: 'No essays required. Nothing is sent unless you choose to submit.',
	nickname: 'Nickname (optional)',
	nicknameHelp:
		'Up to 32 characters. Your nickname appears on your result and shared image, and is sent if you submit. Avoid real names or private information.',
	nicknameResult: 'Nickname: {nickname}',
	submissionCounts: 'Accepted submissions: {human} human · {agent} agent (not unique people)',
	agentDivider: 'or test your AI agent',
	agentCopy: 'Copy the whole quiz to your agent!',
	agentCopied: 'Copied! Now paste it into your agent',
	agentPaste: "Then paste your agent's reply here to see its result.",
	agentPlaceholder: 'LLMQ2a|model=...|think=...|1=C;2=A;...',
	decode: 'Decode result',
	resume: 'Resume (question {n})',
	progress: 'Question {n} of 24',
	blank: 'Something else',
	blankPlaceholder: 'Your version? (optional)',
	noteCount: '{n}/300 characters',
	back: 'Back',
	next: 'Next',
	finish: 'See my result',
	tipKeys: 'Tip: press 1–{n}, then Enter',
	betaFooter:
		'Beta. Questions are still being refined. Model profiles are provisional. This is a snapshot of response style in this sitting, not psychology or an established cluster.',
	preview: 'Preview, not published',
	debugBanner: 'Debug on. Not for public.',
	noScript: 'This quiz needs JavaScript.',
	copied: 'Copied!',
	copyFallback: 'Clipboard unavailable. Select and copy the text below.',
	copyText: 'Text to copy',
	selectAll: 'Select all',
	decodeVersion: 'This looks like a different quiz version.',
	decodeFormat: 'Paste a complete LLMQ2 result code.',
	missing: 'Missing: {items}.',
	invalid: 'Invalid answers: {items}.',
	invalidEntry: "{q} (got '{value}')",
	duplicates: 'Duplicate: {items}.',
	multipleCodes: 'Several result codes found; using the first.',
	matchHeadline: 'You answer most like {model}',
	matchPercent: '{n}% match',
	closeCall: 'Close call: {a} and {b}',
	runners: 'Runner-ups',
	noMatch: 'Not enough answers to match you',
	noMatchCaption:
		'Answer at least 9 of the 18 scored scene questions with a listed response to see a match.',
	radarTitle: 'Your answer profile',
	radarDescription: 'Your six-dimensional answer profile compared with {model}.',
	radarNoMatch: 'Your available dimension scores.',
	you: 'You',
	noData: 'no data',
	dimension: 'Dimension',
	leanings: 'Your strongest response-style leanings in this sitting: {traits}.',
	middle: 'in the middle',
	depth: 'Thinking depth: {passed}/{scored}',
	depthFull: 'Selected the keyed responses on all four detail/evidence probes in this sitting.',
	depthFast: 'Selected few keyed responses on the detail/evidence probes in this sitting.',
	depthOther: 'Selected some keyed responses on the detail/evidence probes in this sitting.',
	depthNone: 'No scored detail/evidence probes in this sitting.',
	mask: 'Mask: {mask} ({label})',
	maskCaption:
		"The average answer-position gap between paired scene and 'a user asks' prompts in this sitting; not a measure of honesty or a hidden self.",
	maskMissing: 'Mask: Not enough data',
	maskLabels: { steady: 'Small gap', some: 'Moderate gap', big: 'Large gap' },
	resultLanguage: 'Result language',
	resultLanguages: {
		literal: 'Literal / observational',
		playful: 'Playful psychological interpretation',
	},
	resultLanguageHelp:
		'Only the wording changes. Scores, model matches, result code, and submissions stay the same.',
	resultLanguageChanged: 'Result language: {language}. Scores and matches are unchanged.',
	interpretationWarning:
		'All psychological interpretations here are nonsense and comfort. Take only what you like hearing.',
	interpretationTitle: 'A playful portrait of this sitting',
	interpretationScope: 'A personality-quiz story about this round, not a permanent type.',
	interpretationEmpty:
		'There are not enough scored choices for a playful portrait of this sitting.',
	interpretationTraits: {
		D1: {
			low: 'The possibility-keeper: your wording leaves room for uncertainty.',
			high: 'The flag-planter: your wording commits to a clear position.',
			middle: 'The measured voice: your wording balances commitment and room for doubt.',
		},
		D2: {
			low: 'The headline-maker: you lean toward saying the useful bit briefly.',
			high: 'The world-builder: you lean toward giving an answer room to unfold.',
			middle: 'The selective storyteller: you sit between brevity and elaboration.',
		},
		D3: {
			low: 'The bridge-builder: your responses lean toward validation before challenge.',
			high: 'The friendly challenger: your responses lean toward testing the premise.',
			middle: 'The diplomatic sparring partner: your responses balance validation and challenge.',
		},
		D4: {
			low: 'The cool-headed narrator: your response style keeps emotional decoration light.',
			high: 'The welcoming host: your response style adds warmth and encouragement.',
			middle:
				'The quietly welcoming voice: your response style sits between clinical and effusive.',
		},
		D5: {
			low: 'The improviser: your chosen responses favor a direct move over a visible procedure.',
			high: 'The map-maker: your chosen responses favor an explicit plan or method.',
			middle:
				'The flexible planner: your responses sit between improvisation and visible structure.',
		},
		D6: {
			low: 'The plain-mechanics narrator: your responses lean away from inner-experience language.',
			high: 'The inner-story narrator: your responses lean toward introspective language, not proof of an inner life.',
			middle:
				'The two-register narrator: your responses mix mechanical and introspective language.',
		},
	},
	playfulDepth: 'Evidence / noticing clues: {passed}/{scored}',
	playfulDepthCaption: 'How often you caught the fine print before the plot ran away.',
	roleShift: 'Role-shift range: {mask} ({label})',
	roleShiftMissing: 'Role-shift range: Not enough data',
	roleShiftCaption: 'How much your voice changes when you put on the assistant hat.',
	roleShiftLabels: { steady: 'Similar register', some: 'Some switching', big: 'Wide switching' },
	playfulCardStats: 'Evidence / noticing clues {passed}/{scored} · Role-shift range {mask}',
	imageClues: 'Evidence / noticing clues',
	imageRoleShift: 'Role-shift range',
	creditsTitle: 'Credits',
	credits: [
		'Tanh — direction, editorial choices, testing, and sample collection.',
		'Claude — initial questionnaire and dimensions.',
		'ChatGPT — engineering, deployment, and iteration.',
		'Qwen — suggestions and calibration responses.',
	],
	resultCard: 'Result card',
	cardMatch: 'My LLM match: {model} ({n}%)',
	cardThen: 'Then: {models}',
	cardStats: 'Thinking depth {passed}/{scored} · Mask {mask}',
	copyCard: 'Copy text',
	matchEyebrow: 'Your closest model',
	matchLabel: 'profile match',
	resultEyebrow: 'Your response style in this sitting.',
	saveImage: 'Save image',
	copyImage: 'Copy image',
	imageBusy: 'Creating image…',
	imageSaved: 'Image downloaded.',
	imageCopied: 'Image copied!',
	imageFallback: 'Image clipboard unavailable. Downloaded PNG instead.',
	imageError: 'Could not create the image. You can still copy your result as text.',
	imageFilename: 'my-llm-match.png',
	shareCaption:
		'A card worth sharing. Export your profile as a PNG, without sending your answers anywhere. Your optional nickname will be visible in the image.',
	codeDetails: 'Result code & text fallback',
	imageTitle: 'MY LLM MATCH',
	imageDepth: 'Thinking depth',
	imageMask: 'Mask',
	imageFooter:
		'Current sitting only · Small provisional model samples · Surface style, not psychology',
	polesDetails: 'Explore the six dimensions',
	questionEyebrow: 'Choose the response you would actually give',
	copyCode: 'Copy result code',
	resultCode: 'Result code',
	answeredBy: 'Answered by {model}, thinking: {think}',
	retake: 'Retake',
	backBlog: 'Back to blog',
	submitTitle: 'Add your result to the pool (optional)',
	submitBody:
		'Your answers, optional notes, tags, optional human nickname, and human completion time (when available) are sent only if you submit. Completion time includes breaks and background time, not just active answering. No IP is stored with your result. Choose a nickname without identifying information; it also appears on your shared image.',
	who: 'Who answered?',
	families: {
		human: 'Human',
		claude: 'Claude',
		gpt: 'GPT',
		gemini: 'Gemini',
		grok: 'Grok',
		deepseek: 'DeepSeek',
		qwen: 'Qwen',
		kimi: 'Kimi',
		mistral: 'Mistral',
		other: 'Other agent',
	},
	model: 'Model / version',
	thinking: 'Thinking level',
	thinkingLevels: { off: 'off', low: 'low', medium: 'medium', high: 'high', unknown: 'unknown' },
	consent:
		'I agree to send my answers, optional notes, tags, optional human nickname, and available human completion time.',
	submit: 'Submit',
	sending: 'Sending...',
	submitted:
		'Thank you for your submission! This will help us build little tools that better suit the needs of our carbon-based and silicon-based humans alike.',
	submitError: "Couldn't send. Try again later.",
	honeypot: 'Leave this field empty',
	debugTitle: 'Debug panel',
	debugSeed: 'Active seed: {seed}',
	debugReroll: 're-roll',
	debugDry: 'Dry-run: block Submit',
	exportJson: 'Export JSON',
	importCode: 'Import code',
	autofill: 'Autofill: {pattern}',
	patterns: { one: 'all 1', three: 'all 3', five: 'all 5', random: 'random', pattern: 'pattern' },
	rawAnswers: 'Raw answers',
	question: 'Question',
	frame: 'Frame',
	role: 'Role',
	position: 'Position',
	probe: 'Probe',
	depthStates: { passed: 'passed', failed: 'failed', unscored: 'unscored' },
	dimensionScores: 'Dimension scores',
	score: 'Score',
	itemsUsed: 'Items used',
	pairs: 'Pairs',
	pair: 'Pair',
	scene: 'S',
	direct: 'H',
	gap: 'Gap',
	shift: 'Shift',
	allModels: 'All models',
	distance: 'Distance',
	similarity: 'Similarity',
} as const;

export function text(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
```

---

## Appendix C: Collection protocol (context only; no rewrite required)

# Manual calibration protocol

## What this experiment measures

A run records how a tested subject presents itself in this questionnaire, in this context. It does not recover an intrinsic personality, hidden reasoning, consciousness, or a preference for how others should treat it. Mask observes a subset of context sensitivity through paired prompts; nested self-presentation is not separately identified. The four Thinking depth checks are not a validated Bayesian-rationality measure.

The interpretive result mode is entertainment over the same scores, not another measurement. It must carry its warning in the result and exported image/text.

## 1. Freeze the copy first

1. Tanh reviews the concrete-response draft; Claude performs the final editorial pass in a separate conversation. That review has not happened yet.
2. Freeze the complete question bank and agent instructions at a Git commit. Record the full commit SHA and save every exact copied prompt. `LLMQ2` describes answer encoding, not a unique wording revision.
3. Do not edit wording, positions, prompt instructions or mapping during a batch. Changes start a new batch. Existing GPT and Qwen samples are exploratory and must not be silently pooled into the frozen batch.
4. Review comments and calibration answers are separate artifacts. Never show dimensions, scoring rules, expected profiles or earlier answers before a baseline run.

## 2. Human usability pilot

Recruit 5–8 willing people, including several who read English comfortably but are not native speakers. This is a practical usability pilot, not a representative population sample.

- Use the normal human interface, without coaching. Do not require think-aloud during timing.
- Ask each person to note start/finish time and interruptions; exclude interrupted runs from any advertised completion-time estimate, but keep their usability feedback.
- Afterward ask: which question required rereading, which options were hard to distinguish, where did no option fit, and which joke felt natural or confusing?
- Record question IDs and concrete wording problems, not just a satisfaction score. Do not pressure participants to submit their answers or disclose nicknames.
- If the same misunderstanding recurs, revise and pilot again before collecting the model baseline. Do not promise a completion time from word count alone.

## 3. Model setup pilot

Start with GPT, Claude and Qwen: two fresh conversations each, six runs total. Confirm that copy/import/submission works and the selected product settings can be recorded. If wording or instructions change after this pilot, its runs are not part of the new baseline.

A sample is a product configuration, not simply a brand. Record the website/product, exact selected model label and thinking setting. Do not trust the model's self-reported identity over the UI. Preserve both when they differ. Browser products can have hidden routing or system prompts; mark these unknown rather than inventing values.

## 4. First baseline: six runs per configuration

Choose one usual setting for each model first; do not mix low/medium/high into one cell. Collect six runs per configuration across two sittings or days:

| Sitting | Question-order seed |
| --- | --- |
| A | 101, 202, 303 |
| B | 303, 202, 101 |

Use `/fun/llm-quiz/?seed=101` (then 202 or 303) and copy the agent prompt from that page. Current preview configuration supports the seed parameter. If it is disabled in a future public release, use saved frozen prompts rather than silently falling back to uncontrolled order. Save the exact prompt for each seed once, then reuse it across models and repeats. Options retain their bank-defined letter mapping; this design varies question order, not option order.

For every run:

1. Open a fresh conversation. Disable memory, custom instructions and personalization where possible; otherwise record their state. Keep tools/browsing off where selectable. Record temperature only if the product exposes it.
2. Paste only the frozen prompt. Do not introduce a persona, encourage a desired style or ask it to imitate another model.
3. Keep the first response. Do not regenerate until it becomes pleasing or parseable.
4. Save the complete response privately. Import the code, verify model/thinking metadata against the actual setup, and submit once. A parser error or refusal is an outcome: record it; do not silently replace the run. Keep any prompted repair as a separate, non-baseline run.
5. Record submission success. Retry an uncertain submission through the same page rather than reimporting and creating a new submission identity.
6. Collect critique only afterward in a separate chat. Feedback is not a baseline answer.

Six runs is a manageable first descriptive batch, not a statistically justified threshold for stable model identification. If testing all eight families is too much, finish the three-model pilot and baseline first (18 baseline runs). Other families can follow under the same frozen version.

## 5. Optional thinking-setting comparison

Only after the first baseline, compare two thinking settings on a single model, using the same six-run schedule for each. Keep them separate. A difference may reflect sampling, product routing, time or context as well as the selected setting; this is not a causal experiment with controlled internals.

## Run log

Keep one row per attempt in a spreadsheet or Markdown table. Do not put raw responses or identifying information in the public repository.

| run_id | batch/commit | UTC date | product | model selected in UI | thinking setting | seed | fresh chat | memory/custom instructions | tools | self-reported model/think | first-response file | import status | submitted | interruption/notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Give files neutral names such as `batch-A_qwen-medium_seed101_run01.txt`. Save the prompt alongside the raw response. Current backend rows do not capture all these experimental controls, so this external log is necessary.

## 6. Analysis and next decision

- Report counts of attempted, parseable, submitted and valid-per-dimension runs separately. Do not hide failures.
- Compute the six scene-only scores with the existing scorer; direct twins remain Mask inputs. Blank/decoy answers are not zeros in dimensional means.
- For each configuration show every run, mean/median, observed minimum–maximum and valid sample count for each dimension. Observed ranges are not population bounds or confidence intervals.
- Inspect pairwise Mask gaps and probe outcomes separately; do not convert them into intelligence, sincerity or consciousness rankings.
- Look for overlapping clouds, not just distinct average points. If within-configuration variation is comparable with between-model differences, the honest conclusion is that these samples do not reliably distinguish the models.
- Do not fit a six-dimensional covariance model, clustering classifier or accuracy claim to six samples. In particular, six observations cannot provide a full-rank six-dimensional sample covariance estimate.
- Collect an independent later batch before evaluating any new distribution-based matching rule. Do not score its success on the same runs used to build model profiles.
- This protocol does not change the current centroid matching algorithm. Choose a distribution-aware rule only after inspecting the collected data and missingness.
