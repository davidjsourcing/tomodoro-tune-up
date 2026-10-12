# The Tune-Up Kit (`.bob/`)

A drop-in set of IBM Bob customizations for working in a codebase you did not write: explore it, fix it and build on it,
with every claim and every change backed by evidence. Bob wrote most of it (Bob runs 8 and 9, transcripts in
`docs/bob-runs/`); the shell guard was written by hand (see `docs/BOB-SHELL-NOTES.md`). Copy the `.bob/` folder into
another repo, edit `.bob/rules/house-rules.md` for that project, and it works with `bob run --mode <slug>`.

| Piece | File | What it does |
|---|---|---|
| **Scout** mode | `.bob/custom_modes.yaml` (`scout`) | Read-only explorer for a newcomer. Every claim cites the `file:line` it opened and is labelled VERIFIED or SUSPECTED. Can only write Markdown under `docs/`. |
| **Test-First Fixer** mode | `.bob/custom_modes.yaml` (`test-first-fixer`) | For every bug or feature: write a failing `node:test` first, run it and show the failure, then change the code, then run `npm test` until green. No new dependencies, no build step, never touches `LICENSE.md`. |
| **Claim Checker** mode | `.bob/custom_modes.yaml` (`claim-checker`) | Audits a document or diff Bob produced: each claim CONFIRMED / WRONG / UNVERIFIABLE with `file:line` evidence. Writes its verdict to `docs/reviews/`. |
| **issue-to-fix** skill | `.bob/skills/issue-to-fix/SKILL.md` | Turns an issue into a fix: restate, locate with `file:line`, bug or feature, failing test first, implement, `npm test`, one README bullet naming the issue, list what was not done. Bob loads it on its own when you mention an issue, or via `/issue-to-fix`. |
| House rules | `.bob/rules/house-rules.md` | Applies to every mode: plain static site, classic scripts with a CommonJS tail for tests, tabs + double quotes like upstream, cite `file:line`, minimal changes, one simple shell command at a time. |
| **Test-after-write** hook | `.bob/settings.json` (PostToolUse) + `.bob/hooks/test-after-write.mjs` + `summarize.cjs` | After every file Bob writes (`write_file`, `apply_diff`, ...), runs the whole suite with the TAP reporter and puts one line beside the tool result: `tests: 144 passed, 0 failed` plus up to three failing test names. Bob sees the score after every edit. |
| **Shell guard** hook | `.bob/settings.json` (PreToolUse) + `.bob/hooks/shell-guard.mjs` | Blocks one command shape (a pipe combined with `&&`, `||` or `;`) before it runs and tells Bob to run one simple command instead. Written after Bob Shell 2.0.6 was OOM-killed repeatedly on this 4 GB machine. |

## When to use which
1. New to the repo: `bob run --mode scout "map the timer loop and the data model"`.
2. Planning a change: built-in `--mode plan` (writes `docs/plans/`).
3. Fixing or building: `--mode test-first-fixer` and mention the issue number so the skill kicks in.
4. Before you trust a summary or open a PR: `--mode claim-checker "check the claims in <file or diff>"`.

## What the kit caught in this project (round 2)
- Bob's own first hook always printed `tests: 0 passed, 0 failed` (wrong output format). Fixed test-first in run 9.
- Claim Checker (run 16) found 3 behaviour bugs in Bob's own features (speech for users who never opted in, speech on a
  manual skip, a note saved twice) and 4 wrong line numbers/counts in Bob's summaries. Fixed in run 17.

## Known limits (honest)
- In the Claim Checker mode, `write_file` to `docs/reviews/` was refused (we did not find out why); Bob then tried to
  write through the shell. Its composed review was saved from the run transcript by hand.
- A unit-test suite cannot see a page that fails to load; `test/boot.test.js` (run 13) now boots every app script in
  `node:vm` with a stub DOM to catch that class of bug.
