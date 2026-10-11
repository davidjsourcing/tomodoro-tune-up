# Tomodoro
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z6E84CZ)&nbsp;
<a href="https://www.producthunt.com/posts/tomodoro?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-tomodoro" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=355079&theme=light" alt="Tomodoro - Simple&#0032;Pomodoro&#0032;timer&#0032;for&#0032;the&#0032;web | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

A pomodoro web app with PIP mode, white noise generation, tasks and more!

---

## About this fork (IBM Bob hackathon)

This is a fork of [lazy-guy/tomodoro](https://github.com/lazy-guy/tomodoro), submitted to the
**AngelHack "Building with IBM Bob" hackathon — Theme 1: Explore, Fix, and Build**.

Upstream baseline commit: **17a5091**.
Everything after that commit was produced during the hackathon (Oct 11, 2026), inside the Sep 28 – Oct 18 hackathon window.

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

| Test file | What it covers |
|-----------|----------------|
| [`test/records.test.js`](test/records.test.js) | `collectTaskRecords()` — IDB race-condition fix, empty/null inputs, error rejection |
| [`test/backup.test.js`](test/backup.test.js) | `normalizeBackup()` — field validation, duplicate-key deduplication, task-list ordering, non-array TypeError |
| [`test/colors.test.js`](test/colors.test.js) | `taskPalette()` / `taskColor()` — determinism, order-dependence, 12-task colour uniqueness, hsl() format |

### How IBM Bob was used

See **[`BOB-LOG.md`](BOB-LOG.md)** for a session-by-session log of every prompt and tool call,
and **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** for the architectural analysis that Bob
produced during the exploration phase.

---

*This hackathon work was driven by David J using IBM Bob Shell, with help from an AI assistant.*

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