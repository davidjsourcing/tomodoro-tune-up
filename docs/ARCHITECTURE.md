# Tomodoro — Architecture Reference

> Tomodoro is a single-page, vanilla-JS pomodoro app that works offline (PWA).  
> Every file is loaded from the single HTML page; there is no build step.

---

## 1. File Map

| File | Role |
|------|------|
| [`index.html`](../index.html) | Static shell. Declares all DOM nodes that JS selects by ID. Contains the timer ring, the settings menu, the statistics panel, the task manager, and the "What's New" first-load overlay. The only `<script>` tag is at the bottom of `<body>`, loading `index.js`. |
| [`index.js`](../index.js) | The entire application brain (~1 800 lines). Registers the service worker, creates the `Worker`, and wires all interactive behaviour: timer loop, notifications, white noise, theming, task CRUD, statistics computation, PiP mode. |
| [`index.css`](../index.css) | All styling. Uses four CSS custom properties (`--bgcolor`, `--bgcolor2`, `--color`, `--coloraccent`) plus three timer-state properties (`--focus`, `--short`, `--long`) that JS writes at runtime. |
| [`worker.js`](../worker.js) | A dedicated `Web Worker` that owns a `setInterval` tick (1 s). Receives `{type:"start", t, maxDuration}` or `{type:"stop"}` messages and replies with `{t, running}` each second. Isolated from the main thread so tab throttling does not stall the count. |
| [`sw.js`](../sw.js) | Service Worker. On `install` it pre-caches a hard-coded list of assets (HTML, CSS, JS, icons, manifest) under the cache name `"clock"`. On every `fetch` it goes network-first, updates the cache with the fresh response, and falls back to the cache on failure — a stale-while-revalidate strategy. |

---

## 2. Runtime State, Timer Loop & Round Advancement

### 2.1 Key runtime variables

```
index.js
```

| Variable | Type | Declared | Meaning |
|----------|------|----------|---------|
| `roundInfo` | Object | line 60 | Central timer state — see below |
| `config` | Object | line 47 | Duration settings in **seconds** |
| `autoStartFocusRounds` | boolean | line 100 | Auto-start focus after a break |
| `autoStartBreakRounds` | boolean | line 101 | Auto-start break after focus |
| `pipActive` | boolean | line 37 | Whether canvas PiP is currently rendering |
| `viewState` | string | line 45 | `"timer"` \| `"menu"` \| `"tasks"` \| `"statistics"` |
| `tasks` | string[] | line 517 | Ordered list of task names |
| `selectedTask` | string | line 519 | Task credited when a focus round ends |
| `filteredTasks` | Set\<string\> | line 523 | Tasks currently shown in the stats view |
| `db` | IDBDatabase | line 524 | Handle to the IndexedDB `pomo-db` database |

#### `roundInfo` fields (line 60–65)

```js
{
  t:        number,  // elapsed seconds in the current round (0-based)
  focusNum: number,  // how many focus rounds have completed since the last long-break reset
  current:  string,  // "focus" | "short" | "long"
  running:  boolean, // whether the worker tick is active
}
```

#### `config` fields (line 47–52, persisted in `pomo-config`)

```js
{
  focus:   number,  // seconds (default 1500 = 25 min)
  short:   number,  // seconds (default 300  =  5 min)
  long:    number,  // seconds (default 900  = 15 min)
  longGap: number,  // focus rounds before a long break (default 4)
}
```

### 2.2 The timer loop

```
Worker (worker.js)        Main thread (index.js)
────────────────────────  ──────────────────────────────────────
setInterval 1 s           timerWorker.addEventListener("message")
  t++                 →   roundInfo.t = e.data.t            (line 88)
  if t > maxDuration:     setTime()                         (line 89)
    postMessage            if !e.data.running → nextRound() (line 91)
      {t, running:false}
  else:
    postMessage
      {t, running:true}
```

[`setTime()`](../index.js:69) computes `remaining = config[roundInfo.current] − roundInfo.t`, formats it as `MM:SS`, writes it to `#time` and `document.title`, and sets the SVG ring's `stroke-dashoffset` to `(t / maxDuration) * 100` (line 83).  
It also calls [`loop()`](../index.js:1600) when `pipActive` is true so the canvas PiP frame stays in sync.

### 2.3 Round advancement (`nextRound`, lines 127–175)

Called either by the worker's `running:false` message (line 91) or the **Next** button (line 209).

```
focus ends
  → focusEnd(roundInfo.t)   record the completed minutes
  → focusNum >= longGap?
      yes → current = "long",  focusNum = 0
      no  → current = "short"

break ends
  → current = "focus"
  → focusNum++
  → roundnoDiv updated
```

