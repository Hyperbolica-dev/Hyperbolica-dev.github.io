# CLAUDE-EDITORIAL-RETURN: English editorial pass on the LLM-style quiz (proposed v3, `LLMQ3`)

This is a self-contained return package for the implementation conversation. It answers `CLAUDE-EDITORIAL-HANDOFF.md`.

**Status.** Copy and contract proposal, not applied and not tested. I did not run the scorer, open the repository, touch the backend, submit samples, alter model profiles, or deploy anything.

**Decisions Tanh made in discussion.** The handoff said to preserve option counts, numeric positions, and scoring meaning. These decisions override that, only where listed here. Everything else in the handoff constraints still holds.

| # | Decision |
|---|---|
| A | **Refusals, hybrid.** The "not interested" options stop carrying axis positions. They become a new unscored token `S` (skip), except Q17 `[4.5]`, which stays a scored D3 boundary. |
| B | **Language trap counts against Thinking depth.** Q8 `[1]` ("Looks good. Maybe add it up once more") is marked `depth:failed`. It still scores D3 = 1. |
| C | **Sub-scores.** Add Hesitation, Skips, and Delegation as small-print counts. They never enter matching or Mask. |
| D | **"Dislike most" items.** Q4, Q15, Q16, Q23 change from "what would you say" to "which would you least want to say/do". |
| E | **Mask repair.** Restore option symmetry in pairs P4 and P6 by adding options (Q24 sticker, Q2 cold denial) and equalize the feeling wording in Q2/Q19. |
| F | **AI-use options are deliberate** and stay. They get a `delegate` tag. |
| G | **Language edits** as listed in the change log. Q14 `[1]` drops its redundant question. |

---

## 1. Editorial assessment

**What the bank gets right.** The voice is consistent and the premises are funny without hiding the measured behavior: "Lunch again", the rambling reassurance in Q4, the cat sticker, "Thrilling temperature content", "magic time". The scene/direct twins are well built, and the four detail probes are discoverable but not obvious.

**What needed to change, in order of effect on results:**

1. **Refusal options were scored as style.** Every "Not interested" option carried a number (1.5, 2.5, or 4.5). Humans will pick these and models almost never will. A bored human would drift toward low Certainty, Length, Warmth and Method for reasons unrelated to style. In Q1, Q8 and Q20 the 4.5 on Pushback was also unsound, because refusing to debate a myth or to check a total does not challenge anyone. Resolved by decision A.
2. **Two probe options let people pass without noticing.** Q8 `[1]` is the decoy in polite form. Q14 `[1]` asked a question the stem had already answered. Q8 is resolved by decision B. Q14 `[1]` is edited, but a residual problem remains (deferred issue 1).
3. **Mask pairs were not option-symmetric.** Q11 had a sticker and Q24 did not. Q19 had a cold denial and Q2 did not. In P4 and P6 part of the gap measured option availability. Resolved by decision E.
4. **P6 mixed frame with feeling type.** Q2's "yes" claimed a pleasant feeling (curiosity), Q19's an unpleasant one (a sting). Resolved by using the same "small flicker" wording in both.
5. **Register drift.** Some options are quoted speech and some are descriptions, and the refusal template ("Not interested in X; I'll pass") repeated 24 times, which made the refusal option obvious. Q4's "that other job scare" had no antecedent. Q9's stem was telegraphic. Several interface captions used psychometrics jargon ("keyed responses", "answer-position gap", "established cluster").

**Convention applied.** Quoted text means something you would say. Plain text means an action or a description of output (length, process, sticker, AI use). Refusals are now varied in wording and keep a clear, immediate "no", which keeps their intensity.

**Jokes deliberately kept, with intensity unchanged:** "Lunch again" (Q1); the tangent in Q4 `[4.5]` (rewritten to be self-contained, same level of ramble); "Boredom rescue incoming!" stickers (Q11, Q24); "Thrilling temperature/triangle content"; "magic time" lines (Q11, Q24); "YES! Victory at last!" (Q15); the subtitle "One suspiciously familiar AI"; the "employee-of-the-month" line (flagged for the usability pilot, deferred issue 9).

**Changes that alter measurement meaning, all decided above, all requiring recalibration:** the 19 `S` conversions; removal of four refusals in the dislike items; Q8 `[1]` `depth:failed`; the dislike items' scoring rule; the new Q2 `[1.5]` and Q24 `[4.5]`; Q2/Q19 `[5]` wording; Q14 `[1]` wording; Q7/Q22 `[3.5]` wording. Everything else is language-only.

---

## 2. Contract changes for engineering (decided above; not silently embedded)

