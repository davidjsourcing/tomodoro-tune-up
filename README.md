# Tomodoro
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z6E84CZ)&nbsp;
<a href="https://www.producthunt.com/posts/tomodoro?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-tomodoro" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=355079&theme=light" alt="Tomodoro - Simple&#0032;Pomodoro&#0032;timer&#0032;for&#0032;the&#0032;web | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

A pomodoro web app with PIP mode, white noise generation, tasks and more!

---

## About this fork (IBM Bob hackathon)

This is a fork of [lazy-guy/tomodoro](https://github.com/lazy-guy/tomodoro), submitted to the
**AngelHack "Building with IBM Bob" hackathon, Track 1: Explore, Fix, and Build**.
Upstream baseline commit: **17a5091**. Everything after it was made during the hackathon window (Oct 11-12 and Oct 18, 2026).

> **Prove every claim, or it doesn't ship.** AI writes real code now, and it sounds just as sure when it's wrong.
> So I gave IBM Bob a real open-source app that students use and one rule: nothing counts unless it's proven.

[![CI](https://github.com/davidjsourcing/tomodoro-tune-up/actions/workflows/ci.yml/badge.svg)](https://github.com/davidjsourcing/tomodoro-tune-up/actions/workflows/ci.yml) [![Bob Claim Checker](https://github.com/davidjsourcing/tomodoro-tune-up/actions/workflows/bob-claim-check.yml/badge.svg)](https://github.com/davidjsourcing/tomodoro-tune-up/actions/workflows/bob-claim-check.yml) [![Pages](https://github.com/davidjsourcing/tomodoro-tune-up/actions/workflows/pages.yml/badge.svg)](https://davidjsourcing.github.io/tomodoro-tune-up/)

**Live:** https://tomodoro-bob.sites.tab.bot/tuneup.html (the Tune-Up report) · https://tomodoro-bob.sites.tab.bot/ (the app) · also on GitHub Pages: https://davidjsourcing.github.io/tomodoro-tune-up/
**Demo video (2:29):** [`media/tomodoro-tuneup-demo-v3.mp4`](media/tomodoro-tuneup-demo-v3.mp4) · **Pitch deck:** [`submission/pitch-deck.pdf`](submission/pitch-deck.pdf) · **Code:** GitHub `davidjsourcing/tomodoro-tune-up` (mirror on GitLab `davidj-builds/tomodoro-tune-up`)

### Round 3 (Oct 18): the receipts run themselves

You should not have to trust our test report, so now nothing depends on it:

- **CI on every push** ([`ci.yml`](.github/workflows/ci.yml)): `npm test` (**160** tests), then the **35** browser flows and
  axe-core in Chromium on GitHub's machines; screenshots and the axe report are uploaded as the `receipts` artifact.
  Bob (run 20) found the harness could never fail (it always exited 0) and fixed that first.
- **Bob's Claim Checker in CI** ([`bob-claim-check.yml`](.github/workflows/bob-claim-check.yml)): on every pull request
  (and on demand) Bob Shell installs headless and runs the `claim-checker` mode on the newest commit's message and diff,
  capped at 1.5 Bobcoins, and writes CONFIRMED / WRONG / UNVERIFIABLE lines to the job summary. Its first run audited
  commit `fd02d74`: **22 confirmed, 0 wrong, 1 unverifiable** ([`docs/reviews/round3-ci-claim-check.md`](docs/reviews/round3-ci-claim-check.md)).
  Pull requests from forks get no secrets, so there the job skips with a note.
- **Kit self-test** ([`test/kit.test.js`](test/kit.test.js)): the two hooks are driven exactly the way Bob calls them
  (a JSON event on stdin), so anyone who copies `.bob/` into their repo can check it works.
- **Deploy files**: [`pages.yml`](.github/workflows/pages.yml) publishes the app to GitHub Pages;
  [`.gitlab-ci.yml`](.gitlab-ci.yml) runs the tests on the GitLab mirror.
- Bob was wrong once more, and running its code on real data caught it: the CI report it wrote split Bob's own answer
  into fragments and showed Bobcoins as dollars. Fixed test-first in run 22.

Bob runs 20-22 + one CI run, ≈4.3 Bobcoins, all in [`BOB-LOG.md`](BOB-LOG.md).

### Round 2 (Oct 12): IBM Bob, with receipts

| | Before (upstream 17a5091) | After |
|---|---|---|
| Open upstream feature requests shipped | 0 | **3**: #6 (round 1), #11 spoken reminders, #8 notes on focus rounds. #13 checked: already solved upstream. |
| Bugs fixed | | 2 in round 1, plus 1 upstream bug found by our browser test (task picker vs logged task after reload) |
| Automated tests | 0 | **144** (`npm test`, zero dependencies), including a boot test that loads every app script |
| axe-core violations (main, settings, statistics, tasks) | **18** nodes / 3 rules | **0** |
| Browser click-through (desktop + 390px phone) | | **35 / 35** flows pass ([TEST-REPORT.md](TEST-REPORT.md)) |
| Bob customizations committed | none | **Tune-Up Kit** in `.bob/`: 3 custom modes, 1 skill, house rules, 2 hooks ([docs/TUNEUP-KIT.md](docs/TUNEUP-KIT.md)) |

How round 2 worked: Bob built its own toolkit first (run 8), then every change went through it.
**Plan mode** wrote [`docs/plans/round2.md`](docs/plans/round2.md); **Test-First Fixer** shipped each issue with a
failing test first while the **PostToolUse hook** ran the whole suite after every file Bob wrote; **Claim Checker**
audited Bob's own summaries ([`docs/reviews/round2-check.md`](docs/reviews/round2-check.md)) and found 3 real bugs,
which Bob then fixed. Every prompt, output, cost and hand correction is in [`BOB-LOG.md`](BOB-LOG.md).

Where Bob was wrong this round, and what caught it: the hook's first version always reported 0 tests (caught when we
ran it, fixed test-first); spoken reminders passed all unit tests but broke the app on load (caught by a browser check,
now covered by `test/boot.test.js`); round-end speech for people who never opted in, speech on a manual skip, a note
saved twice (caught by Claim Checker); typing a space in the new note field started the timer (caught while recording
the demo, fixed in run 18).

### What was added or fixed

- **`docs/ARCHITECTURE.md`** — deep-dive reference covering the file map, runtime state, timer
  loop, round-advancement logic, localStorage/IndexedDB data model, PiP mode (both Document PiP
  and Canvas PiP), white noise implementation, and a catalogue of nine fragile / bug-prone areas
  found during exploration (§6).

- **`src/records.js` + `test/records.test.js`** — extracted `collectTaskRecords()` from
  `index.js` to fix the IDB multi-task race condition (§6.1 in `ARCHITECTURE.md`): the original
  code resolved the Promise as soon as the *last-indexed* task's request fired, which could drop
  records from earlier tasks if they completed later. The replacement counts completions and
  flattens results in the original task order. Six tests cover the race, empty/null inputs, and
  error propagation.

- **`src/backup.js` + `test/backup.test.js`** — new `normalizeBackup()` utility that validates
  and de-duplicates a parsed backup JSON array before it is inserted into IndexedDB, addressing
  §6.7 (silent `ConstraintError` on duplicate keys). Rejects non-arrays with a `TypeError`,
  silently skips malformed records, deduplicates by `d` (first-occurrence wins), and returns a
  `{ records, tasks, skipped }` summary. Fifteen tests cover all validation branches,
  deduplication, task-list ordering, and edge cases.

- **Per-task colours in Statistics (upstream issue #6)** — every task now has its own colour in
  the pie chart, with matching swatches on the pie cards and the per-task bars, so a student with
  seven subjects can see at a glance where the time went. Colours come from
  **`src/colors.js` + `test/colors.test.js`**: `taskPalette()` / `taskColor()` assign deterministic,
  perceptually distinct HSL colours (golden-angle hue step, alternating lightness) keyed by the
  user's stable task order, so a task keeps its colour across views. Eight tests cover determinism,
  uniqueness across 12 tasks, format, and empty/null inputs.

- **Backup restore now reports what happened** — the restore handler uses `normalizeBackup()`,
  writes with idempotent `put()` (restoring the same file twice no longer aborts silently), and
  shows how many records were restored / skipped, or a clear error.

- **Spoken reminders (upstream issue #11)** — new `src/speech.js` module (`TomodoroSpeech`) with
  pure helpers `shouldSpeak()`, `reminderText()`, `transitionText()`, and `speak()`. A new
  "Spoken Reminders" settings section lets users pick a reminder interval (Off / 1 / 5 / 10 / 30 min)
  and toggle round-transition announcements. The timer calls the speech API on every tick that
  crosses an interval boundary, and speaks a transition phrase when a round ends. Controls are
  automatically disabled when `speechSynthesis` is unavailable. Covered by `test/speech.test.js`
  (27 tests across all branches).

- **Notes on focus rounds (upstream issue #8)** — a "Note for this round" field under the task picker; the note is
  saved with the record when the round ends, shown under the round in Focus Round Records, editable there (Enter or
  blur saves exactly once, Escape cancels), and kept in backups. `src/notes.js` (`sanitizeNote`, `noteFromRecord`,
  `withNote`, `createEditSession`), `normalizeBackup` keeps a valid note. Tests: `test/notes.test.js`, `test/backup.test.js`.

- **Spoken reminders only for people who opt in** — round-end announcements fire only when spoken reminders are on and
  the round ended while the timer was running (`shouldAnnounceTransition`), from the Claim Checker review (run 17).

- **Accessibility** — visually hidden label for the task picker, an `<h1>`, a `<header>` landmark and labelled panel
  regions, an `aria-live` region that announces each round, Escape closes any panel, visible focus outlines.
  axe-core: 18 violations to 0. Tests: `test/a11y.test.js`.

- **Keyboard shortcuts ignore text fields** — Space and Escape typed into an input no longer start the timer or close
  a panel (`src/keys.js` `isTypingTarget`, `test/keys.test.js`).

- **Task picker matches the logged task after a reload (upstream bug)** — the picker used to show the first task while
  time went to the saved one (`src/tasks.js` `resolveSelectedTask`, `test/tasks.test.js`).

- **Boot test** — `test/boot.test.js` loads `index.html`'s scripts in `node:vm` with a stub DOM, so a page that throws
  on load fails `npm test`.

- **Review fixes** (from Bob's own code review of the diff) — versioned service-worker cache with
  an `activate` cleanup so existing offline users receive the new files; a settle-once guard in
  `collectTaskRecords()`; a stray `<round-entry-duration>` custom element replaced by a `<div>`.

### Run locally

The app is a fully static site — no build step needed.

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static file server works (e.g. `npx serve`, `caddy file-server`).

> **Note:** The service worker (`sw.js`) registers and caches assets on first load, enabling
> offline use. Picture-in-Picture and desktop notifications both require a **secure context**
> (HTTPS) or `localhost` — both work fine with the command above.

### Run the tests

Requires **Node.js 20+**. No npm dependencies; the test suite uses the built-in
`node:test` runner.

```bash
npm test
```

Browser flows + accessibility (what CI runs):

```bash
cd docs/e2e && npm init -y && npm i --no-save playwright-core axe-core && npx playwright-core install chromium
python3 -m http.server 8080 --directory ../.. &
node e2e.js http://127.0.0.1:8080/index.html /tmp/e2e     # 35 flows, exits 1 on any failure
node axe4.js http://127.0.0.1:8080/index.html /tmp/axe.json # exits 1 on any violation
```

| Test file | What it covers |
|-----------|----------------|
| [`test/records.test.js`](test/records.test.js) | `collectTaskRecords()` — IDB race-condition fix, empty/null inputs, error rejection |
| [`test/backup.test.js`](test/backup.test.js) | `normalizeBackup()` — field validation, duplicate-key deduplication, task-list ordering, non-array TypeError |
| [`test/colors.test.js`](test/colors.test.js) | `taskPalette()` / `taskColor()` — determinism, order-dependence, 12-task colour uniqueness, hsl() format |
| [`test/speech.test.js`](test/speech.test.js) | spoken reminders: interval maths, wording, round-end rule, speech API missing |
| [`test/notes.test.js`](test/notes.test.js) | notes: sanitising, immutability, save-once editor session |
| [`test/keys.test.js`](test/keys.test.js) | which elements are text fields for the keyboard shortcuts |
| [`test/tasks.test.js`](test/tasks.test.js) | which task the picker shows after a reload |
| [`test/a11y.test.js`](test/a11y.test.js) | static accessibility checks on `index.html` |
| [`test/boot.test.js`](test/boot.test.js) | the whole app boots without an error (first visit and returning user) |
| [`test/hook.test.js`](test/hook.test.js) | the Tune-Up Kit hook's test-summary parser |
| [`test/kit.test.js`](test/kit.test.js) | both kit hooks driven the way Bob calls them (round 3) |
| [`test/verdict.test.js`](test/verdict.test.js) | the CI Claim Checker report parser (round 3) |

### How IBM Bob was used

See **[`BOB-LOG.md`](BOB-LOG.md)** for a session-by-session log of every prompt and tool call,
and **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** for the architectural analysis that Bob
produced during the exploration phase.

---

*This hackathon work was driven by David J using IBM Bob Shell (headless `bob run`, custom modes, a skill and hooks), with help from an AI assistant that wrote prompts, checked Bob's claims against the code, ran the browser tests and kept the log honest. The demo video's narration is text-to-speech.*

---

![Screenshot](https://lazy-guy.github.io/tomodoro/screenshot.png)

## Features:

-   Clean UI
-   PIP Mode
-   Tasks and Statistics
-   White Noise
-   Themes
-   Works Offline

## Tasks and Statistics

![Statistics](https://lazy-guy.github.io/tomodoro/statistics.png)

Tomodoro allows the creation of "Tasks". Time spent in a focus session can be dedicated to a task in order to generate statistics.
All the data is saved in your browser. Taking frequent backups is recommended. Backup and restore options are available in Tomodoro's settings.

## About Always On Top/PIP Mode

![PIP Demo](https://lazy-guy.github.io/tomodoro/pip.png)

**Not tested on Safari but might work**

PIP mode works by drawing on a canvas, capturing its stream and using it as source of a video element. Then it requests Picture-In-Picture.

On desktop Firefox, PIP button will only make the video visible but will not activate PIP. To switch to PIP mode, right click on the video and select "Watch in Picture-In-Picture".

On Android browsers, like Chrome for Android which does not support the Picture-In-Picture API, in order to switch to PIP mode, make the video fullscreen and then go to your device's homescreen without exiting fullscreen. If your browser is supported then PIP mode will be activated.

## To-Do

-   Make code cleaner
-   Add custom theming


## Credits
Icons from [Material Icons](https://developers.google.com/fonts/docs/material_icons)


## License
[MIT](LICENSE.md)