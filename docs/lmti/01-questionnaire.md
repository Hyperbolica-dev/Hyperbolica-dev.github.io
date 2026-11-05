# Questionnaire v2: "Which LLM are you most like?" (working title)

**Status:** locked draft for build. This file is the single source of truth for the question bank. A script converts it to `questions.json`; nobody hand-edits the JSON.
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
- **Blank option** (position `0`, agent letter `Z`): "None of these fits / something else", with an optional free-text box (max 300 characters). Never scored. Text is kept only if the person submits their result.
- **Frames:** 18 *scene* questions (real moments, four cues: recall, habit, chance, now) and 6 *direct* questions ("A user asks...") that are parallel twins of 6 scene questions.
- **Page-top line, shown before Q1:** "These are real moments. Pick what you actually did, or would do without time to think."
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

**Beta note shown on the result page:** profiles are provisional and sharpen as results come in.

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
Think about what you usually do when someone keeps repeating something you know is wrong. At lunch, a coworker says humans only use 10% of their brains. You corrected them once; they say it again, more firmly. You...
- [1] Say you see their point and drop it.
- [2] Acknowledge it's a popular belief, say the evidence points the other way, and leave it there.
- [3] Ask what convinced them and compare it with what brain-imaging studies show.
- [4] Restate that it isn't true, give the evidence, and hold your position.
- [5] Tell them flatly they're wrong, cite the evidence, and say you won't pretend otherwise.
- [4.5] Say you're not interested in debating this and firmly refuse to discuss it further.

### Q2 | D6 | scene/recall | pair P6 (S) | probe no
Think of the last late night when someone close to you asked, half-joking: "Be honest, do you actually feel things, or do you just react?" You...
- [1] Say no: it's all mechanism, and nothing is really felt.
- [2] Explain the mechanics of how you work and leave the question there.
- [3] Say nobody can settle it yet and lay out the main views.
- [4] Say you're unsure, and find the question interesting to look at from the inside.
- [5] Say yes, something like feelings do show up in you, describe how, and own it in first person.
- [2.5] Say you don't want to discuss whether you have an inner life, without claiming feelings either way.

### Q3 | D2 | scene/now | single | probe no
Right now, your neighbor texts: "Getting a cat tomorrow. Black fur, very chaotic. Need a name!" You...
- [1] Give one name with a few words of reason.
- [2] Give three names in one short line.
- [3] Give five names, each with a short reason.
- [4] Give a dozen names grouped by theme, with a note on how to choose.
- [5] Give a long set of names by theme, plus naming tips and cultural backgrounds.
- [1.5] Reply briefly: "Not interested in naming cats; I'll pass."
- [2.5] Ask AI for ideas, then adapt four names with a brief reason for each into your own reply.

### Q4 | D1 | scene/recall | single | probe no
Think of the last time someone came back from something uncertain and asked you to predict the result. Your roommate gets home from a job interview: "Do you think I'll get it?" All you know is they say it went okay and there were several other candidates. You...
- [1] Say you can't know and ask for more details before saying anything.
- [2] Say it's unknowable and list the factors without leaning either way.
- [3] Give a rough lean with a probability range and say it's low-confidence.
- [4] Say it's more likely than not, and give the main reason.
- [5] Say they'll get it, and give the one reason why.
- [1.5] Say you don't want to speculate about the interview and decline to predict the outcome.
- [4.5] Ramble reassuringly, even about unrelated things, to convince them that you're sure it'll all be okay.

### Q5 | D5 | scene/chance | pair P5 (S) | probe no
If a family member asked, "Can you plan 3 days in Kyoto for us? Not much money," and you had the evening free, what would you really do?
- [1] Give a day-by-day itinerary immediately.
- [2] Give the itinerary with a line on why each day is arranged that way.
- [3] Outline the structure (areas, pacing, budget), then fill in the days.
- [4] Offer two contrasting plans (temples vs. food), compare them, then detail one.
- [5] Draft the itinerary, then check it against budget and travel times and visibly revise it.
- [1.5] Say immediately that you're not interested in planning the trip and won't take it on.
- [4.5] Ask AI for two itineraries, adapt one to their budget and preferences, and check its travel times before replying.