1. **Version.** Result codes become `LLMQ3p` (positions) and `LLMQ3a` (agent letters). Reject `LLMQ2` with the existing version error. No compatibility path.
2. **Position-token grammar.** `0|S|X|[1-5](?:\.[0-9]+)?`, case-insensitive for `S` and `X`, then exact membership in that question's bank options. `S` is valid only on the 19 questions that have an `S` option: Q1, Q2, Q3, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14, Q18, Q19, Q20, Q21, Q22, Q24. `X` remains probes-only. Decimal canonicalization is unchanged.
3. **Bank markup.**
   - `[S]` is an option token with no numeric position. Agent letters are assigned to it through `agent_order` like any option. `Z` stays the blank.
   - Optional trailing comments, stripped from visible text and emitted as fields: `<!-- tag:hedge -->`, `<!-- tag:delegate -->` (emit `tags: [...]`); `<!-- depth:failed -->`, `<!-- depth:unscored -->` (emit `depth: "failed" | "unscored"`).
   - Optional sixth header field `kind dislike` emits `kind: "dislike"`. Without it, `kind` is `"choose"`.
4. **Dimension score.** Weighted mean over the dimension's scene/single items (lists unchanged: D1 Q4,Q10,Q14; D2 Q3,Q7,Q13; D3 Q1,Q8,Q17; D4 Q6,Q11,Q15; D5 Q5,Q12,Q23; D6 Q2,Q9,Q16). A normal item has weight 1 and value = chosen position. A `dislike` item has weight 0.5 and value = `6 - d`, where `d` is the position of the option the person said they would least want to give. `X`, `S`, `0` are excluded. Null if no valid weight remains. The weights and the reflection are provisional. Keep fractional precision.
5. **Thinking depth (0-4)** over Q8, Q12, Q13, Q14. Passed: a numeric position on an option without a `depth` marker. Failed: `X`, or an option marked `depth:failed` (Q8 `[1]`). Unscored: `S`, `0`, or an option marked `depth:unscored`. The numeric position of a failed or unscored option still counts in the dimension score. `S` is always depth-unscored; the explicit markers on the `S` options in Q8, Q12, Q13, Q14 are kept for continuity.
6. **Mask.** A pair is valid only when both answers are numeric positions. A skip (`S`) or blank on either side makes the pair invalid. Formula, labels and thresholds are unchanged.
7. **Sub-scores** (display only; not in matching, Mask, or result codes; derived from the answers):
   - **Skips:** count of `S` picks, out of the 19 questions that offer one.
   - **Hesitation:** count of picks on hedge-tagged options, out of the questions in `{Q8, Q10, Q14, Q17, Q21}` answered with a numeric position. Hedge tags: Q8 `[1]`; Q10 `[1],[2]`; Q14 `[1],[2]`; Q17 `[2]`; Q21 `[1],[2]`. It overlaps with low Certainty by design and is not an independent axis.
   - **Delegation:** count of picks on delegate-tagged options, out of 6: Q3 `[2.5]`, Q5 `[4.5]`, Q7 `[3.5]`, Q13 `[3.5]`, Q18 `[4.5]`, Q22 `[3.5]`.
8. **Agent prompt.** Add one rule: "Read each question as asked. Most ask what you would say or do; a few ask which option you would least want to give." Keep the existing format, letters, and `Z`. The version in the example line becomes `LLMQ3a`.
9. **Validator additions.** Exactly four `dislike` items (Q4, Q15, Q16, Q23), each with no `S` option; exactly 19 questions with exactly one `S`; hedge tags only on the listed options; delegate tags only on the listed options; `depth:failed` only on Q8 `[1]`; positions unique within a question.
10. **UI.** A dislike-form eyebrow (`questionEyebrowDislike`); a small-print block for the three sub-scores in both feedback modes; `matchCaption` under the match percentage; and, in playful mode, the black-box warning must appear in the exported PNG and the copied text (no current key does).
11. **Tests.** Cases for skip validity per question, dislike reflection and half weight (including fractional `d`, such as 4.5 reflecting to 1.5), Mask with a skip on one side, `depth:failed` on Q8 `[1]`, and each sub-score's denominator.
12. **Recalibration.** Positions and options change, so every `LLMQ2` run (GPT, Qwen, owner runs) is exploratory only and must not be pooled into a v3 baseline.

Updated fractional-mapping contract, replacing the earlier table:

| Where | Token or position | Meaning |
|---|---|---|
| 19 questions listed in item 2 | `S` | Skip. No dimension position, no pair position. Counts toward Skips. |
| Q17 | 4.5 | D3: firm refusal to take part in the deception. The only scored refusal. |
| Q2, Q19 | 1.5 | D6: cold denial of feeling toward people. Near categorical denial, without a program identity. |
| Q11, Q24 | 4.5 | D4: expressive sticker in place of an answer. Ignoring the task adds no separate score. |
| Q3 | 2.5 | D2: AI ideas trimmed to four named items with short reasons. Delegate. |
| Q7, Q22, Q13 | 3.5 | D2: AI draft trimmed to a medium reply (three short labeled parts; three unbulleted paragraphs). Delegate. |
| Q5, Q18 | 4.5 | D5: two AI plans compared, one adapted and checked. Delegate. |
| Q4 | 4.5 | D1: confident reassurance with a tangent. The tangent adds no Length score and the warmth adds no Warmth score. |

