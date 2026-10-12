# Round 2 Claim Audit

Reviewed by: Claim Checker mode  
Base commit: `4001a4d`  
Sources checked: `11-issue-11-speech.out.txt`, `12-issue-8-notes.out.txt`, `13-boot-test-fix.out.txt`, `14-a11y.out.txt`, `15-a11y-followup.out.txt`  
`npm test` result (self-run): **103 passed, 0 failed**

---

## Part 1 — Claim-by-claim verdict

### Run 11 — `11-issue-11-speech.out.txt`

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | `src/speech.js` is a new file exposed as `window.TomodoroSpeech` with CommonJS tail | CONFIRMED | `src/speech.js:67-72` — `window.TomodoroSpeech = { … }` and `module.exports = { … }` |
| 2 | `shouldSpeak` starts at line 13 | WRONG | `src/speech.js:12` — `function shouldSpeak(secondsLeft, totalSecs, intervalMins) {` (function declaration is line 12, not 13) |
| 3 | `shouldSpeak` returns `true` only when `intervalMins > 0`, `0 < secondsLeft < totalSecs`, and `secondsLeft` is an exact multiple of `intervalMins * 60` | CONFIRMED | `src/speech.js:13-16` — `if (intervalMins <= 0) return false; if (secondsLeft <= 0 || secondsLeft >= totalSecs) return false; … return secondsLeft % intervalSecs === 0;` |
| 4 | `reminderText` starts at line 23 | WRONG | `src/speech.js:25` — `function reminderText(secondsLeft, round) {` |
| 5 | `reminderText` builds e.g. `"10 minutes left in your focus round"`, singular `"minute"` for exactly 1 | CONFIRMED | `src/speech.js:27,36` — `var unit = mins === 1 ? "minute" : "minutes";` … `return mins + " " + unit + " left in your " + label;` |
| 6 | `transitionText` starts at line 38 | WRONG | `src/speech.js:43` — `function transitionText(nextRound) {` |
| 7 | `transitionText` returns one of three fixed transition phrases | CONFIRMED | `src/speech.js:44-50` — three branches matching the spec exactly |
| 8 | `speak` starts at line 51 | WRONG | `src/speech.js:58` — `function speak(text, synth) {` |
| 9 | `speak` is a no-op returning `false` if `synth` is falsy; otherwise cancels queued speech, creates utterance, calls `synth.speak()` | CONFIRMED | `src/speech.js:59-63` — `if (!synth) return false; synth.cancel(); var utterance = new SpeechSynthesisUtterance(text); synth.speak(utterance); return true;` |
| 10 | `test/speech.test.js` has 27 tests | CONFIRMED | 27 `test(` blocks present in `test/speech.test.js:11-154` |
| 11 | Settings UI `<section class="section">` **Spoken Reminders** inserted after Autostart | CONFIRMED | `index.html:216-245` — `<section class="section"><h2>Spoken Reminders</h2>` follows the Autostart section ending at line 215 |
| 12 | `#speech-interval` select: Off (default) / Every minute / Every 5 minutes / Every 10 minutes / Every 30 minutes | CONFIRMED | `index.html:223-229` — five `<option>` values `0,1,5,10,30` with `selected` on `value="0"` |
| 13 | `#speech-transitions` select: Enabled (default) / Disabled | CONFIRMED | `index.html:235-238` — `<option value="true" selected>Enabled</option><option value="false">Disabled</option>` |
| 14 | `#speech-test` button: "Test voice" | CONFIRMED | `index.html:243` — `<button id="speech-test" title="Test voice">Test voice</button>` |
| 15 | `#speech-unavailable` div hidden by default | CONFIRMED | `index.html:218` — `<div id="speech-unavailable" class="setting" style="display:none;">` |
| 16 | `<script src="./src/speech.js">` added before `index.js` | CONFIRMED | `index.html:644-645` — `<script src="./src/speech.js"></script>` immediately before `<script src="./index.js"></script>` |
| 17 | `setTime()` at line 74 calls `TomodoroSpeech.shouldSpeak` + `speak` + `reminderText` on each tick | WRONG | `index.js:80` — `function setTime() {`; speech call is at lines 86-88. Line 74 is blank. |
| 18 | `nextRound()` at line 177 calls `speak(transitionText(…))` when `speechTransitions` is enabled | WRONG | `index.js:141` — `function nextRound() {`; the `speechTransitions` check is at line 188. |
| 19 | Speech settings block reads `pomo-speech-interval` / `pomo-speech-transitions` from localStorage | CONFIRMED | `index.js:373-381` — `localStorage.getItem("pomo-speech-interval")` and `localStorage.getItem("pomo-speech-transitions")` |
| 20 | Change listeners persist to localStorage | CONFIRMED | `index.js:383-391` — both `addEventListener("change", …)` handlers call `localStorage.setItem` |
| 21 | Controls disabled + message shown when `speechSynthesis` is `undefined` | CONFIRMED | `index.js:366-371` — `if (typeof speechSynthesis === "undefined") { speechIntervalSelect.disabled = true; … speechUnavailable.style.display = ""; }` |
| 22 | `cacheName` → `"clock-v3"`, `./src/speech.js` added to cache array | WRONG | `sw.js:1` — `const cacheName = "clock-v4";` (bumped again by run 12; `./src/speech.js` is indeed present at line 11) |
| 23 | README bullet added naming issue #11 | CONFIRMED | `README.md:50` — `**Spoken reminders (upstream issue #11)**` |
| 24 | `npm test` result: ✔ 65 passed, 0 failed | WRONG | Self-run shows **103 passed** (subsequent runs added more tests; 65 was only accurate at the moment run 11 completed) |

