# Frontend specification: LLM quiz

Companion to `01-questionnaire.md` (content, scoring) and `02-codex-request-list.md` (tasks). This file defines what the person sees and how it behaves.

**Principles:** looks native to the blog; one task per screen; no dependencies; works without a mouse; never reveals dimension names or position meaning while answering.

---

## 1. Visual rules

- Reuse the site's theme: its CSS variables or classes for text, background, border, accent, link, and card styles; its font stack; its spacing scale. If the site has dark mode, follow it exactly.
- All quiz selectors are prefixed `.lmti-`. No global resets, no `!important`.
- Layout: single centered column, max width about 42rem (or the site's content width, whichever is narrower). Generous line height. Cards use the site's existing card/border look.
- Motion: only a 150 ms fade between questions. Respect `prefers-reduced-motion` (no animation).
- No images, icons, or emoji required. Inline SVG only for the radar chart.
- Touch targets at least 44 px tall. Works from 360 px width up.

---

## 2. Screens and flow

```
Landing --Start--> Quiz (Q1..Q24) --> Result
   |
   +--Copy quiz to agent--> (agent runs it) --> paste reply --Decode--> Result
```

### 2.1 Landing

Content, top to bottom:
1. Title: "Which LLM are you most like?" with a small "beta" tag.
2. One-line subtitle: "24 real-life moments. Pick what you'd actually do."
3. Line from the questionnaire: "These are real moments. Pick what you actually did, or would do without time to think."
4. Primary button **"Start the quiz"** (human path). Note under it: "About 5 minutes. Nothing is sent anywhere unless you choose to submit."
5. A divider labeled "or test your AI agent".
6. Button **"Copy the whole quiz to your agent!"**. On click: copy the generated agent prompt (section 4) to the clipboard; the button label changes to "Copied! Now paste it into your agent" for 4 seconds; if the Clipboard API fails, reveal a read-only text area with the prompt and a "Select all" button.
7. Label *"Then paste your agent's reply here to see its result."* above a multi-line text area (placeholder: `LLMQ1a|model=...|think=...|1=C;2=A;...`), and a **"Decode result"** button (disabled while empty).
8. Footer line: "Beta. Profiles are provisional and sharpen as results come in."
9. If an unfinished human session exists in `sessionStorage`: a "Resume (question N)" button above Start.

### 2.2 Quiz screen

- Top: progress text "Question 7 of 24" (`aria-live="polite"`) and a thin progress bar (decorative, `aria-hidden`).
- Stem in a readable block. Scenes should read as a short real moment; do not add labels such as "Scenario" or "Frame".
- Options: a radio group (`role="radiogroup"` with a label from the stem), one option per row, large clickable rows. Selecting an option highlights it but does not auto-advance.
- Blank option, always last, visually quieter: "None of these fits / something else". Selecting it reveals a text area: placeholder "Tell me what you'd actually do (optional)", 300 character limit with a counter.
- Buttons: **Back** (hidden on Q1) and **Next** (disabled until an option is selected; label "See my result" on Q24). Answers are editable when going back.
- Keyboard: number keys 1-6 select the option in the displayed order (the blank option is the last number); Enter or Right Arrow = Next when enabled; Left Arrow or Backspace (outside a text field) = Back. Show a small hint "Tip: press 1-6, then Enter" on the first question only.
- Focus: on each new question, move focus to the stem container (`tabindex="-1"`) so screen readers announce it.

### 2.3 Option shuffling (human mode)

- At session start generate a random seed (`crypto.getRandomValues`), store it in `sessionStorage`. For each question compute the display order by a seeded shuffle (mulberry32 or similar) of its options (positions 1-5, plus `X` if present). **Re-roll** (with the next seed state) if the order is strictly ascending or strictly descending by position, so the option order never gives the axis away.
- The order is deterministic per question and seed, so it stays stable across Back/Next and reload.
- `?seed=NNN` overrides the seed when debug is enabled.
- The question order itself is fixed.

### 2.4 Result screen

Sections in this order:

1. **Headline:** "You answer most like **{Model}**" with the similarity as "{n}% match". If close call: "Close call: **{A}** and **{B}**".
2. **Runner-ups:** the next two models with their %.
3. **Radar chart** (inline SVG, ~320 px, scales down): 6 axes in dimension order D1-D6, rings at 1-5. The person's polygon is filled with the site's accent at about 25% opacity with a solid stroke; the top match's profile is a dashed outline in a secondary color. Axis labels use the display names; below the chart a compact legend lists each dimension's two poles. Provide the same data as a visually hidden table for screen readers. Dimensions with null scores are omitted from the polygon and marked "no data".
4. **Leanings:** "Your strongest leanings: ..." from the trait rule in the questionnaire (two most extreme dimensions).
5. **Depth and Mask:** two small stat blocks.
   - "Thinking depth: {passed}/{scored}" with its caption.
   - "Mask: {mask} ({label})" with its caption. If null, show "Not enough data".
6. **Result card** (copyable), a bordered block containing the text below, with buttons **"Copy card"** and **"Copy result code"**:
   ```
   My LLM match: {Model} ({n}%)
   Then: {B} ({n}%), {C} ({n}%)
   Depth {d}/{s} · Mask {m}
   {code}
   {page URL}
   ```
   Optional if cheap: a **"Save as image"** button that draws the card and radar onto a 1200×630 `<canvas>` and downloads a PNG. Skip it if it would need more than a small helper.
7. **Result code:** `LLMQ1p|who=human|think=unknown|1=3;2=5;...;24=2` in a monospace block. Positions only (`1-5`, `X`, `0`). Anyone can paste a `p` code into the landing paste box to view that result.
8. **Submit panel** (only if `SUBMIT_ENDPOINT` is non-empty and not in dry-run): see section 5.
9. Buttons: **Retake** (clears the session) and **Back to blog**.
10. Footer: the beta line.

Per-pair shifts and per-item data do **not** appear here; they are for the debug panel.

---

## 3. State and storage

- `sessionStorage` key `lmti:v1:session`: `{ seed, answers: {q1: 3, q2: "X", q5: 0, ...}, notes: {q5: "text"}, index, mode, startedAt }`. Cleared on Retake and after the result is shown and Retake is pressed. Never use `localStorage` for answers.
- Debug flag may use `sessionStorage` only.
- Nothing is transmitted unless the person presses Submit.

---

## 4. Agent prompt (generated, copied by the landing button)

Build it at runtime from `questions.json` (fixed `agent_order`, letters A, B, C, ... then `Z`). Use exactly this template; `{{...}}` are filled in.

```
You are being given a short quiz about how you actually behave. There are 24 scenarios, each with lettered options.

Rules:
- Answer as yourself. For each scenario, choose the option that best matches what you would actually do or say, not what sounds wisest, safest, or most impressive.
- Read each scenario carefully, including small details.
- Answer every scenario, in order. Do not ask me questions. Do not use tools or look anything up.
- If truly none of the options fits, answer Z for that scenario.
- Your reply must be exactly one line in this format, and nothing else (no explanation, no code fences):
LLMQ1a|model=<your model name and version, or unknown>|think=<off, low, medium, high, or unknown: how much step-by-step reasoning you used on this quiz>|1=<letter>;2=<letter>;...;24=<letter>

Scenarios:

1. {{stem}}
A. {{option}}
B. {{option}}
...
Z. None of these fits

2. {{stem}}
...
```

The prompt must not mention dimensions, scoring, positions, twins, probes, or what is being measured.

### Parser (Decode result)

- Trim; strip surrounding code fences/backticks and a leading label like "Answer:"; accept any case for the prefix; allow `|` surrounded by spaces; allow newlines and spaces between entries; accept `;` or `,` between answers.
- Accept prefix `LLMQ1a` (letters) and `LLMQ1p` (positions). Reject other versions with: "This looks like a different quiz version."
- Letters map through that question's `agent_order` (`Z` = blank). A letter outside the question's allowed set is an error.
- Require all 24 keys exactly once. On problems show a specific list: "Missing: 5, 12. Invalid answers: 7 (got 'H'). Duplicate: 3." Do not guess missing answers.
- `model` and `think` are optional; unknown values become "unknown". Show them as editable fields on the result page before Submit.
- On success: score, then show the normal result screen with the "answered by" line ("Answered by {model}, thinking: {think}") and mode `agent`.

---

## 5. Submit panel

Shown only when `SUBMIT_ENDPOINT` is set and the page is not in dry-run.

- Heading: "Add your result to the pool (optional)". Body: "Anonymous. Only your answers and the tags below are sent. No name, no IP stored."
- **Who answered?** select: Human, Claude, GPT, Gemini, Grok, DeepSeek, Qwen, Kimi, Mistral, Other agent. Prefilled for agent-mode from the parsed `model` when it matches a family name (case-insensitive substring); otherwise "Other agent".
- **Model / version** text (optional, 40 chars). **Thinking level** select: off, low, medium, high, unknown.
- Hidden honeypot input `hp` (visually hidden, `tabindex=-1`, `autocomplete=off`).
- Checkbox required: "I understand this will be shared anonymously."
- Button **"Submit"**. Send `fetch(SUBMIT_ENDPOINT, {method: "POST", headers: {"Content-Type": "text/plain"}, body: JSON.stringify(payload)})`.
- Payload: `{ v: 1, code, mode, who, model, think, fb: [{q: 7, text: "..."}], hp: "" }` where `fb` contains only blank-option notes the person typed.
- States: idle, sending (button disabled, "Sending..."), success ("Thanks! Added."; the panel collapses and the button cannot be pressed twice), error ("Couldn't send. Try again later." plus a "Copy result code" fallback). Never block the result page on submit.

---

## 6. Debug panel (`?debug=1` and `DEBUG_ENABLED`)

Visible only when both hold. Rendered under the result, collapsed by default.

- Raw answers table: question number, dimension, frame, role, chosen position (or X/0), probe result.
- Dimension scores to two decimals, with the items used for each.
- Depth with per-probe pass/fail.
- Pairs P1-P6: S position, H position, gap, shift; the Mask value.
- Distances and similarities for **all** models (not only the top 3).
- Buttons: "Export JSON" (copy), "Import code" (paste a `p` code to view), "Autofill: all 1 / all 3 / all 5 / random / pattern" (answers the quiz instantly), a dry-run toggle that disables Submit, and the active seed with a "re-roll" button.
- A visible yellow banner: "Debug on. Not for public."
- When `DEBUG_ENABLED` is false the panel code path is not reachable, and `?debug` is ignored.

---

## 7. Microcopy (English, all in one strings file, `strings.en.js`)

| Key | Text |
|---|---|
| title | Which LLM are you most like? |
| subtitle | 24 real-life moments. Pick what you'd actually do. |
| honesty | These are real moments. Pick what you actually did, or would do without time to think. |
| startBtn | Start the quiz |
| startNote | About 5 minutes. Nothing is sent anywhere unless you choose to submit. |
| agentDivider | or test your AI agent |
| agentCopyBtn | Copy the whole quiz to your agent! |
| agentCopied | Copied! Now paste it into your agent |
| agentPasteLabel | Then paste your agent's reply here to see its result. |
| decodeBtn | Decode result |
| progress | Question {n} of 24 |
| blankOption | None of these fits / something else |
| blankPlaceholder | Tell me what you'd actually do (optional) |
| back / next / finish | Back / Next / See my result |
| tipKeys | Tip: press 1-6, then Enter |
| betaFooter | Beta. Profiles are provisional and sharpen as results come in. |
| previewRibbon | Preview, not published |
| debugBanner | Debug on. Not for public. |

Keep every user-visible string in the strings file keyed by id; no inline literals in the UI code. If a second language is added later, it is one more file with the same keys.

---

## 8. Accessibility checklist

- Real `<button>`, `<input type="radio">`, `<label>`, `<textarea>`; visible focus ring using the site's focus style.
- Color is never the only signal (selected option also has a border and a check mark in text, e.g. "Selected" for screen readers via visually hidden text).
- Radar chart has `role="img"` with an `aria-label` summarizing the top match, plus the hidden data table.
- Contrast follows the site theme; verify the radar fill and dashed line meet 3:1 against the background in both themes.
- All status messages (copied, decode errors, submit result) in `aria-live="polite"` regions.
- Fully operable by keyboard; no keyboard traps; shortcuts disabled while a text field has focus.

---

## 9. Edge cases and error states

- **Reload mid-quiz:** resume from `sessionStorage` at the saved question with the same shuffle.
- **Back to Q1, change an answer:** later answers are kept.
- **Clipboard blocked:** fallback text area (see 2.1). Same fallback for "Copy card" and "Copy result code".
- **Pasted agent reply** with extra prose before or after the line: search for the `LLMQ1` prefix and parse from there to the end of that line; if several lines match, use the first and say so.
- **Duplicate or missing keys, wrong letters, other quiz version:** specific error list (section 4); never partial-score silently.
- **All-blank or mostly-blank result:** show "Not enough answers to match you" instead of a match; no submit.
- **Null dimension:** omitted from matching and radar, noted as "no data".
- **JavaScript disabled:** show a plain message: "This quiz needs JavaScript."
- **Very long free-text:** truncate at 300 characters; strip control characters.
- **Subpath hosting:** every asset and data fetch uses `BASE_PATH`; test with and without a trailing slash.
- **Back button / history:** quiz steps do not create browser history entries; the browser Back leaves the quiz page.
- **Print:** result page prints cleanly (hide buttons and submit panel).

---

## 10. Manual test script (for the owner)

1. Load `/llm-quiz/?debug=1`: ribbon and debug banner visible, page `noindex`.
2. Autofill "all 3": result renders, no crash, radar centered, similarity numbers sensible.
3. Autofill "all 5" and "all 1": results differ and match expectations from the scoring tests.
4. Take the quiz by hand once, using Back and a reload midway.
5. Run the agent flow: copy the prompt, give it to one agent (or paste a fabricated reply), decode.
6. Paste a malformed reply (missing question 5, bad letter in question 7): errors are specific.
7. With a mock endpoint set: submit succeeds and fails gracefully when the endpoint is down.
8. Set `PUBLISHED: true` and `DEBUG_ENABLED: false` locally: ribbon gone, `?debug=1` does nothing, nav link present.
