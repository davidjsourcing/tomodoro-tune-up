# Tomodoro workspace house rules

These rules apply to every Bob mode in this workspace.

## Project architecture

This is a plain static website. There is no build step, no bundler, and no package manager for
runtime dependencies. Everything runs directly in the browser as classic scripts (not ES modules).

- Source files: `index.html`, `index.js`, `index.css`, `sw.js`, `worker.js`, `src/*.js`
- Tests: `test/*.test.js` using `node:test` and `node:assert` (Node 20+, zero external dependencies)
- Run tests: `npm test` (expands to `node --test test/*.test.js`)

## Hard constraints

1. Do not add any entry to `dependencies` or `devDependencies` in `package.json`.
2. Do not introduce a bundler, transpiler, minifier, or any build tooling.
3. New browser scripts must be classic scripts (no `import`/`export`). Expose browser globals as
   `window.TomodoroXxx = { ... }` and add a CommonJS tail so Node tests can require them:
   `if (typeof module !== "undefined") module.exports = { ... };`
4. Never edit `LICENSE.md` or any upstream screenshot (`*.png`, `screenshot.png`, etc.).
5. Tests live in `test/` and must be named `*.test.js`. Do not change the `npm test` script.

## Code style (match the upstream author)

- Indentation: tabs (not spaces)
- Strings: double quotes
- No trailing semicolons are not required but follow the surrounding file
- Do not reformat lines you are not changing

## Evidence and citations

- Every factual claim about the code must cite `file:line` for a line you actually opened.
- Do not paraphrase a line you have not read. Quote it or mark the claim SUSPECTED / UNVERIFIABLE.
- If a line you read contradicts a claim, retract the claim and show the correcting line.

## Minimal changes

- Make the smallest change that satisfies the requirement.
- Do not refactor surrounding code that is unrelated to the task.
- Do not add error handling for scenarios that cannot occur given the existing code.

## Shell commands

- Run one simple command per execute_command call (e.g. `npm test`). Never combine a pipe (`|`) with `&&`, `||` or `;` in one command: Bob Shell 2.0.6 runs out of memory on that shape on this machine (see docs/BOB-SHELL-NOTES.md). The PreToolUse shell guard blocks it.
- The working directory is already the project root; no `cd`.