---

### Run 12 — `12-issue-8-notes.out.txt`

The summary file is a single incomplete line (truncated artifact):
> *"Now add CSS styles for `#round-note-area`, `#round-note`, and `.round-entry-note`:"*

No final summary claims to verify. The implementation itself was checked under the requirements section below.

---

### Run 13 — `13-boot-test-fix.out.txt`

This file is an excerpt of mid-run reasoning, not a finished summary. Factual claims embedded in it:

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 25 | `focusEnd()` is only called from `nextRound()` at line 140 | WRONG | `index.js:141` — `function nextRound() {`; `focusEnd(roundInfo.t)` called at line 148 |
| 26 | `tasks` declared at line 566 | WRONG | `index.js:585` — `let tasks = ["Default Task"];` |
| 27 | `selectedTask` declared at line 568 | WRONG | `index.js:587` — `let selectedTask = "Default Task";` |
| 28 | `roundNoteInput` at line 671 | WRONG | `index.js:690` — `let roundNoteInput = document.getElementById("round-note");` |
| 29 | `saveRecord` declared at ~line 634 | WRONG | `index.js:653` — `function saveRecord(r) {` |
| 30 | At startup `seconds = 1500`, so `nextRound()` is NOT called during `setup()` → `setTime()` | CONFIRMED | `index.js:55-60,80-84` — `config.focus = 1500`, `roundInfo.t = 0`, so `seconds = 1500 - 0 = 1500`, not `< 0` |

---