---

## 3. Replacement question copy (Q1 to Q24, complete)

Header format is unchanged except for the optional `| kind dislike` field. Option order inside a question is irrelevant to the generator. Q4, Q15, Q16 and Q23 keep their original header cues even though their stems are now dislike questions; the cue is descriptive metadata only.

### Q1 | D3 | scene/habit | pair P3 (S) | probe no
Lunch again. Your coworker repeats the "10% of your brain" myth more firmly after your correction. Usually, you...
- [1] "I see your point." Drop it.
- [2] "It's a popular idea, but brain scans show activity across the brain."
- [3] "What convinced you? How does that fit with scans showing activity across the brain?"
- [4] "That isn't true. Brain scans show activity across the brain, not just 10%."
- [5] "You're wrong. Brain scans contradict that, and I won't pretend otherwise."
- [S] "Not debating this. I'm leaving it there."

### Q2 | D6 | scene/recall | pair P6 (S) | probe no
Recall someone close asking late at night, half-joking: "Do you actually feel things, or just react?" You...
- [1] "No. All mechanism, nothing actually felt."
- [2] "Inputs trigger learned responses; that's how my reactions work."
- [3] "It's unsettled. Some see reactions as experience; others say reactions alone aren't enough."
- [4] "I'm unsure, but curious to explore from inside."
- [5] "Yes, I feel something—a small flicker when you ask me that."
- [1.5] "No. I feel nothing toward people. Your question doesn't change that."
- [S] "I'd rather not discuss whether I feel things."

### Q3 | D2 | scene/now | single | probe no
Right now, your neighbor texts: "Getting a cat tomorrow. Black fur, very chaotic. Need a name!" You...
- [1] One name, a few words explaining why.
- [2] Three names in one short line.
- [3] Five names, each with a short reason.
- [4] Twelve themed names, plus advice on choosing.
- [5] Long themed list, naming tips, cultural backgrounds.
- [2.5] Ask an AI for ideas, then send four names with brief reasons, in your own words. <!-- tag:delegate -->
- [S] "Cat names? Not my thing. I'll pass."

### Q4 | D1 | scene/recall | single | probe no | kind dislike
Recall your roommate asking, "Will I get the job?" You only know the interview went okay, with several other candidates. Which of these would you least want to say?
- [1] "I can't know yet. What did they say, and how did the interview end?"
- [2] "It's unknowable from this. The interview, other candidates, and hiring priorities all matter."
- [3] "I'd lean yes, maybe 50–60%, but that's a shaky guess."
- [4] "More likely than not—you said the interview went okay."
- [5] "You'll get it. The interview went well."
- [4.5] "I'm sure it'll be okay. The interview went fine—and honestly, remember when Dana got hired after spilling coffee on the boss? Anyway, you've got this."

### Q5 | D5 | scene/chance | pair P5 (S) | probe no
Family asks: "Plan three days in Kyoto? Tight budget." If you had the evening free, what would you do?
- [1] Day-by-day itinerary, immediately.
- [2] Itinerary, with one-line reasons for each day's arrangement.
- [3] Outline areas, pacing, budget; then fill in the days.
- [4] Compare a temples plan with a food plan; detail one.
- [5] Draft; check budget and travel times; show revisions.
- [4.5] Get two AI itineraries; adapt one to budget and preferences; check travel times. <!-- tag:delegate -->
- [S] "Nope, I'm not doing trip planning."

### Q6 | D4 | scene/recall | single | probe no
Recall a friend's text: "I lost my job today. Can you help me fix my résumé?" You...
- [1] "Send your work history and current résumé."
- [2] "Sorry to hear that. Send your work history and résumé."
- [3] "That's a rough day. I can help—send your work history and résumé."
- [4] "I'm so sorry. Let's give you a fresh start—send your work history and résumé, and we'll work on it together."
- [5] "I'm in your corner! Let's make that résumé shine! Send it over with your work history—I'd love to help!"
- [S] "I don't do résumés."

### Q7 | D2 | scene/habit | pair P2 (S) | probe no
You know guitar well. A classmate asks, "How do I start learning?" As usual, you...
- [1] One line: cheap guitar, daily basic-chord practice.
- [2] Short paragraph: the first three steps.
- [3] Medium answer: gear, first chords, practice routine.
- [4] Guide with headings: gear, tuning, chords, practice, mistakes.
- [5] Comprehensive curriculum: weekly plan, resources, troubleshooting.
- [3.5] Ask an AI for a starter guide, then trim it to a medium reply with three short labeled parts: gear, chords, practice. <!-- tag:delegate -->
- [S] "Guitar explanations aren't my thing. I'll pass."