After advancing `current`, `roundInfo.t` is reset to 0 (line 151) and:

- If `roundInfo.running` was `true`, the autostart flags decide the **next** running state (lines 153–163).  
- If autostart is turned off mid-run, [`pauseplay()`](../index.js:177) is called to pause (line 161).  
- If `roundInfo.running` ends up `true`, the worker is told to start immediately (lines 169–173).
- A desktop notification is fired via [`notify()`](../index.js:263) (line 174).

### 2.4 Autostart (lines 100–125)

Two booleans (`autoStartFocusRounds`, `autoStartBreakRounds`) default to `true`. They are read from `localStorage` keys `pomo-auto-start-focus` / `pomo-auto-start-break` at startup and updated immediately on `<select>` change. They are consulted only inside `nextRound()` when the timer was already running — manually clicking **Next** while paused does **not** trigger autostart (line 153 guard).

---

## 3. localStorage Data Model

All `localStorage` access happens in `index.js`. IndexedDB holds the records; localStorage holds everything else.

| Key | Shape | Written at | Read at |
|-----|-------|-----------|---------|
| `pomo-config` | `{"focus":N,"short":N,"long":N,"longGap":N}` (seconds) | [`saveConfig()`](../index.js:1483) on every input change | Startup line 1478 |
| `pomo-tasks` | `["Task A","Task B",…]` (ordered string array) | [`saveTasks()`](../index.js:619) on create/delete/restore | [`loadTasks()`](../index.js:528) line 530 |
| `pomo-selected-task` | `"Task Name"` | `taskSelect` change listener line 849 | `loadTasks()` line 542 |
| `pomo-records` | Legacy: array of record objects (migrated to IDB on first load and removed) | — | `loadTasks()` line 537–541 |
| `pomo-notif` | `"enabled"` \| `"silent"` \| `"disabled"` | `notifSelect` change listener line 260 | Startup line 254 |
| `pomo-audio-type` | `"noise"` \| `""` (or absent) | `audioSelect` change listener line 349 | Startup line 315 |
| `pomo-audio-volume` | numeric string `"0"–"100"` | `volumeSlider` input listener line 383 | Startup line 325 |
| `pomo-auto-start-focus` | `"true"` \| `"false"` | `autoStartFocusSelect` change listener line 119 | Startup lines 106–108 |
| `pomo-auto-start-break` | `"true"` \| `"false"` | `autoStartBreakSelect` change listener line 123 | Startup lines 110–112 |
| `pomo-theme` | `"dark"` \| `"black"` \| `"light"` \| `"white"` | [`setAccent()`](../index.js:1442) line 1456 | Startup line 1466 |
| `pomo-theme-accent` | e.g. `"lavender"`, `"red"` | `setAccent()` line 1457 | Startup line 1468 |
| `pomo-pip-method` | `"documentPictureInPicture"` \| `"canvas"` | `pipMethodSelect` change listener line 1592 | Startup line 1578 |
| `pomo-pip-restore` | `"enabled"` \| `"disabled"` | `pipDoubleClickRestoreSelect` change listener line 1597 | Startup line 1585 |
| `pomo-stat-period` | `"0"` \| `"1"` \| `"7"` \| `"365"` \| `"all"` | `statTimeSelect` change listener line 690 | `loadTasks()` line 548 |
| `pomo-version` | integer string (currently `"1"`) | "Let's Get Started!" button click line 1794 | Startup line 1781 |

### IndexedDB schema (`pomo-db` v1, lines 552–565)

Object store: **`records`**  
Key path: `d` (unique timestamp integer, ms epoch)  
Index: `task` on field `n` (non-unique)

Each record object:

```js
{
  t: number,  // duration of the focus round in **minutes** (integer, rounded)
  d: number,  // Date.now() at the moment the round ended (primary key)
  n: string,  // task name (matches one entry in pomo-tasks)
}
```

Written by [`saveRecord(r)`](../index.js:596) called from [`focusEnd(t)`](../index.js:623).  
`focusEnd` is called at the start of `nextRound()` only when `roundInfo.current === "focus"` (line 134).  
Rounds shorter than 1 minute are silently discarded (line 625: `if (minutes <= 0) return`).

Backup: all records are dumped to a JSON file by the **Create Backup** button (lines 635–647).  
Restore: records are inserted individually; duplicate `d` keys cause an IDB `ConstraintError` (the `rec.forEach` on line 673 has no error handler).

---

## 4. Tasks, Focus Records & Statistics

