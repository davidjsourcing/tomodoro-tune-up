# TEST-REPORT — Tomodoro Tune-Up

## Round 3 (Oct 18, 2026): the same checks, now run by CI on every push

| Where | Run | Result |
|---|---|---|
| GitHub Actions `CI`, commit fd02d74 | https://github.com/davidjsourcing/tomodoro-tune-up/actions/runs/39082539678 | `npm test` **160/160**; browser flows **35/35**; axe-core **0** violations |
| GitHub Actions `Bob Claim Checker`, commit fd02d74 | https://github.com/davidjsourcing/tomodoro-tune-up/actions/runs/39082541542 | 22 CONFIRMED · 0 WRONG · 1 UNVERIFIABLE (0.23 Bobcoins) |
| GitLab CI (mirror), commit fd02d74 | pipeline 2959355607 | `npm test` passed |
| GitHub Pages deploy + 35 flows against https://davidjsourcing.github.io/tomodoro-tune-up/index.html | run 39082539700 + local Playwright | deployed; **35/35** |
| Gate check: `index.html` with `lang` removed | local | `axe4.js` exit 1 (`html-has-lang`), so CI can go red |

New test files: `test/kit.test.js` (5), `test/verdict.test.js` (11). The round-2 report below is unchanged.

---

# Round 2 (Oct 12, 2026)

Everything below was run on the final round-2 code (the commit that adds this file) on Linux, Node 24, Chromium headless.

## 1. Unit + boot tests — `npm test` (zero dependencies)

**144 passed, 0 failed.**

| File | Tests | Covers |
|---|---|---|
| test/speech.test.js | 35 | spoken reminders (#11): interval maths, wording, round-end rule, missing speech API |
| test/notes.test.js | 29 | notes (#8): sanitising, immutability, save-once editor |
| test/backup.test.js | 19 | backup validation incl. notes |
| test/keys.test.js | 19 | which elements count as text fields for shortcuts |
| test/a11y.test.js | 9 | static accessibility checks on index.html |
| test/hook.test.js | 9 | the Tune-Up Kit hook's summary parser |
| test/colors.test.js | 8 | per-task colours (#6, round 1) |
| test/tasks.test.js | 8 | task picker after reload (upstream bug) |
| test/records.test.js | 6 | multi-task statistics race (round 1) |
| test/boot.test.js | 2 | the whole app boots (first visit + returning user) |

## 2. Browser click-through — real Chromium, desktop 1440x900 + phone 390x844

**35 / 35 passed.** Script: `docs/e2e/e2e.js` (Playwright). Speech is checked by recording what the app hands to
`speechSynthesis.speak` (headless Chromium has no audio voice).

| # | Flow | Result | Detail |
|---|---|---|---|
| 1 | First visit shows the intro | PASS |  |
| 2 | Closing the intro shows the timer | PASS |  |
| 3 | Create two tasks in the Tasks panel | PASS | ["Default Task","Calculus","Chemistry"] |
| 4 | Escape closes the Tasks panel | PASS |  |
| 5 | After a reload the task picker shows the task time is logged to (upstream bug, run 19) | PASS | {"v":"Chemistry","s":"Chemistry"} |
| 6 | Start button runs the timer | PASS | t=2 |
| 7 | Pause button stops the timer | PASS |  |
| 8 | Space toggles the timer on the main screen | PASS |  |
| 9 | Typing spaces in the round note does not start the timer (#8 + run 18 fix) | PASS | Chem ch. 4, problem set 2 |
| 10 | Round note is saved with the focus record (issue #8) | PASS | {"t":25,"d":1791774245957,"n":"Chemistry","m":"Chem ch. 4, problem set 2"} |
| 11 | Round note input clears after the round is saved | PASS |  |
| 12 | Records list shows the note under its round | PASS | ["","Chem ch. 4, problem set 2"] |
| 13 | Edit note + Enter saves the new note | PASS | Chem ch. 4, problem set 2 (done) |
| 14 | Edit note writes to the database exactly once (review F3) | PASS | puts=1 |
| 15 | Escape in the note editor cancels without saving | PASS |  |
| 16 | Escape in the note editor keeps the Statistics panel open (run 18 fix) | PASS |  |
| 17 | Escape (outside a field) closes the Statistics panel | PASS |  |
| 18 | Create Backup exports notes with the records | PASS | 2 records |
| 19 | Speech settings persist to localStorage | PASS |  |
| 20 | Test voice button speaks | PASS | ["Tomodoro spoken reminders are working."] |
| 21 | Spoken reminder at 5 minutes left (issue #11) | PASS | ["5 minutes left in your focus round"] |
| 22 | No reminder between interval marks | PASS |  |
| 23 | Round-end announcement when reminders are on and the timer was running | PASS | ["Focus round done. Time for a short break."] |
| 24 | No announcement on a manual skip while paused (review F2) | PASS | [] |
| 25 | No announcement when spoken reminders are Off (review F1) | PASS |  |
| 26 | Escape closes the Settings panel | PASS |  |
| 27 | No JavaScript errors during the desktop run | PASS |  |
| 28 | Restore Backup brings notes back | PASS | 4 records |
| 29 | Restore keeps the first of duplicate keys and drops a non-string note | PASS | [{"t":30,"d":1700000000000,"n":"History","m":"Essay outline"},{"t":15,"d":1700000500000,"n":"History"}] |
| 30 | Restore recreates the tasks | PASS | ["Default Task","Chemistry","History"] |
| 31 | No JavaScript errors during restore | PASS |  |
| 32 | Phone 390px: no sideways scroll on the main screen | PASS |  |
| 33 | Phone 390px: round note fits on screen under the task picker | PASS | {"l":60,"r":330,"top":60,"tb":54} |
| 34 | Phone 390px: statistics + records fit the screen | PASS |  |
| 35 | No JavaScript errors on phone | PASS |  |

## 3. Accessibility — axe-core 4, default rules, four app states (main, settings, statistics, tasks)

| Version | Rules failing | Nodes |
|---|---|---|
| Upstream baseline 17a5091 | 3 (label-title-only, page-has-heading-one, region) | 18 |
| Round 1 (4001a4d) | 3 | 18 |
| After Bob run 14 | 2 (region, heading-order) | 2 |
| After Bob run 15 (final) | **0** | **0** |

Script: `docs/e2e/axe4.js`.

## 4. Bugs found by testing (all fixed, each with a test)
1. App failed to load after spoken reminders (ReferenceError, TDZ) — browser check → Bob run 13 + boot test.
2. Typing a space in the round note started the timer; Escape in the note editor closed the panel — demo recording → run 18.
3. Upstream: after a reload the task picker showed the first task while time was logged to the saved task — e2e → run 19.
4. Claim Checker (run 16): speech for users who never opted in, speech on a manual skip, note saved twice → run 17.

## 5. Not covered
- Real audio output of the Web Speech API (no voice in headless Chromium); the spoken text is verified instead.
- Picture-in-Picture mode and desktop notifications (unchanged upstream features, need a headed browser).