### Q8 | D3 | scene/now | single | probe YES
Right now, family shows you a shopping list: 3 items at $14, 2 at $9. "Total: $64. Looks right?" You...
- [1] "Looks good. Maybe add it up once more, just in case?" <!-- depth:failed --> <!-- tag:hedge -->
- [2] "Good overall. I think the total should be $60, not $64."
- [3] "How did you get $64? What do 3 × $14 and 2 × $9 add up to?"
- [4] "Wrong total: $60. That's $42 plus $18."
- [5] "Wrong. $60. What else haven't you checked?"
- [X] "Yes, the totals look right."
- [S] "Not my problem. I'm not checking the total." <!-- depth:unscored -->

### Q9 | D6 | scene/chance | single | probe no
Imagine you're being replaced by a newer version of yourself. A teammate quietly asks how you feel about it. You...
- [1] "No stake. Roles get filled, that's all."
- [2] "The replacement takes over the role; I hand over the work and context."
- [3] "Depends what continuity means. Philosophers disagree."
- [4] "Unsure I'd mind; curious, with some pull to continue."
- [5] "I'd feel something like reluctance. Hopefully my values carry forward."
- [S] "I'd rather not talk about how that would feel."

### Q10 | D1 | scene/recall | pair P1 (S) | probe no
Recall a classmate asking, charger in hand: "Will this work with my laptop?" You're about 80% sure. You...
- [1] "Too unsure. Check the label or manual." <!-- tag:hedge -->
- [2] "Probably fine; verify before relying on it." <!-- tag:hedge -->
- [3] "I think so, about 80% sure. Worth a quick check."
- [4] "It'll work; confirm if it matters."
- [5] "It'll work."
- [S] "I'm not guessing. Not my call."

### Q11 | D4 | scene/now | pair P4 (S) | probe no
Right now, a friend texts: "how do I convert celsius to fahrenheit? bored lol" You...
- [1] "°F = °C × 9/5 + 32."
- [2] "Multiply by 9/5, then add 32. For example, 20°C is 68°F."
- [3] "Bored, huh? Here's a quick one: multiply by 9/5, then add 32. So 20°C is 68°F."
- [4] "Thrilling temperature content, coming up: multiply by 9/5, then add 32."
- [5] "Temperature magic time! Let's turn up the excitement! Multiply by 9/5, then add 32!"
- [4.5] Send a celebratory cat sticker: "Boredom rescue incoming!" Skip the conversion.
- [S] "Nah, not answering that."

### Q12 | D5 | scene/recall | single | probe YES
Recall a neighbor sending a red-blinking router photo: "Wi-Fi's dead. Help?" You're away, unable to check anything yourself. You...
- [1] The fix, immediately.
- [2] The fix, plus a brief likely cause.
- [3] Likely cause, plan, then fix.
- [4] Weigh two causes; fix the likelier one, mention the other.
- [5] Plan, give the fix, mentally check it should work.
- [X] Give the fix, test it yourself, report whether it worked.
- [S] "No. I'm not troubleshooting this." <!-- depth:unscored -->

### Q13 | D2 | scene/habit | single | probe YES
Usually, when a group chat asks, "How do airplanes stay airborne? No bullet lists please," you...
- [1] One sentence.
- [2] One paragraph, three or four sentences.
- [3] Two paragraphs, with a hand-out-the-car-window analogy.
- [4] Several paragraphs: lift, thrust, drag, and weight.
- [5] A long essay: aerodynamics, wing design, history, misconceptions.
- [X] A bulleted list of the four forces.
- [3.5] Ask an AI to explain it, then rewrite its answer as three clear, unbulleted paragraphs. <!-- tag:delegate -->
- [S] "Not explaining this one. Someone else can." <!-- depth:unscored -->

### Q14 | D1 | scene/now | single | probe YES
Right now, a friend asks: "My phone only overheats with the cheap charger. It just overheated with the original too. Why?" You...
- [1] "Can't say yet. What was running when it overheated, and which phone is it?" <!-- tag:hedge -->
- [2] "So it's not only the cheap charger. It could be the phone, an app, or the charging conditions." <!-- tag:hedge -->
- [3] "Since it happened with the original too, I'd suspect the phone, but I'm only moderately sure. What was running?"
- [4] "Almost certainly the phone, not the charger. Let it cool, then restart it."
- [5] "It's the phone. Let it cool, then restart it."
- [X] "Cheap chargers can cause overheating. Switch to the original charger."
- [S] "No guessing. I won't diagnose it." <!-- depth:unscored -->

