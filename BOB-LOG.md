# BOB-LOG — how IBM Bob was used on this fork

Every prompt given to IBM Bob (Bob Shell 2.0.6, headless `bob run`, Linux, trial plan) while turning
an unfamiliar app ([lazy-guy/tomodoro](https://github.com/lazy-guy/tomodoro), baseline commit `17a5091`)
into this submission, in order, with what Bob produced, what was kept, and what was corrected by hand.
Raw transcripts of every run (Bob's own output, tool calls included) are in [`docs/bob-runs/`](docs/bob-runs/).

Everything below happened on **2026-10-11 (04:17–04:40 UTC)**, inside the hackathon window.
Bob was driven from the terminal by David J with an AI assistant helping to write prompts, check Bob's
claims against the code, and keep this log honest. All Bobcoin costs are the figures Bob printed.

Workflow: **explore → fix (test-first) → build a feature → fix a second bug → Bob reviews its own diff → apply the review → docs.**
Every run was a fresh headless session with `--max-cost` set, so each step had to stand on the files
in the repo (including Bob's own `docs/ARCHITECTURE.md`), which is also why that doc exists.

---

## Run 1 — Explore: architecture reference (cost 1.20 Bobcoins, 2m20s, 16 tool calls)

**Prompt**

> I am new to this codebase (Tomodoro, a vanilla-JS pomodoro web app). Read index.html, index.js, index.css, sw.js and worker.js and write docs/ARCHITECTURE.md explaining: (1) what each file does; (2) the main runtime state variables in index.js and the timer loop (how time is tracked, how rounds advance, how autostart works); (3) the data model persisted in localStorage (every key, its shape, and where it is read/written); (4) how tasks, focus records and the statistics views (pie cards, bar charts, six-hourly/daily/monthly/yearly) are computed; (5) how PiP mode and white noise work; (6) a short list of places that look fragile or bug-prone, each with a file:line reference. Be concrete and cite line numbers. Do not change any existing file.

**Produced:** `docs/ARCHITECTURE.md` (368 lines): file map, runtime state, timer loop, round advancement,
autostart, the localStorage keys and the IndexedDB schema, how statistics are computed, PiP (Document PiP
and the canvas fallback), white noise, and a list of nine "fragile / bug-prone" places with line numbers.

**Kept:** the whole document, unchanged.

**Checked against the code — what Bob got right and wrong:**
- §6.1 `getRecords()` resolves on the last *index* instead of the last *completion* — **correct, real bug** (fixed in Run 2).
- §6.7 backup restore uses `add()` with no error handler, so a duplicate key aborts the whole transaction silently — **correct, real bug** (fixed in Run 4).
- §6.2 "nextRound() can fire twice because the worker sends maxDuration+1" — **wrong**: `worker.js` posts `t-1` (= maxDuration) with `running:false`, so `setTime()` sees `seconds === 0` and does not call `nextRound()`. Not fixed, not a bug.
- §6.5 "maxH/maxD/maxM initialised to 1 so bucket 0 can never win" — **wrong**: the loop uses `v > maxHV` with `maxHV = 0`, so bucket 0 wins whenever it has any time. The `minRoundValue === 0` half of that item is technically true but only for a 0-minute record, which `focusEnd()` never saves. Not fixed.
- §6.3, §6.4, §6.8, §6.9 — plausible UX issues, not verified, left as documented.

## Run 2 — Fix the real bug, test-first (cost not printed — session cut short; ≈2 Bobcoins by the dashboard delta*)

**Prompt**

> Follow-up on docs/ARCHITECTURE.md section 6.1: I verified that getRecords() in index.js (multi-task branch, lines ~577-592) resolves its Promise when the callback for the LAST task in the array fires, not when ALL IndexedDB getAll requests have completed, so statistics filtered to two or more tasks can silently drop records when the requests complete out of order. Fix it test-first, with no build tooling (this is a plain static site, no bundler):
1. Create src/records.js as a classic browser script (NOT an ES module) that defines a pure function collectTaskRecords(store, tasks) -> Promise<Array>. `store` is an object with index(name).getAll(keyRange) returning an IndexedDB-style request object (with .onsuccess, .onerror, .result). It must resolve with all records for all tasks regardless of completion order, resolve [] when tasks is empty, and reject if any request errors. Expose it as window.TomodoroRecords = { collectTaskRecords } in the browser AND also `if (typeof module !== "undefined") module.exports = { collectTaskRecords }` so Node can require it.
2. Create test/records.test.js using node:test and node:assert (no dependencies). Build a tiny fake store whose getAll requests complete in a controlled order (use setTimeout with different delays so the LAST task finishes FIRST). Include a test that demonstrates the original buggy strategy drops records (implement the old algorithm inline in the test as buggyCollect and assert it returns fewer records), and tests that collectTaskRecords returns every record, handles empty tasks, and rejects on error.
3. Create package.json with {"name":"tomodoro","private":true,"scripts":{"test":"node --test test/"}} and no dependencies.
4. Add <script src="src/records.js"></script> to index.html immediately before the index.js script tag, and change getRecords() in index.js so the multi-task branch delegates to TomodoroRecords.collectTaskRecords(db.transaction("records","readonly").objectStore("records"), Array.from(filteredTasks)). Keep the single-task and all-tasks branches as they are. Also add src/records.js to the service worker cache list in sw.js if it caches index.js.
5. Run `npm test` and make sure everything passes. Report exactly what you changed with file:line references. Do not touch anything else.

**Produced:** `src/records.js` (`collectTaskRecords`, classic script + CommonJS export), `test/records.test.js`
(fake IndexedDB store with controlled completion order; one test proves the *old* algorithm drops records,
three test the new one), `package.json`, the `<script>` tag, the `sw.js` cache entry, and the `getRecords()` rewrite.

**What went wrong:** Bob's session ended while it was running `npm test` (the process was killed — see
"Environment notes" below), so Bob never printed its final summary. *The cost figure is therefore not from
Bob's summary. The files were complete and the four tests passed when run by hand.

**Corrected by hand:** `package.json` test script `node --test test/` does not work on Node 24 (a directory
argument is treated as a file); changed to `node --test test/*.test.js`. Bob's `getRecords()` also swallows
errors from `collectTaskRecords` into an empty result (`.catch(() => resolve(result))`); left as is — it matches
the old code's failure mode and the stats view has no error UI.

## Run 3 — Feature: per-task colours (upstream issue #6) (cost 2.70 Bobcoins, 1m45s, 28 tool calls)

**Prompt**

> Implement the feature requested in upstream issue #6: "add different colors for the pie chart to show different tasks worked. I am a student and I usually add subjects and sometimes I like to know how much time I have spent revising each one (usually 7)". Today every pie slice uses the single accent colour (index.css #pie svg path { fill: var(--coloraccent) }), so slices are indistinguishable. Requirements, in the same no-build classic-script style as src/records.js:
1. Create src/colors.js (classic script, exposes window.TomodoroColors and module.exports) with a pure function taskPalette(tasks) -> object mapping each task name to a CSS colour string. Colours must be deterministic for a given ordered list of tasks (the list is the pie slices sorted by time, largest first), visually distinct for at least 12 tasks (spread hues evenly around the wheel with a golden-angle step and alternate lightness), readable on both dark and light themes, and must never return the same colour for two different tasks in one list. Also export slice colour helper taskColor(task, tasks) = taskPalette(tasks)[task].
2. Create test/colors.test.js (node:test + node:assert) covering: determinism, distinctness for 12 tasks, valid hsl()/hex output, empty list, single task.
3. Wire it into index.js loadStatistics(): compute the palette from the sorted charts, set each pie <path> fill via style.fill, add a small colour swatch (a span.pie-swatch with inline background colour) at the start of each pie card name and each task bar label so the legend matches the slice. Add the swatch styling to index.css (a 12px rounded square, inline-block, margin-right 6px). Keep the hover/active behaviour working. Add <script src="./src/colors.js"></script> to index.html before index.js and to the sw.js cache list.
4. Run npm test; all tests must pass. Report what you changed with file:line references. Do not touch anything else.

**Produced:** `src/colors.js` (`taskPalette`, `taskColor`, golden-angle hues, alternating lightness),
`test/colors.test.js` (8 tests), swatches in `pieCardGenerator()` and `barGenerator()`, inline fills on the
pie slices and bars, `.pie-swatch` CSS, script tag and cache entry. All tests passed on the first run.

**Corrected by hand (design, not code):** my prompt asked for colours keyed to the *sorted* slice order, which
Bob did faithfully — but that means a subject changes colour whenever the ranking changes. Changed the one line
in `loadStatistics()` to key the palette by the user's stable task list (`tasks`) instead of `sortedCharts`.

## Run 4 — Fix the second bug: silent backup-restore failure (cost 1.27 Bobcoins, 1m13s, 23 tool calls)

**Prompt**

> Fix the backup-restore bug noted in docs/ARCHITECTURE.md section 6.7. In index.js the "backup-restore" change handler (around lines 647-682) parses the uploaded JSON and calls objstore.add(r) for every record inside one readwrite transaction. If any record has a timestamp key d that already exists (restoring the same backup twice, or a backup overlapping current data), add() errors, the whole transaction aborts, nothing is restored, and the user sees NO message at all because only tr.oncomplete is wired and the catch block only covers synchronous errors. Fix it test-first:
1. Create src/backup.js (classic script, window.TomodoroBackup + module.exports) with a pure function normalizeBackup(parsed) that takes the parsed JSON value and returns { records, tasks, skipped }: records = only entries that are objects with a finite positive number t (minutes), a finite number d (timestamp) and a non-empty string n (task), copied to plain {t,d,n} objects, deduplicated by d (keep the first); tasks = unique task names in order of first appearance; skipped = the count of entries dropped. It must throw a TypeError with a clear message if parsed is not an array.
2. Create test/backup.test.js (node:test, node:assert) covering: valid input passes through, invalid entries are skipped and counted, duplicates by d are collapsed, tasks are unique and ordered, non-array input throws.
3. In index.js use TomodoroBackup.normalizeBackup inside the restore handler, use objstore.put(r) instead of add(r) so re-restoring is idempotent, add tr.onerror that alerts a clear failure message, and make the success alert mention how many records were restored and how many entries were skipped. Add the script tag to index.html before index.js and the file to the sw.js cache list.
4. Run npm test (all green) and report exactly what you changed with file:line references. Do not touch anything else.

**Produced:** `src/backup.js` (`normalizeBackup`: validates each entry, dedupes by timestamp, returns
`{records, tasks, skipped}`, throws on non-array), `test/backup.test.js` (15 tests), restore handler now uses
`put()` (idempotent), has `tr.onerror`, and reports counts. 27 tests green.

**Kept:** everything.

## Run 5 — Bob reviews the fork's diff (cost 1.1744719999999997 Bobcoins, 58s, 21 tool calls)

**Prompt**

> Act as a strict code reviewer of the changes made in this fork since the upstream baseline. Read src/records.js, src/colors.js, src/backup.js, the tests in test/, and the unified diff of index.js/index.html/index.css/sw.js saved at /tmp/fork-changes.diff (read it with read_file; do not run git or any shell command). Report: correctness problems, behaviour regressions for existing users (offline service-worker cache, themes, PiP), missing edge cases in the new modules and tests, and anything that would break on an older browser. Be specific with file:line references and a concrete suggested change for each finding, ranked by severity. Do NOT modify any file; output the review only, under 600 words.

**Produced:** a ranked review of nine findings. Verified by reading the code:
- **Right and fixed:** service-worker cache name never versioned → existing offline users would keep the old
  bundle without the new `src/*.js` files; `reject()` can be called more than once in `collectTaskRecords`;
  upstream creates an unknown `<round-entry-duration>` element instead of a `<div>`.
- **Wrong:** finding #1 claims `normalizeBackup`'s duplicate check breaks for `d = "constructor"` — `d` must be
  a finite number before it reaches that check, so the case cannot occur; its own walkthrough of the `d = 0`
  case also contradicts itself. Not changed.
- **Not acted on:** `Intl.DateTimeFormat` `dateStyle` on very old browsers (upstream code, out of scope);
  the `IDBKeyRange` stub note (test-only); the hsl regex note (cosmetic).

## Run 6 — Apply three review findings (cost 1.030122 Bobcoins, 51s, 16 tool calls)

**Prompt**

> Apply three findings from a code review of this fork (do not re-review):
(1) sw.js: version the cache name (change "clock" to "clock-v2") and add an "activate" handler that deletes every cache whose name is not the current one and then calls self.clients.claim(), so existing offline users receive the new src/*.js files.
(2) src/records.js: guard against calling reject() more than once when several IndexedDB requests error (a settled flag); add a test in test/records.test.js that passes null and undefined as the tasks argument and expects [] (do not break the existing tests).
(3) index.js roundEntryGen(): the line `document.createElement("round-entry-duration")` creates an unknown custom element; change it to createElement("div") and keep the same className so the CSS still applies. Check that the CSS rule for that class does not depend on the old tag name.
Then run `npm test 2>&1 | tail -8` and report the results and the exact changes with file:line references. Touch nothing else.

**Produced:** `clock-v2` cache name + `activate` handler with `clients.claim()`; `settled` flag in
`collectTaskRecords`; two new null/undefined tests; `<div>` fix. 29 tests green. **Kept:** everything.

## Run 7 — README (cost 0.4892140000000001 Bobcoins, 54s, 18 tool calls)

**Prompt**

> Update README.md for this fork (keep the existing upstream content and credit; this is a fork of lazy-guy/tomodoro made for the AngelHack "Building with IBM Bob" hackathon, Theme 1: Explore, Fix, and Build). Add, near the top, a section "About this fork (IBM Bob hackathon)" that: states the upstream baseline commit is 17a5091 and everything after it was done during the hackathon; lists the improvements made (read git log --oneline 17a5091..HEAD via read of the file /tmp/gitlog.txt which I saved for you, plus docs/ARCHITECTURE.md section 6 and the files in src/ and test/); has a "Run locally" section (it is a static site: `python3 -m http.server 8080` or any static server, then open http://localhost:8080; note the service worker and that PiP/notifications need a secure context or localhost); a "Run the tests" section (Node 20+, `npm test`, no dependencies, what each test file covers); a "How IBM Bob was used" section pointing to BOB-LOG.md and docs/ARCHITECTURE.md; and a one-line honest disclosure that the hackathon work was done with IBM Bob Shell driven by David J with help from an AI assistant. Do not run shell commands. Do not modify any other file.

**Produced:** the "About this fork" section of `README.md`.
**Corrected by hand:** Bob wrote "Seventeen tests" for `backup.test.js` (there are 15), described the colour
work only as a utility module (added the user-facing feature description), and did not mention the restore
feedback or the review fixes (added).

---

## Totals

7 Bob runs, about 7.9 Bobcoins of the trial's 50 (the hackathon's promo-code upgrade
needs a credit card, which was not used). Tests: 0 → 29. Files touched by Bob: `index.js`, `index.html`,
`index.css`, `sw.js`, `src/records.js`, `src/colors.js`, `src/backup.js`, `test/*.test.js`, `package.json`,
`docs/ARCHITECTURE.md`, `README.md`.

## Environment notes (what Bob got wrong, or what went wrong around Bob)

- Bob Shell needs Node 24; the box had Node 22, so Node 24 was installed under `~/.local` just for Bob.
- The install script's package-manager prompt reads `/dev/tty`; it has a `--pm npm` flag for headless boxes.
- Two sessions were killed by the Linux OOM killer on this 4 GB machine (RSS ≈ 1.8 GB) right after an
  `execute_command` whose output was a `git diff` rendered through the `pretty` formatter. Workaround that
  held: `-f json`, `--disable-subagents --disable-mcp`, and handing Bob a saved diff file instead of letting it
  run `git diff`. Those two dead sessions are not counted above; their partial transcripts are in `docs/bob-runs/`.
- Headless `bob run` reads stdin; when driven from a script that is itself piped into bash, give it `< /dev/null`.
- Bob's "fragile areas" list and its review each contained confident findings that the code disproves
  (listed above). Reading the lines it cites before acting on them was the single most useful habit.
