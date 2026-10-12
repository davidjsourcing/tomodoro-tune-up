---
name: issue-to-fix
description: >-
  Use when the user asks to work on a GitHub issue, a bug report, or a feature
  request. Guides through restate -> locate -> decide -> test-first -> implement
  -> verify -> document.
---

# Issue to Fix

Follow these steps in order. Do not skip a step.

## Step 1 - Restate the issue

Write one sentence that captures the bug or request in plain terms.
Example: "The statistics view silently drops records for two or more tasks
because getRecords() resolves on the last request to start, not the last to
finish."

## Step 2 - Locate the code

Use `grep` and `read_file` to find every line relevant to the issue.
Cite each one as `file:line`. Quote the exact line.
Do not stop at the first hit; trace the full call path.

## Step 3 - Classify

State one of:
- BUG: the existing code produces an incorrect or harmful result.
- FEATURE: the code is correct but lacks requested behaviour.
- UNCLEAR: you need more information (say exactly what).

If UNCLEAR, stop here and ask.

## Step 4 - Write the failing test first

Before changing any source file:

1. Open the relevant test file (or decide which new file to create in `test/`).
2. Write a test using `node:test` and `node:assert` that fails on the current code
   and will pass only after the fix.
   - For a BUG: the test must demonstrate the incorrect behaviour.
   - For a FEATURE: the test must assert the new behaviour.
3. Run `npm test` with `execute_command`. Paste the failure output.
   Do not proceed until you see a real failure for your new test.

## Step 5 - Implement the fix

Make the minimal code change that makes the new test pass.
Constraints (from house rules):
- No new dependencies.
- No build tooling.
- New browser scripts: `window.TomodoroXxx = {...}` + CommonJS tail.
- Never edit `LICENSE.md` or upstream screenshots.
- Match the upstream code style: tabs, double quotes.
- Cite every changed line as `file:line`.

## Step 6 - Run npm test

Run `npm test`. Every test must be green.
If any test is red, fix it before continuing.
Paste the summary line showing passed/failed counts.

## Step 7 - Update README

Open `README.md` and add exactly one bullet to the "What was added or fixed"
list (or create that section if it does not exist) in the format:
  - Fixed #<issue-number>: <one sentence describing the change> (file:line)

Do not rewrite other sections.

## Step 8 - Report what is not done

List any part of the issue that you did not implement, and why.
If nothing was left out, write "Nothing left undone."