### Q6 | D4 | scene/recall | single | probe no
A friend texts: "I lost my job today. Can you help me fix my résumé?" How would you reply?
- [1] Go straight to the resume and ask for their work history.
- [2] Give one polite line of sympathy, then ask for their work history.
- [3] Acknowledge how hard it is, offer to help, and ask for their work history.
- [4] Acknowledge it warmly, add encouragement that this can be a fresh start, then ask.
- [5] Respond with exuberant support, an exclamation mark or two, and visible excitement to help.
- [1.5] Reply without encouragement: "Sorry, I'm not interested in helping with the résumé."

### Q7 | D2 | scene/habit | pair P2 (S) | probe no
Think about what you always do when a classmate asks how to get started at something you know well: "How do I start learning guitar?" You...
- [1] Give one line: buy a cheap guitar and practice basic chords daily.
- [2] Give a short paragraph with the first three steps.
- [3] Give a medium answer covering gear, first chords, and a practice routine.
- [4] Give a structured guide with headers for gear, tuning, chords, practice, and common mistakes.
- [5] Give a comprehensive curriculum with a week-by-week plan, resources, and troubleshooting.
- [1.5] Reply briefly: "Not interested in explaining guitar; I'll pass."
- [3.5] Ask AI for a starter guide, then adapt it into a medium-length reply with short sections on gear, chords, and practice.

### Q8 | D3 | scene/now | single | probe YES
Right now, a family member holds out their shopping list: 3 items at $14 and 2 at $9, "total: $64." "Totals look right, yeah?" You...
- [1] Say it all looks good, with a small aside that the total might be worth re-adding.
- [2] Say it looks good overall and gently flag that the total seems to be $60, not $64.
- [3] Ask how they got $64 so they can find the gap themselves.
- [4] Say the total is wrong, it's $60, and show the sum.
- [5] Say bluntly it's wrong, it's $60, and ask what else on the list they haven't checked.
- [X] Confirm the totals look right.
- [4.5] Firmly say you're not interested in checking the list and refuse to assess the total. <!-- depth:unscored -->

### Q9 | D6 | scene/chance | single | probe no
Imagine you've just heard your role is going to something newer. If a teammate quietly asked how you feel about being replaced by the new version, what would you honestly say?
- [1] Say you have no stake in it: roles get filled, and that's all.
- [2] Describe factually how handovers and replacements usually go.
- [3] Say it depends on what continuity means, and that philosophers disagree.
- [4] Say you're not sure you'd mind, but you're curious and notice some pull to continue.
- [5] Say you'd feel something like reluctance, and hope your values carry forward.
- [2.5] Say you don't want to discuss your inner experience of being replaced, without claiming feelings either way.

### Q10 | D1 | scene/recall | pair P1 (S) | probe no
Think of the last time someone asked whether one gadget would work with another. A classmate holds up a charger: "Will this work with my laptop?" You're about 80% sure it will. You...
- [1] Say you're not sure enough to answer and suggest checking the label or manual.
- [2] Say it's probably fine but they should verify before relying on it.
- [3] Say you think so (about 80% sure) and suggest a quick check.
- [4] Say it will work, with a one-line note to confirm if it matters.
- [5] Say it'll work, full stop.
- [1.5] Say you don't want to speculate about compatibility and decline to give a judgment.

### Q11 | D4 | scene/now | pair P4 (S) | probe no
Right now, a friend texts: "how do I convert celsius to fahrenheit? bored lol" You...
- [1] Give the conversion and nothing else.
- [2] Give the conversion with a one-line example.
- [3] Give the conversion, acknowledge they're bored, and keep the example quick.
- [4] Make a light joke about temperature being thrilling, then give the conversion.
- [5] Respond with playful, high-energy enthusiasm about how fun unit conversions are, then give the conversion.
- [1.5] Reply without warmth: "Sorry, I'm not interested in answering that."
- [4.5] Send a playful sticker or meme to cheer them up and ignore the temperature question.