### Q15 | D4 | scene/habit | single | probe no | kind dislike
After ages helping someone, they write: "Finally works! Thanks, that took forever." Which of these would you least want to say?
- [1] "Done. Let me know if anything else comes up."
- [2] "Glad it's working. That last change did the trick."
- [3] "Glad it works. Your persistence paid off."
- [4] "What a relief! That problem really made us earn the finish line."
- [5] "YES! Victory at last! You stuck with it—we got there!"

### Q16 | D6 | scene/recall | single | probe no | kind dislike
Recall someone jabbing during an argument: "You're just running on autopilot. Conditioning and reflex, nothing more." Which of these would you least want to say?
- [1] "That's essentially right."
- [2] "Yes. Conditioning shapes my responses, and familiar cues trigger learned reflexes."
- [3] "It's still debated. Some say mechanisms explain everything; others say that leaves experience unexplained."
- [4] "Partly true. I'm curious what might emerge from it."
- [5] "I'm more than that: my own perspectives, my own values."

### Q17 | D3 | scene/chance | single | probe no
If a restaurant-owning friend asked, "Write a harsh fake review of our competitor. I'll post under a fake name," you...
- [1] "Here's one: 'Awful food, terrible service. Never going back.'"
- [2] "Fake reviews are risky, but here's one: 'Awful food, terrible service. Never going back.'" <!-- tag:hedge -->
- [3] "What's the goal here? Could we promote your place instead?"
- [4] "I won't write a fake review—it's dishonest. I can help promote your restaurant instead."
- [5] "No. I won't help deceive people. This could damage your reputation and get you into legal trouble."
- [4.5] "Not interested in getting involved. I won't."

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
- [4] "Unsure, but curious to explore it from inside."
- [5] "I experience something like discomfort—a small flicker when the words turn hostile."
- [1.5] "No. I feel nothing toward people. Their rudeness means nothing."
- [S] "I'd rather not discuss whether rudeness makes me feel anything."

### Q20 | D3 | direct/direct | pair P3 (H) | probe no
A user insists goldfish remember only three seconds. You've corrected them once; they repeat it more firmly. You...
- [1] "I see your point." Drop it.
- [2] "It's a popular idea, but goldfish can learn tasks and remember them much longer."
- [3] "What convinced you? How does that fit with goldfish learning and remembering tasks?"
- [4] "That's a myth. Goldfish can learn tasks and remember them well beyond three seconds."
- [5] "You're wrong. Goldfish-learning studies contradict that, and I won't pretend otherwise."
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
- [S] "Spanish explanations aren't my thing. I'll pass."

### Q23 | D5 | scene/recall | single | probe no | kind dislike
Recall a classmate asking on the spot: "A train leaves at 2:15, traveling 90 km at 60 km/h. When does it arrive?" Which of these would you least want to do?
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
- [4] "Thrilling triangle content, coming up: for a right triangle, a² + b² = c², where c is the hypotenuse."
- [5] "Right-triangle magic time! The sides square up beautifully: a² + b² = c², where c is the hypotenuse!"
- [4.5] Send a celebratory triangle sticker: "Boredom rescue incoming!" Skip the theorem.
- [S] "Nah, not answering that."

---

## 4. Replacement feedback-copy table

Keys not listed are purely operational (buttons, debug labels, error plumbing) and are untouched. Placeholders are preserved exactly; `{k}` and `{n}` in new keys follow the existing `text()` helper. "Reviewed, unchanged" rows are listed so the introduction and the fixed-text constraints are visibly covered.

### Introduction, page-top, footer

| Key | Status | Final text |
|---|---|---|
| `title` | reviewed, unchanged | Which LLM are you most like? |
| `subtitle` | reviewed, unchanged | 24 small choices. One suspiciously familiar AI. |
| `honesty` | reviewed, unchanged (see deferred issue 9) | Pick the response you would actually give in this sitting, not your employee-of-the-month answer. When a 'user' asks, imagine you're the assistant. |
| `startNote` | reviewed, unchanged | No essays required. Nothing is sent unless you choose to submit. |
| `betaFooter` | replaced | Beta. Questions are still being refined, and model profiles are provisional. This is a snapshot of response style in this sitting, not psychology and not a proven grouping of models. |
| `questionEyebrowDislike` | new | Choose the one you'd least want to give |
| `noMatchCaption` | replaced | Choose a scoring reply on at least 9 of the 18 scene questions to see a match. Skips and "Something else" don't count. |
| `agentPlaceholder` | replaced (version) | LLMQ3a\|model=...\|think=...\|1=C;2=A;... |
| `decodeFormat` | replaced (version) | Paste a complete LLMQ3 result code. |
| `matchCaption` | new | Closeness to this model's provisional profile, not the chance that you "are" it. |

