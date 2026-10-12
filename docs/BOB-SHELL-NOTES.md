# Bob Shell notes (field notes from this hackathon)

## Memory blow-up on chained + piped commands (Bob Shell 2.0.6, Node 24.11, Linux, 4 GB RAM)
Found 2026-10-12 while running the kit. Reproduced with one-line prompts ("Use execute_command to run exactly: ..."),
sampling the Bob process RSS every 50 ms:

| command Bob ran | peak RSS of the Bob process | result |
|---|---|---|
| `echo hi` | 324 MB | ok |
| `npm test` | ~330 MB | ok |
| `npm test 2>&1 \| tail -20` | ~330 MB | ok |
| `echo a && npm test` | ~330 MB | ok |
| `node --version` | 328 MB | ok |
| `node --version && npm test 2>&1 \| tail -20` | >1 GB within ~0.2 s | killed |
| `echo a && npm test 2>&1 \| tail -20` | >1 GB within ~0.3 s | killed |

Earlier full sessions that died the same way (OOM killer, ~1.7 GB anon RSS): run 2 (`npm test` step, Oct 11), run 5
(a large `git diff`), run 8 (kit self-test) and two attempts of run 9 (`node --version && npm test 2>&1 | tail -20`).
A V8 heap cap (`NODE_OPTIONS=--max-old-space-size=700`) did not stop it, so the growth is outside the JS heap.
We did not dig into Bob's internals; the pattern is: chain (&&, ||, ;) + pipe + a command with real output.

## Workaround in the kit
`.bob/hooks/shell-guard.mjs` (PreToolUse, matcher `^execute_command$`) blocks that command shape before it runs and tells
Bob to run one simple command at a time. Bob reads the reason and retries with a plain `npm test`.
The house rules (`.bob/rules/house-rules.md`) say the same thing so Bob rarely tries it.