### Run 14 — `14-a11y.out.txt`

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 31 | All 101 tests pass (94 existing + 7 new a11y tests) | WRONG | Self-run shows **103 passed** (run 15 added 2 more; 101 was only accurate immediately after run 14) |
| 32 | `test/a11y.test.js` has 7 static assertions | WRONG | `test/a11y.test.js:11-103` — the file has **9** `test(` blocks (7 from run 14, +2 added by run 15) |
| 33 | Test 1: `for="task-select"` attribute exists | CONFIRMED | `test/a11y.test.js:11-16` — `/for="task-select"/.test(html)` |
| 34 | Test 2: Exactly one `<h1>` element | CONFIRMED | `test/a11y.test.js:19-22` — `html.match(/<h1[\s>]/gi) … strictEqual(matches.length, 1 …)` |
| 35 | Test 3: `<header>` wraps `#taskswitcher` | CONFIRMED | `test/a11y.test.js:25-37` — checks `headerStart < taskSwitcherPos < headerEnd` |
| 36 | Test 4: `#menu` has `aria-label` | CONFIRMED | `test/a11y.test.js:40-48` |
| 37 | Test 5: `#statistics` has `aria-label` | CONFIRMED | `test/a11y.test.js:51-58` |
| 38 | Test 6: `#managetasks` has `aria-label` | CONFIRMED | `test/a11y.test.js:61-68` |
| 39 | Test 7: `aria-live="polite"` region exists | CONFIRMED | `test/a11y.test.js:71-76` |
| 40 | `<label for="task-select" …>` added before `<select>` at line 19 | WRONG | `index.html:24` — label is at line 24 |
| 41 | `<h1 class="visually-hidden">Tomodoro</h1>` added at the top of `<body>` at line 15 | WRONG | After run 15 the `<h1>` is at `index.html:16` *inside* `<header>` (run 15 moved it; run 14's placement before `<header>` was itself wrong) |
| 42 | `#menu`, `#statistics`, `#managetasks` get `role="region" aria-label="…"` | CONFIRMED | Verified indirectly: all three a11y tests pass against the current HTML |
| 43 | `.visually-hidden` utility class at `index.css:12-21` | CONFIRMED | `index.css:12-23` — `.visually-hidden { position: absolute; width: 1px; … }` |
| 44 | `:focus-visible` outline at `index.css:24-28` | WRONG | `index.css:26-31` — rule starts at line 26, ends at 31 (not 24-28) |
| 45 | `a11yAnnounce` reference and `announce(msg)` helper at `index.js:13-20` | CONFIRMED | `index.js:13` — `let a11yAnnounce = …`; `index.js:15-20` — `function announce(msg) {` |
| 46 | `announce()` call in `nextRound()` at line 192 | WRONG | `index.js:191` — `announce(fullname[roundInfo.current] + " started");` (line 191, not 192) |
| 47 | Escape key closes open panel at `index.js:238-247` | WRONG | `index.js:240-248` — Escape block is lines 240-248 |
| 48 | `<div id="a11y-announce" …>` after `</header>` at line 53 | WRONG | `index.html:47` — element is at line 47 (not 53), immediately after `</header>` at line 46; placement is correct but line number is wrong |

---

### Run 15 — `15-a11y-followup.out.txt`

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 49 | All 103 tests green | CONFIRMED | Self-run: **103 passed, 0 failed** |
| 50 | Two new failing tests added to `test/a11y.test.js` at lines 76-103 | CONFIRMED | `test/a11y.test.js:79-103` — tests `<h1> is inside <header>` and `#statistics has no h3 before its first h2` |
| 51 | Test 5 asserts `<h1>` position is between `<header>` bounds | CONFIRMED | `test/a11y.test.js:79-89` — exactly this logic |
| 52 | Test 6 slices HTML from `id="statistics"` and checks first `<h3>` does not precede first `<h2>` | CONFIRMED | `test/a11y.test.js:92-103` |
| 53 | `<h1>` moved to be the first child inside `<header>` at `index.html:15-16` | CONFIRMED (substance) | `index.html:15-16` — `<header>` opens at 15, `<h1 class="visually-hidden">Tomodoro</h1>` is at 16 |
| 54 | `<h3>Show Statistics of:</h3>` changed to `<h2 class="stat-filter-heading">…</h2>` at `index.html:331` | CONFIRMED | `index.html:331` — `<h2 class="stat-filter-heading">Show Statistics of:</h2>` |
| 55 | `.stat-filter-heading` override added after `index.css:399` | CONFIRMED | `index.css:401-407` — `.stat-filter-heading { font-size: 24px; font-weight: normal; border-bottom: none; padding-bottom: 0; margin: 0; }` |

---

## Part 2 — Requirements not met

### From `11-issue-11-speech.prompt.txt`

**REQ-S1 (CRITICAL BUG): Existing user who never opted in WILL hear speech.**

The prompt states: *"in `nextRound()` speak `transitionText` when transitions are enabled **and interval is not Off**"* — the intent is that the user must explicitly opt in before any speech fires.

`speechTransitions` is initialised to `true` at [`index.js:76`](index.js:76) and the HTML `<option value="true" selected>Enabled</option>` at [`index.html:236`](index.html:236) means a brand-new user who has never visited the settings page will have `speechTransitions = true` with no localStorage key set. On every round transition `nextRound()` unconditionally speaks:
```js
// index.js:188-190
if (speechTransitions) {
    TomodoroSpeech.speak(TomodoroSpeech.transitionText(roundInfo.current), …);
}
```
There is no check that `speechInterval !== 0` (the "Off" guard). An existing user who never opted in hears speech from the moment round 1 ends.

**REQ-S2 (BUG): Transition speech fires on manual Next-button skip.**

The prompt says: *"Never speak while the timer is paused (`setTime` only runs on ticks, keep it that way)."* That is satisfied for interval reminders. However `nextRound()` is also wired to the Next button at [`index.js:226-228`](index.js:226):
```js
nextbtn.addEventListener("click", () => {
    nextRound();   // triggers speech regardless of paused state
});
```
Clicking Next while the timer is paused (or even while it is running) still calls `speak(transitionText(…))`. The prompt's intent was that speech fires only when a round elapses naturally.

### From `12-issue-8-notes.prompt.txt`

**REQ-N1 (BUG): Double-save on Enter + blur.**

The prompt specifies: *"Enter or blur saves"*. The implementation at [`index.js:1014-1021`](index.js:1014) attaches both:
```js
input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { saveEdit(); }  // (1) calls updateRecordNote, then replaces input with noteDisplay
    …
});
input.addEventListener("blur", saveEdit);   // (2) fires when input is removed from DOM by replaceWith()
```
`input.replaceWith(noteDisplay)` inside `saveEdit()` removes the input from the DOM, which fires `blur`, which calls `saveEdit()` a second time — writing to IndexedDB twice and calling `updateRecordNote(entry.d, …)` twice for a single Enter keypress.

---

## Part 3 — Findings table

| # | Finding | Severity | File:line | Suggested minimal fix |
|---|---------|----------|-----------|----------------------|
| F1 | `speechTransitions` defaults to `true`; a new user hears round-end speech without ever opting in | **bug** | `index.js:76`, `index.html:236` | Initialise `speechTransitions = false`; change HTML default to `<option value="false" selected>Disabled</option>`; flip to `true` only when user changes the setting |
| F2 | Next-button click calls `nextRound()` which speaks the transition phrase even when the timer is paused or the user just skips | **bug** | `index.js:226-228`, `index.js:188-190` | Guard the speech call with `&& roundInfo.running` so it only fires on a naturally elapsed round |
| F3 | Pressing Enter in the edit-note input fires `saveEdit()` twice (keydown handler + DOM-removal blur), causing two `updateRecordNote()` IndexedDB writes | **bug** | `index.js:1014-1021` | In the keydown `Enter` branch, remove the blur listener before calling `saveEdit()` (e.g. `input.removeEventListener("blur", saveEdit); saveEdit();`) |
| F4 | Several line-number citations in run-11 summary are off by 1–7 lines (`shouldSpeak` at 12 not 13; `reminderText` at 25 not 23; `transitionText` at 43 not 38; `speak` at 58 not 51; `setTime` wiring said "line 74" not 80/86; `nextRound` said "line 177" not 141/188) | **nit** | `src/speech.js:12,25,43,58`, `index.js:80,86,141,188` | Documentation only — no code change needed |
| F5 | Run-11 summary says `cacheName → "clock-v3"` but actual final value is `"clock-v4"` | **nit** | `sw.js:1` | Documentation only |
| F6 | Run-14 summary says "101 tests" and "7 a11y tests"; current state is 9 a11y tests and 103 total | **nit** | `test/a11y.test.js:1-103` | Documentation only |
| F7 | Run-13 reasoning cites `tasks` at 566, `selectedTask` at 568, `roundNoteInput` at 671, `saveRecord` at ~634; actual lines are 585, 587, 690, 653 | **nit** | `index.js:585,587,690,653` | Documentation only |