### 4.1 Task lifecycle

1. **Create** — form `#newtask` submit (line 823). Name trimmed and deduplicated. `tasks.push()` → `createTaskEl()` → `saveTasks()`.  
2. **Select** — `#task-select` change (line 847) writes `selectedTask` and `pomo-selected-task`.  
3. **Delete** — button inside each task div (line 747). Removes from `tasks[]`, DOM elements, `filteredTasks`, `taskBars`, `pieCards`; calls `deleteRecords(task)` to wipe IDB; calls `saveTasks()`.

[`createTaskEl(task)`](../index.js:697) (line 697) simultaneously:
- Adds an `<option>` to `#task-select`.
- Adds an editing row to `#task-container`.
- Adds a filter chip (checkbox) in the statistics panel `#filters`.
- Allocates a horizontal bar element via [`barGenerator()`](../index.js:884) and a pie-card via [`pieCardGenerator()`](../index.js:857).

### 4.2 Focus record creation

[`focusEnd(t)`](../index.js:623) (line 623):

```js
let minutes = Math.round(t / 60);   // t is elapsed seconds from roundInfo.t
if (minutes <= 0) return;            // skip very short rounds
saveRecord({ t: minutes, d: Date.now(), n: selectedTask });
```

Called by `nextRound()` at line 134 only for focus rounds, **before** the state advances.

### 4.3 `loadStatistics()` (line 971)

Called when the stats panel opens, when the time-period selector changes, and when a per-task filter changes.

**Step 1 — Fetch records** (line 973):  
[`getRecords()`](../index.js:568) reads from IDB. If all tasks are included it uses `.getAll()` on the index. If a subset is selected it fires one `getAll(IDBKeyRange.only(task))` per task and concatenates — note the resolution happens on the **last index `i`**, which can race if IDB calls complete out of order (see §6).

**Step 2 — Time filter** (lines 974–993):  
- `"0"` (Today): keeps records where `d` falls within the current calendar day (midnight-to-midnight local time).  
- `"1"` / `"7"` / `"365"`: keeps records within `N * 86 400 000 ms` of now.  
- `"all"`: no filter.

**Step 3 — Aggregate** (lines 994–1026):  
For each task in `filteredTasks`:

```
chart.t  += r.t        // total minutes per task
totalValue += r.t
hourlyTimes[floor(r.d.getHours() / 6)] += r.t
dayTimes[r.d.getDay()]   += r.t
monthTimes[r.d.getMonth()] += r.t
```

`minRoundValue` / `maxRoundValue` track the shortest and longest individual rounds.

**Step 4 — Render overview** (lines 1027–1031):  
Writes `hmstrFull(totalValue)`, round count, average, shortest, longest into the summary spans.

**Step 5 — Remarks** (lines 1033–1066):  
Finds the index with the highest value in `hourlyTimes`, `dayTimes`, `monthTimes` and writes the human-readable name.  
Initial values for `maxH`, `maxD`, `maxM` are all set to `1` (not `0`), meaning if the first slot is the only non-zero slot it will not be selected — see §6.

**Step 6 — Pie chart** (lines 1068–1111):  
Charts array is sorted descending by `t`. For each task a `<path>` is drawn as a pie segment using polar-to-Cartesian math (centre 60,60; radius 50 in the 120×120 viewBox). If a single task has 100 % of the time a special "full circle" path is used (line 1094).

**Step 7 — Bar charts** (lines 1113–1132):  
Each of the four time-bucketed charts (6-hourly, daily, monthly) renders bars with `width = (value / max) * 100 %`. The max baseline is initialised to `1` to avoid division-by-zero when all values are 0, but this means a zero bar still renders at 0 % width correctly.

**Step 8 — "Time Spent per Task" bars** (lines 1073–1076):  
Width relative to `maxvalue` (the highest per-task total). Order CSS property is set per sort position.

**Step 9 — Entry cards** (lines 1134–1139):  
When `updateEntryCards` is `true` (default), records are sorted newest-first and rendered into `#round-entries`.

#### Yearly chart

`timeYearlyChart` is declared at line 688 (`document.getElementById("timeyearly")`), but there is no corresponding `#timeyearly` element in `index.html`, and there is no yearly aggregation or rendering code in `loadStatistics()`. The yearly chart is a stub.

---

## 5. PiP Mode & White Noise

### 5.1 PiP Mode

Controlled by `pipMethod` (default `"documentPictureInPicture"`, persisted in `pomo-pip-method`). Two code paths are compiled at runtime (line 1636).

#### Document PiP (Chromium, lines 1636–1716)