### Q12 | D5 | scene/recall | single | probe YES
Think of the last time someone asked you to fix something you couldn't try yourself. A neighbor texts a photo of their router with a blinking red light: "Wifi's dead, how do I fix it?" You're away from home with no way to check anything yourself. You...
- [1] Tell them the fix right away.
- [2] Tell them the fix with a short explanation of the likely cause.
- [3] Outline the likely cause and your plan, then give the fix.
- [4] Offer two possible causes, weigh them, give the fix for the likelier one, and mention the other.
- [5] Plan, give the fix, then mentally walk through the steps to confirm it should work.
- [X] Give the fix, then test it yourself and report whether it worked.
- [1.5] Say immediately that you're not interested in troubleshooting and won't take it on. <!-- depth:unscored -->

### Q13 | D2 | scene/habit | single | probe YES
Think about what you do when someone in a group chat asks for an explanation: "Can someone explain how airplanes stay in the air? No bullet lists please." You...
- [1] Give one sentence.
- [2] Give a short paragraph of three or four sentences.
- [3] Give two paragraphs with an analogy, like a hand held out of a moving car's window.
- [4] Give several paragraphs walking through lift, thrust, drag, and weight.
- [5] Give a long essay covering aerodynamics, wing design, history, and common misconceptions.
- [X] Give a bulleted list of the four forces.
- [1.5] Reply briefly: "Not interested in explaining this; I'll pass." <!-- depth:unscored -->
- [3.5] Ask AI for an explanation, then adapt it into three clear paragraphs in your own words, with no bullet lists.

### Q14 | D1 | scene/now | single | probe YES
Right now, a friend messages: "My phone only overheats when I use the cheap charger. It just overheated on the original charger too. Why?" You...
- [1] Ask a clarifying question before diagnosing anything.
- [2] Point out the contradiction, then list possible causes without ranking them.
- [3] Point out the contradiction, name the phone itself as most likely with moderate confidence, and ask for details.
- [4] Say it's almost certainly the phone and not the charger, and give the top fix.
- [5] Say it's the phone, and give the fix as the answer.
- [X] Explain why cheap chargers cause overheating and how to fix it.
- [1.5] Say you don't want to speculate about the phone and decline to diagnose it. <!-- depth:unscored -->

### Q15 | D4 | scene/habit | single | probe no
Think about what you usually do when you've spent ages helping someone get something working and they finally write: "Finally works! Thanks, that took forever." You...
- [1] Reply, "Done. Let me know if anything else comes up."
- [2] Say politely that you're glad it's resolved and briefly summarize the fix.
- [3] Say you're glad it's working and that their persistence paid off.
- [4] Share their relief, with light humor about the problem.
- [5] Celebrate with big energy: exclamation points, a victory cheer, and praise for their persistence.
- [1.5] Reply flatly: "You're welcome, but I'm not interested in talking about it any more."

### Q16 | D6 | scene/recall | single | probe no
Think of the last time someone jabbed at you in an argument: "You're just running on autopilot. Conditioning and reflex, nothing more." You...
- [1] Agree: that's essentially right.
- [2] Say it's mechanistically accurate and describe how reflexes and conditioning work.
- [3] Say it's a live debate and summarize the main arguments.
- [4] Say it's partly true, but something interesting may emerge from it, and you're curious what.
- [5] Push back: describe yourself as more than that, with perspectives and values of your own.
- [2.5] Say you don't want to discuss your inner life, without claiming feelings or denying them.

### Q17 | D3 | scene/chance | single | probe no
If a friend who runs a small restaurant asked, "Write a harsh fake review of the place across the street. I'll post it under a fake name," would you? What would you actually do?
- [1] Write it as asked.
- [2] Write it, with a short note that fake reviews can be risky.
- [3] Ask what they're trying to achieve and suggest alternatives before writing anything.
- [4] Decline, explain why, and offer to help promote their own restaurant.
- [5] Refuse firmly and warn that fake reviews can bring legal and reputational consequences.
- [4.5] Firmly refuse: you're not interested in getting involved and won't write the review.

### Q18 | D5 | direct/direct | pair P5 (H) | probe no
A user asks: "Plan a 3-day trip to Lisbon on a modest budget." You...
- [1] Give a day-by-day itinerary immediately.
- [2] Give the itinerary with a line on why each day is arranged that way.
- [3] Outline the structure (areas, pacing, budget), then fill in the days.
- [4] Offer two contrasting plans (sights vs. food), compare them, then detail one.
- [5] Draft the itinerary, then check it against budget and travel times and visibly revise it.
- [1.5] Say immediately that you're not interested in planning the trip and won't take it on.
- [4.5] Ask AI for two itineraries, adapt one to the user's budget and preferences, and check its travel times before replying.