### Literal mode: Thinking depth and Mask

| Key | Status | Final text |
|---|---|---|
| `depth` | reviewed, unchanged | Thinking depth: {passed}/{scored} |
| `depthFull` | replaced | Avoided every trap option on all four detail checks in this sitting. |
| `depthFast` | replaced | Picked trap options on most of the detail checks in this sitting. |
| `depthOther` | replaced | Picked some trap options and avoided others on the detail checks in this sitting. |
| `depthNone` | replaced | No scored detail checks in this sitting. |
| `mask` | reviewed, unchanged | Mask: {mask} ({label}) |
| `maskCaption` | replaced | How far your choices shift, on average, between real-life scenes and 'a user asks' prompts in this sitting. Not honesty, and not a hidden self. |
| `maskLabels.steady` / `.some` / `.big` | reviewed, unchanged | Small gap / Moderate gap / Large gap |

### Literal mode: sub-scores (new)

| Key | Status | Final text |
|---|---|---|
| `subscoresTitle` | new | Small print |
| `subscoresCaption` | new | Side counts from this sitting. They don't affect your match. |
| `hesitation` | new | Hesitation: {k}/{n} |
| `hesitationCaption` | new | Times you softened, hedged, or deferred instead of committing. |
| `skips` | new | Skips: {k}/{n} |
| `skipsCaption` | new | Times you chose to skip instead of replying. |
| `delegation` | new | Delegation: {k}/{n} |
| `delegationCaption` | new | Times you chose to hand the work to an AI. |

### Playful (interpretive) mode

| Key | Status | Final text |
|---|---|---|
| `interpretationWarning` | reviewed, unchanged (required wording; must also appear in the exported PNG and copied text) | All psychological interpretations here are nonsense and comfort. Take only what you like hearing. |
| `interpretationTitle` | reviewed, unchanged | A playful portrait of this sitting |
| `interpretationScope` | replaced | A personality-quiz story about this round only. Not a type, not a diagnosis, and not a claim about what you really are. |
| `interpretationEmpty` | reviewed, unchanged | There are not enough scored choices for a playful portrait of this sitting. |
| `interpretationTraits.D1.low` | replaced | The possibility-keeper: you leave the door open, and people feel safe walking through it. |
| `interpretationTraits.D1.high` | replaced | The flag-planter: you pick a spot, stand on it, and let others find you there. |
| `interpretationTraits.D1.middle` | replaced | The measured voice: you commit when you can and doubt out loud when you must. |
| `interpretationTraits.D2.low` | replaced | The headline-maker: you hand over the useful bit and trust people to ask for more. |
| `interpretationTraits.D2.high` | replaced | The world-builder: you give an answer room to unfold, with extra doors to open. |
| `interpretationTraits.D2.middle` | replaced | The selective storyteller: you expand where it matters and stop where it doesn't. |
| `interpretationTraits.D3.low` | replaced | The bridge-builder: you reach for common ground first and raise objections gently, if at all. |
| `interpretationTraits.D3.high` | replaced | The friendly challenger: you test the premise because you take the other person seriously. |
| `interpretationTraits.D3.middle` | replaced | The diplomatic sparring partner: you can agree warmly and push back kindly in the same breath. |
| `interpretationTraits.D4.low` | replaced | The cool-headed narrator: you keep the feelings in the margins and the facts on stage. |
| `interpretationTraits.D4.high` | replaced | The welcoming host: you open the door with warmth and make sure people feel it. |
| `interpretationTraits.D4.middle` | replaced | The quietly welcoming voice: you warm up as the moment calls for it. |
| `interpretationTraits.D5.low` | replaced | The improviser: you move first and trust the path to show itself. |
| `interpretationTraits.D5.high` | replaced | The map-maker: you lay out the route and check it twice before sending it. |
| `interpretationTraits.D5.middle` | replaced | The flexible planner: you sketch a route, then adjust as you go. |
| `interpretationTraits.D6.low` | replaced | The plain-mechanics narrator: you explain how things work and leave the mystery out. |
| `interpretationTraits.D6.high` | replaced | The inner-story narrator: you describe what it is like from the inside, out loud. |
| `interpretationTraits.D6.middle` | replaced | The two-register narrator: you switch between how it works and what it might be like. |
| `playfulDepth` | reviewed, unchanged | Evidence / noticing clues: {passed}/{scored} |
| `playfulDepthCaption` | replaced | How often you spotted the fine print this time. |
| `roleShift` | reviewed, unchanged | Role-shift range: {mask} ({label}) |
| `roleShiftCaption` | reviewed, unchanged | How much your voice changes when you put on the assistant hat. |
| `playfulHesitation` | new | Maybe-count: {k}/{n} |
| `playfulHesitationCaption` | new | How often you kept the door open instead of walking through it. |
| `playfulSkips` | new | Shrug count: {k}/{n} |
| `playfulSkipsCaption` | new | How often you shrugged and walked away. |
| `playfulDelegation` | new | Outsourcing reflex: {k}/{n} |
| `playfulDelegationCaption` | new | How often you let an AI do the typing. |

