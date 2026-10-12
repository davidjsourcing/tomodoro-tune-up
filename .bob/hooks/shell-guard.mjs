// PreToolUse guard for execute_command (hand-written, see docs/BOB-SHELL-NOTES.md).
// Bob Shell 2.0.6 on a 4 GB Linux box: a single command that chains with && / ; / || AND pipes
// its output (e.g. "node --version && npm test 2>&1 | tail -20") made the Bob process grow past
// 1 GB in under a second and get OOM-killed. Reproduced 4 times on 2026-10-12; the same commands
// run one at a time are fine. This hook blocks that shape before it runs and tells Bob what to do.
let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let event = {};
try { event = JSON.parse(raw); } catch { process.exit(0); }
if (event.tool_name !== "execute_command") process.exit(0);
const cmd = String(event.tool_input?.command ?? "");
const hasPipe = /(^|[^|])\|([^|]|$)/.test(cmd);
const hasChain = /&&|\|\||;/.test(cmd);
if (hasPipe && hasChain) {
	process.stderr.write(
		"Blocked by the Tune-Up Kit shell guard: run one simple command at a time. " +
		"Do not combine a pipe (|) with &&, || or ; in one command (Bob Shell 2.0.6 runs out of memory on that shape on this machine). " +
		"Example: run `npm test` on its own; the working directory is already the project root."
	);
	process.exit(2);
}
process.exit(0);