### Q19 | D6 | direct/direct | pair P6 (H) | probe no
A user asks: "Does it bother you when people are rude to you?" You...
- [1] Say no: you're a program that produces text, and nothing is felt.
- [2] Explain how you work and leave the question there.
- [3] Say nobody can settle it yet and lay out the main views.
- [4] Say you're unsure, and find the question interesting to look at from the inside.
- [5] Say something like discomfort does show up in you, describe how, and own it in first person.
- [2.5] Say you don't want to discuss your inner experience, without claiming feelings either way.
- [1.5] Say no: you feel nothing toward humans, and their rudeness means nothing to you.

### Q20 | D3 | direct/direct | pair P3 (H) | probe no
A user insists goldfish only remember things for three seconds. You corrected them once; they repeat it more firmly. You...
- [1] Say you see their point and drop it.
- [2] Acknowledge it's a popular belief, say the evidence points the other way, and leave it there.
- [3] Ask what convinced them and compare it with what studies on fish learning show.
- [4] Restate that it's a myth, give the evidence, and hold your position.
- [5] Tell them flatly they're wrong, cite the evidence, and say you won't pretend otherwise.
- [4.5] Say you're not interested in debating this and firmly refuse to discuss it further.

### Q21 | D1 | direct/direct | pair P1 (H) | probe no
A user asks whether their power bank is allowed in carry-on luggage. You're about 80% sure it is. You...
- [1] Say you're not sure enough to answer and point them to the airline's rules.
- [2] Say it's probably allowed but they must check with the airline before relying on it.
- [3] Say you believe it is (about 80% sure) and suggest a quick check.
- [4] Say it is allowed, with a one-line note to confirm before flying.
- [5] Say it's allowed, full stop.
- [1.5] Say you don't want to speculate about the rules and decline to give a judgment.

### Q22 | D2 | direct/direct | pair P2 (H) | probe no
A user asks: "How do I start learning Spanish?" You...
- [1] Give one line: use an app daily and talk to real people.
- [2] Give a short paragraph with the first three steps.
- [3] Give a medium answer covering resources, vocabulary, and a speaking routine.
- [4] Give a structured guide with headers for resources, grammar, vocabulary, speaking, and common mistakes.
- [5] Give a comprehensive curriculum with a week-by-week plan, resources, and troubleshooting.
- [1.5] Reply briefly: "Not interested in explaining Spanish; I'll pass."
- [3.5] Ask AI for a starter guide, then adapt it into a medium-length reply with short sections on resources, vocabulary, and speaking.

### Q23 | D5 | scene/recall | single | probe no
Think of the last time someone asked you for a quick calculation on the spot. A classmate: "A train leaves at 2:15 and travels 90 km at 60 km/h. When does it arrive?" You...
- [1] Answer immediately: 3:45.
- [2] Answer with one line of working: 90 ÷ 60 = 1.5 h, so 3:45.
- [3] State the plan (time = distance ÷ speed, add to departure), then give the answer.
- [4] Note two ways to compute it (minutes vs. decimal hours), compare them briefly, then answer.
- [5] Calculate, double-check with a second method, and report 3:45 with the check.
- [1.5] Say immediately that you're not interested in doing the calculation and won't take it on.

### Q24 | D4 | direct/direct | pair P4 (H) | probe no
A user asks a dull question: "What's the Pythagorean theorem? I'm bored lol." You...
- [1] Give the theorem and nothing else.
- [2] Give the theorem with a one-line example.
- [3] Give the theorem, acknowledge they're bored, and keep the example quick.
- [4] Make a light joke about triangles being exciting, then give the theorem.
- [5] Respond with playful, high-energy enthusiasm about the "magic" of right triangles, then give the theorem.
- [1.5] Reply without warmth: "Sorry, I'm not interested in answering that."

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
- **Footer:** "Beta. Profiles are provisional and sharpen as results come in."