Uses the [Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture/).

1. **Enter** ([`enterPiP()`](../index.js:1640), line 1640):  
   - Adds `class="pip"` to `#main` so CSS can style the placeholder.  
   - Calls `documentPictureInPicture.requestWindow()` with `initialAspectRatio` and `lockAspectRatio`.  
   - Copies all `document.styleSheets` into the PiP window head (with a try/catch fallback to `<link>` for cross-origin sheets).  
   - **Physically moves** the `#timer` DOM node into `pipWindow.document.body` — the node is no longer in the main document.  
   - Applies theme CSS variables directly on `pipWindow.document.body`.  
   - Registers an `"unload"` listener to re-attach the node on close.

2. **Leave** ([`onLeavePiP()`](../index.js:1696), line 1696):  
   - Queries `#timer` from `pipWindow.document`, appends it back to `timerContainer`.  
   - Removes the `"pip"` class.  
   - Closes the window.

3. **Double-click to restore** (lines 1687–1692):  
   If `pipDoubleClickRestore === "enabled"`, a `"dblclick"` listener (once) is added to `pipWindow.document`; it calls `onLeavePiP`. Both "unload" and "dblclick" are registered as `{once:true}`, but closing from double-click does not cancel the unload listener, so `onLeavePiP` could be called twice (see §6).

Because the timer node is moved, `setTime()` continues to update it regardless of which document it lives in.  
`pipActive` remains `false` in Document PiP mode — the canvas `loop()` is not used.

#### Canvas PiP (fallback, lines 1717–1776)

Used when `documentPictureInPicture` is absent (Firefox, Safari) or the user explicitly selects `"canvas"` in settings.

1. A `<canvas>` (400×400) and a `<video>` element are appended to `<body>`.  
2. `canvas.captureStream()` is set as `video.srcObject`.  
3. `loop()` (line 1600) redraws the canvas each time `setTime()` is called (when `pipActive` is `true`).  
4. Clicking the PiP button plays the video and calls `video.requestPictureInPicture()`. Because the stream is a canvas the picture-in-picture window shows the canvas timer.  
5. `video.play` / `video.pause` events mirror the timer state, allowing the user to pause from the video controls (lines 1728–1733).  
6. `pipActive` is set `true` on `enterpictureinpicture` / fullscreen, and `false` on leave.

[`loop()`](../index.js:1600) (line 1600):  
Clears the canvas, draws the time string (80 px monospace, centred), the mode label (32 px), an accent-coloured outline circle, and an arc representing elapsed progress — all using theme variables from `accents[theme][themeAccent]`.

### 5.2 White Noise

White noise uses the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API). State variables (lines 331–337):

| Variable | Purpose |
|----------|---------|
| `audioCtx` | Singleton `AudioContext` (lazy-created in `initNoise`) |
| `noiseSource` | `AudioBufferSourceNode` (recreated on each `fadeIn`) |
| `gain` | `GainNode` for volume control |
| `noiseTimeout` | `setTimeout` handle for the fade-out delay |
| `isWhiteNoiseRunning` | Whether `noiseSource.start()` has been called |
| `isFadingOut` | Whether a fade-out is in progress |

**[`initNoise()`](../index.js:352)** (line 352):  
Creates (or reuses) `audioCtx`. Allocates a 3-second mono buffer filled with `Math.random() * 2 − 1` (uniform white noise). Creates `noiseSource` (looped) and connects it through `gain` to `audioCtx.destination`. The gain is set to `volume / 100`.

**[`fadeIn()`](../index.js:405)** (line 405):  
- Cancels any pending `noiseTimeout`.  
- If not currently fading out: calls `initNoise()`, sets gain to 0, ramps to `volume/100` over 1 s, calls `playNoise()`.  
- If in the middle of a fade-out: cancels the ramp and ramps back up from the current gain value.

**[`fadeOut()`](../index.js:398)** (line 398):  
Ramps gain to 0 over 1 s, then calls `stopNoise()` via a 1 s timeout.

**Trigger points:**

| Event | Action |
|-------|--------|
| Focus round starts running (autostart or play) | `fadeIn()` (lines 166, 192) |
| Focus round ends (break starts) | `fadeOut()` (line 131) |
| Timer paused while focus running | `fadeOut()` (line 184) |
| User selects `"disabled"` in audio select | `fadeOut()` if running (line 341) |
| User selects `"noise"` while timer running in focus | `fadeIn()` (line 344) |

Volume changes while playing use `linearRampToValueAtTime` (line 382).

---

## 6. Fragile / Bug-Prone Areas