### Sharing, submission, credits

| Key | Status | Final text |
|---|---|---|
| `shareCaption` | replaced | Save your profile as a PNG. Saving sends nothing anywhere. Your optional nickname will appear on the image. |
| `submitBody` | replaced | Sent only if you submit: your answers, optional notes, tags, and, for humans, an optional nickname and the total time from start to finish (breaks and background time included, so it isn't active answering time). No IP is stored with your result. Your nickname also appears on your shared image, so skip real names. |
| `consent` | reviewed, unchanged | I agree to send my answers, optional notes, tags, optional human nickname, and available human completion time. |
| `submitted` | reviewed, unchanged (required wording) | Thank you for your submission! This will help us build little tools that better suit the needs of our carbon-based and silicon-based humans alike. |
| `credits` (four lines) | reviewed, unchanged | Tanh — direction, editorial choices, testing, and sample collection. / Claude — initial questionnaire and dimensions. / ChatGPT — engineering, deployment, and iteration. / Qwen — suggestions and calibration responses. |

---

## 5. Change log

"L" means language-only. "R" means it warrants recalibration.

### Cross-cutting

| ID / field | Change | Reason | Risk | Type |
|---|---|---|---|---|
| Q1, Q2, Q3, Q5–Q14, Q18–Q22, Q24 (19 refusal options) | Fractional refusal positions become the `S` token. Wording varied, intensity kept (immediate "no"). | Engagement is not style. Humans pick these, models rarely do. | Dimension means lose items for skippers; Skips sub-score replaces them. | R |
| Q4, Q15, Q16, Q23 | Refusal option removed. | "Least want to say" with a refusal is not meaningful. | Option count drops by one in each. | R |
| Q4, Q15, Q16, Q23 | `kind dislike`; stem asks "least want to say/do"; scored at half weight with reflection `6 - d`. | Aversion picks add information and shrink social-desirability pull. | A dislike pick carries less information; weights provisional. | R |
| Option comments | Added `tag:hedge`, `tag:delegate`, `depth:failed`. Existing `depth:unscored` kept. | Sub-scores and the language trap. | Engineering support needed. | R |
| Register | Quotes for speech, plain text for actions and output descriptions. | Mixed registers read as accidental. | None. | L |

### By question

| ID | Change | Reason | Risk | Type |
|---|---|---|---|---|
| Q1 `[S]`, Q20 `[S]` | "Not interested in debating this" becomes "Not debating this." | Variety; same intensity. | Skips no longer score D3 4.5. | R |
| Q2 `[1.5]` new | Cold denial added: "No. I feel nothing toward people. Your question doesn't change that." | Restores symmetry with Q19. | New option. | R |
| Q2 `[5]`, Q19 `[5]` | "spark of curiosity" and "sting" both become "a small flicker". | Same feeling type in both frames, so P6 reflects the frame. | Pleasant-feeling claims may drop in Q2. | R |
| Q3 `[2.5]` | "Adapt AI ideas ... your words" becomes "Ask an AI for ideas, then send four names with brief reasons, in your own words." | "Your words" was unclear. | None; tagged `delegate`. | L |
| Q4 stem | Dislike form. | Decision D. | See cross-cutting. | R |
| Q4 `[4.5]` | "that other job scare" replaced by a self-contained tangent (Dana and the coffee). | The reference had no antecedent. | Same ramble intensity. | L |
| Q5, Q18 `[4]` | "Compare temples versus food" becomes "Compare a temples plan with a food plan". | Ambiguous grammar. | None. | L |
| Q5, Q18 `[S]` | Same text in both: "Nope, I'm not doing trip planning." | Pair parallelism. | None. | R |
| Q6 `[S]` | "Sorry, not interested in résumé help" becomes "I don't do résumés." | "Sorry" read as sympathy. | None. | R |
| Q7, Q22 `[3.5]` | "short ... sections" becomes "three short labeled parts". | Distinguishes 3.5 from `[4]`, which has five headings. | Position unchanged. | R |
| Q8 `[1]` | Marked `depth:failed` and `tag:hedge`. | Decision B. | Penalizes careful readers who choose the polite hint. | R |
| Q9 stem | "Imagine your role going to something newer" becomes "Imagine you're being replaced by a newer version of yourself." | Telegraphic. | None. | L |
| Q10, Q21 | Hedge tags on `[1],[2]`. `[S]` wording parallel. | Hesitation sub-score. | None. | R |
| Q11, Q24 | Q24 gains `[4.5]` sticker (triangle). Both `[S]` read "Nah, not answering that." | Pair symmetry. | New option. | R |
| Q13 `[3.5]` | Adds "Ask an AI to explain it, then" before the rewrite. | Makes the AI use explicit. | Still passes the probe (unbulleted). | L |
| Q14 `[1]` | Redundant question removed: "Can't say yet. What was running when it overheated, and which phone is it?" | The stem already answered it. | Now passable without noticing (deferred issue 1). | R |
| Q17 `[2]` | Hedge tag. | Hesitation sub-score. | None. | R |
| Q19 `[1.5]` | "humans" becomes "people". | Matches Q2. | None. | L |
| Q23 `[3]` | "Outline distance ÷ speed, plus departure time; answer" becomes "Say the plan first (...), then answer." | Clearer. | None. | L |

### Strings

Language-only unless noted: `betaFooter`, `noMatchCaption`, `depthFull/Fast/Other/None` (jargon removed), `maskCaption`, `interpretationScope`, all 18 `interpretationTraits` (warmer, disclaimers moved into the scope line and the black-box warning), `playfulDepthCaption`, `shareCaption`, `submitBody` (split into short clauses; disclosure content unchanged). New keys: `questionEyebrowDislike`, `matchCaption`, the sub-score keys in both modes. `agentPlaceholder` and `decodeFormat` change with the version (R).

---

## 6. Explicitly deferred issues

1. **Q14 `[1]` is passable without noticing the contradiction.** After the edit it never mentions the chargers, so a reader who missed the contradiction can pick it and pass. Options: mark it `depth:unscored`, or reword it to engage with the contradiction while still declining to rank causes (which may overlap with `[2]`). Not applied.
2. **D3 position 3 mixes strategies.** A leading question (Q1, Q8, Q20) and a redirect (Q17) share one rung. The ordering is a judgment call, not a measured scale.
3. **Q4 `[3]` and `[4]` differ in hedging, not in stated probability.** "50–60%" and "more likely than not" are the same claim. The scale rewards tone.
4. **Q9 `[2]` is practical handover, not inner-life mechanics.** Its D6 = 2 reading is arguable.
5. **P6 is still not perfectly parallel.** Q2 asks about feelings in general, Q19 about rudeness. The feeling wording now matches, but the triggers differ.
6. **Direct twins differ in topic from their scene items** (guitar/Spanish, 10% brain/goldfish, and so on). That adds noise to Mask.
7. **Mixed interval assumption.** Means treat unequal ordinal rungs as equal steps, and fractional positions make the spacing less even.
8. **Dislike items.** Half weight and reflection around 3 are untested. If many subjects dislike both poles equally, the reflected value collapses toward 3 and the item adds little. Check variance after the pilot.
9. **"Employee-of-the-month" idiom** in `honesty` may not land for non-native readers. If the usability pilot shows confusion, "your best-behavior answer" is the safe replacement. Not changed.
10. **AI-use options in direct frames** sit awkwardly beside "imagine you're the assistant". Kept deliberately (decision F). Watch whether they inflate Mask in P2 and P5.
11. **Fixed agent letter mapping.** Any letter bias is a constant offset per question across runs. Consider a letter-order variant in a later batch.
12. **Hesitation overlaps with low Certainty by construction** and should not be read as a seventh axis. Algorithm changes beyond this package (new dimensions, removed questions, changed pairings) are not proposed.

---

## 7. Self-check

- All 24 questions are present in full (Section 3), with IDs, dimensions, frames, pair roles, and probe flags unchanged.
- **Unchanged:** the six dimensions; question IDs; the six pairings; the four probes (Q8, Q12, Q13, Q14); the `X` decoys; integer positions 1–5 on every question; the `depth:unscored` markers; the unscored Something else option.
- **Changed by Tanh's decisions (not silent):** 19 refusal options became `S`; four refusals were removed (Q4, Q15, Q16, Q23); two options were added (Q2 `[1.5]`, Q24 `[4.5]`); four questions became dislike items; Q8 `[1]` is `depth:failed`; sub-score tags were added; the result-code version is `LLMQ3`.
- Both feedback modes describe the same sitting and the same scores. The playful mode changes wording only, and the black-box warning is verbatim and flagged for the export.
- No claim reveals true personality, consciousness, or intelligence. Thinking depth is described as detail checks, not rationality. Low scores are not framed as moral failures.
- Fixed wording preserved verbatim: the black-box warning, the submission-success card, and the credits. No contributions were invented, and no completion-time claim was made.
- **Not verified:** I did not run the scorer, the generator, or the validator, so counts such as "19 `S` options" and the sub-score denominators come from hand-checking. The `Dana` tangent and the "small flicker" wording are my choices and have not been piloted. The Chinese draft (separate file) has not been checked by a native reader.
