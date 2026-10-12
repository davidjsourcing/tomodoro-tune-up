# Round 2 Plan

## Issue #13 — Already solved

`#auto-start-focus` exists at [`index.html:188`](../../index.html:188) with Enabled/Disabled options.
`autoStartFocusRounds` is read at [`index.js:106-108`](../../index.js:106) and respected at
[`index.js:156`](../../index.js:156) inside `nextRound()`. Issue #13 is **fully solved** in the
current code.

---

## Issue #11 — Spoken Reminders

### Overview
Add a `src/speech.js` helper that announces time-remaining milestones via the Web Speech API.
A new "Spoken Reminders" setting lets users choose an interval (Off / 1 min / 5 min / 10 min / 30 min).
On each worker tick `setTime()` checks whether the elapsed-time crosses a multiple of the chosen
interval and fires the utterance.

### Touch points

| File | Location | Change |
|------|----------|--------|
| `src/speech.js` | new file | pure helper: `shouldSpeak(t, total, intervalSecs)`, `speakTime(secondsLeft)` |
| `test/speech.test.js` | new file | unit tests for helper |
| `index.html` | after `audio-select` block (~line 182) | add `<select id="speech-interval">` inside Sounds & Notifications section |
| `index.js` | after `pomo-audio-*` init (~line 325) | read/persist `pomo-speech-interval`; add `<script src="src/speech.js">` |
| `index.js` | inside `setTime()` at line 84 | call `TomodoroSpeech.maybeSpeakAt(roundInfo.t, config[roundInfo.current], interval)` |
| `index.html` | `<script>` list | add `<script src="src/speech.js"></script>` |
| `sw.js` | cache array (~line 8) | add `"./src/speech.js"` |

### Helper module — `src/speech.js`

Exports `{ shouldSpeak, speakTime }` (browser global `window.TomodoroSpeech`, CommonJS tail).

- `shouldSpeak(elapsedSecs, totalSecs, intervalSecs)` → `boolean`
  Returns `true` when `elapsedSecs` is the first tick that crosses a whole multiple of `intervalSecs`
  from the end (i.e. `secondsLeft % intervalSecs === 0 && secondsLeft > 0 && secondsLeft < totalSecs`).
  Pure function, no side-effects; testable in Node.
- `speakTime(secondsLeft)` — browser-only wrapper: creates `SpeechSynthesisUtterance`,
  sets `text` to e.g. `"5 minutes remaining"` or `"30 seconds remaining"`, calls `speechSynthesis.speak()`.

### Edge cases

- **Speech API unavailable** (`typeof speechSynthesis === "undefined"`): `speakTime` is a no-op.
- **PiP mode**: `setTime` already calls `loop()` at line 84; spoken reminder fires independently before that branch — no conflict.
- **Timer paused**: worker stops posting ticks, so `setTime` is not called — no spurious speech.
- **Interval = 0 / "Off"**: `shouldSpeak` returns `false` for `intervalSecs <= 0`.

---

## Issue #8 — Notes on Focus Round Records

### Overview
Add an optional free-text note to each focus round record. A textarea appears in the records list
entry so users can type a note after a round ends. Notes are stored as field `m` (memo) on the
IndexedDB record. Older records without `m` display as empty.

### Touch points

| File | Location | Change |
|------|----------|--------|
| `src/notes.js` | new file | pure helper: `sanitizeNote(raw, maxLen)`, `noteFromRecord(entry)` |
| `test/notes.test.js` | new file | unit tests for helper |
| `index.js` `focusEnd()` line 616 | record literal | add `m: ""` (empty string; user fills it post-round) |
| `index.js` `roundEntryGen()` line 923 | DOM builder | append a `<textarea class="round-entry-note">` pre-filled with `entry.m \|\| ""`; on `blur` call `updateRecordNote(entry.d, sanitizeNote(el.value))` |
| `index.js` | new function | `updateRecordNote(d, text)` — IDB `get` then `put` to update `m` field |
| `index.js` `deleteRecord()` | no change needed | deletes by `d`, `m` rides along |
| `src/backup.js` `normalizeBackup()` line 64 | `records.push(...)` | carry `m` field when present: `m: typeof entry.m === "string" ? entry.m : ""` |
| `sw.js` | cache array | add `"./src/notes.js"` |
| `index.html` | `<script>` list | add `<script src="src/notes.js"></script>` |

### Helper module — `src/notes.js`

Exports `{ sanitizeNote, noteFromRecord }` (browser global `window.TomodoroNotes`, CommonJS tail).

- `sanitizeNote(raw, maxLen = 500)` → `string` — trims whitespace, truncates to `maxLen`. Pure.
- `noteFromRecord(entry)` → `string` — returns `entry.m || ""`. Guards records without `m`.

### Edge cases

- **Records saved before notes existed** (`m` absent): `noteFromRecord` returns `""` — no crash, textarea shows empty.
- **Note length limit**: `sanitizeNote` caps at 500 chars; enforced on blur before IDB write.
- **Backups from older versions** (no `m` field): `normalizeBackup` sets `m: ""` — restore is lossless.
- **Concurrent IDB writes**: `updateRecordNote` uses `get`+`put` within a single readwrite transaction to avoid race with other writes.

---

## Order of Work

1. [ ] **`src/speech.js` + `test/speech.test.js`** — write module and passing tests (green before touching app).
2. [ ] **`src/notes.js` + `test/notes.test.js`** — write module and passing tests.
3. [ ] **Issue #11 wiring** — settings UI in `index.html`, init + persistence in `index.js`, tick hook in `setTime()`, cache in `sw.js`.
4. [ ] **Issue #8 wiring** — add `m: ""` to `focusEnd()` record, extend `roundEntryGen()`, add `updateRecordNote()`, extend `normalizeBackup()` in `src/backup.js`, cache in `sw.js`.
5. [ ] **Run `npm test`** — all tests green, no regressions.