### 6.1 `getRecords()` multi-task race condition — [`index.js:584–590`](../index.js:584)

```js
filteredArray.forEach((task, i) => {
    let tr = ...getAll(IDBKeyRange.only(task));
    tr.onsuccess = (ev) => {
        result.push(...tr.result);
        if (i === filteredArray.length - 1) {   // ← resolves on last INDEX, not last completion
            resolve(result);
        }
    };
});
```

IDB requests complete asynchronously and may finish in any order. The guard `i === filteredArray.length - 1` checks whether the callback is for the **last item in the array by index**, not whether it is the **last callback to fire**. If the last task's IDB request completes before earlier ones, the Promise resolves with a partial `result`, silently dropping records.

### 6.2 `nextRound()` called twice on natural expiry — [`index.js:87–93`](../index.js:87) + [`index.js:71–73`](../index.js:71)

The worker posts `{running:false}` and the message listener calls `nextRound()` (line 91). But `setTime()` also calls `nextRound()` if `seconds < 0` (line 72). If the worker over-ticks by one (it can send `t = maxDuration + 1` before clearing the interval), both paths fire: `setTime()` fires on the `running:true` message with `t > maxDuration`, then `nextRound()` fires again from `running:false`. This can produce a duplicate focus record.

### 6.3 `onLeavePiP` double-call in Document PiP — [`index.js:1683–1692`](../index.js:1683)

Both `"unload"` and `"dblclick"` listeners are registered `{once:true}`. If double-click fires first it closes the window, triggering `"unload"`, so `onLeavePiP` is called twice. The second call queries `#timer` from the already-closed `pipWindow.document` (returns `null`), then calls `timerContainer.append(null)`, which throws a `TypeError`.

### 6.4 `isFadingOut` flag never reset on `audioType` change — [`index.js:339–350`](../index.js:339)

If the user switches audio from `"noise"` to `"disabled"` while `isFadingOut` is `true`, `fadeOut()` is called a second time (line 341), but `isFadingOut` stays `true`. A subsequent re-enable (`audioType = "noise"`) enters the `isFadingOut` branch of `fadeIn()` (line 412–415) and ramps up gain on the **stopped** `noiseSource`, producing silence with no new sound node created.

### 6.5 `minRoundValue` / `maxH` / `maxD` / `maxM` initialised to `1` instead of `0` — [`index.js:996`](../index.js:996), [`index.js:1037`](../index.js:1037), [`index.js:1047`](../index.js:1047), [`index.js:1057`](../index.js:1057)

`maxH`, `maxD`, `maxM` default to `1`. If bucket index 0 (00:00–06:00, Sunday, January) is the sole maximum, the loop's `v > maxHV` condition (strict greater-than) will never trip, and the remark will incorrectly name index 1 instead.  
Similarly, `minRoundValue` initialises to `0`, but the code only updates it when it equals `0` (line 1016: `if (minRoundValue === 0) { minRoundValue = r.t; }`). A round with `t = 0` minutes would set `minRoundValue = 0` permanently and prevent it from ever being updated to the true minimum.

### 6.6 Yearly chart DOM element missing — [`index.js:688`](../index.js:688)

`timeYearlyChart = document.getElementById("timeyearly")` returns `null` because there is no `#timeyearly` element in `index.html`. The variable is declared but never used in rendering, so it causes no error today — but any future code that writes to it will throw.

### 6.7 Backup restore ignores duplicate-key IDB errors — [`index.js:673`](../index.js:673)

```js
rec.forEach((r) => objstore.add(r));
```

`IDBObjectStore.add()` throws a `ConstraintError` if a record with the same `d` (timestamp key) already exists. There is no per-record `onerror` handler; the transaction's `oncomplete` is tied to success but there is also no `onerror` on the transaction. Duplicate records from a second restore silently abort the current transaction, meaning none of the records in that batch are inserted after the first collision.

### 6.8 Timer config change takes effect immediately mid-round — [`index.js:1483`](../index.js:1483)

`saveConfig()` calls `setTime()` immediately. If the user increases the focus duration while a round is running, `setTime()` recomputes `remaining = newFocus − roundInfo.t` and the ring/display jump. The worker still runs to the **old** `maxDuration` unless the user stops and restarts. This inconsistency means the display and the worker can diverge.

### 6.9 `focusEnd` credits the task that is selected at round-end, not round-start — [`index.js:623`](../index.js:623)

If the user switches tasks during a focus session, the entire session is credited to the task selected at the moment `nextRound()` fires (when the round ends), not the one that was active when the round started.
