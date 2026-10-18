"use strict";

// Tests that drive the Tune-Up Kit hooks the same way Bob calls them:
// each hook reads a JSON event from stdin and writes to stdout/stderr.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const HOOKS = path.resolve(__dirname, "../.bob/hooks");
const GUARD = path.join(HOOKS, "shell-guard.mjs");
const WRITER = path.join(HOOKS, "test-after-write.mjs");

// ---------------------------------------------------------------------------
// Helper: run a hook with a JSON event on stdin, return {status, stdout, stderr}.
// Strip NODE_TEST_CONTEXT from the child's environment so that any node --test
// process the hook spawns emits its own TAP output rather than piping to the
// parent runner (which would produce empty stdout and break summarizeTap).
// ---------------------------------------------------------------------------
function runHook(hookPath, event) {
	const input = JSON.stringify(event);
	const env = Object.assign({}, process.env);
	delete env.NODE_TEST_CONTEXT;
	const result = spawnSync("node", [hookPath], {
		input,
		encoding: "utf8",
		timeout: 15000,
		env,
	});
	return {
		status: result.status,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
	};
}

// ---------------------------------------------------------------------------
// shell-guard.mjs
// Source: .bob/hooks/shell-guard.mjs lines 14-22
//   if (hasPipe && hasChain) { process.stderr.write("Blocked ..."); process.exit(2); }
//   else process.exit(0);
// ---------------------------------------------------------------------------

test("shell-guard: npm test alone -> allowed (exit 0)", function () {
	const { status, stderr } = runHook(GUARD, {
		tool_name: "execute_command",
		tool_input: { command: "npm test" },
	});
	assert.equal(status, 0, "expected exit 0, stderr: " + stderr);
});

test("shell-guard: pipe+chain combo -> blocked (exit 2)", function () {
	const { status, stderr } = runHook(GUARD, {
		tool_name: "execute_command",
		tool_input: { command: "node --version && npm test 2>&1 | tail -20" },
	});
	assert.equal(status, 2, "expected exit 2 for blocked command");
	// shell-guard.mjs line 16-18: stderr includes "Blocked by the Tune-Up Kit shell guard"
	assert.ok(
		stderr.includes("Blocked by the Tune-Up Kit shell guard"),
		"expected block reason in stderr, got: " + stderr
	);
});

test("shell-guard: non-execute_command tool -> allowed (exit 0)", function () {
	const { status } = runHook(GUARD, {
		tool_name: "write_file",
		tool_input: { path: "foo.js", content: "x" },
	});
	assert.equal(status, 0);
});

// ---------------------------------------------------------------------------
// test-after-write.mjs
// Source: .bob/hooks/test-after-write.mjs
//   line 12-16: exits 0 when path doesn't end in .js
//   line 18: cwd = event.cwd ?? process.cwd()
//   line 33: process.stdout.write(summarizeTap(output) + "\n")
// ---------------------------------------------------------------------------

test("test-after-write: .md path -> prints nothing and exits 0", function () {
	const { status, stdout } = runHook(WRITER, {
		tool_name: "write_file",
		tool_input: { path: "README.md", content: "hello" },
	});
	assert.equal(status, 0);
	assert.equal(stdout.trim(), "", "expected no output for .md file, got: " + stdout);
});

test("test-after-write: .js path in tmp dir -> summary with 2 passed 1 failed", function () {
	// Create a temporary directory with its own test suite so we do NOT point
	// the hook at this repo (which would cause an infinite loop).
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-test-"));

	// Create test/ok.test.js with 2 passing tests
	const testDir = path.join(tmpDir, "test");
	fs.mkdirSync(testDir);

	fs.writeFileSync(
		path.join(testDir, "ok.test.js"),
		[
			'"use strict";',
			'const { test } = require("node:test");',
			'const assert = require("node:assert/strict");',
			'test("pass one", function() { assert.equal(1, 1); });',
			'test("pass two", function() { assert.equal(2, 2); });',
		].join("\n")
	);

	// Create test/bad.test.js with 1 failing test
	fs.writeFileSync(
		path.join(testDir, "bad.test.js"),
		[
			'"use strict";',
			'const { test } = require("node:test");',
			'const assert = require("node:assert/strict");',
			'test("fail one", function() { assert.equal(1, 2); });',
		].join("\n")
	);

	const { status, stdout } = runHook(WRITER, {
		tool_name: "write_file",
		tool_input: { path: "src/something.js", content: "x" },
		cwd: tmpDir,
	});

	// Clean up
	fs.rmSync(tmpDir, { recursive: true, force: true });

	assert.equal(status, 0, "hook itself must exit 0 regardless of test outcome");
	// summarizeTap output: "tests: 2 passed, 1 failed"
	assert.ok(
		stdout.includes("2 passed"),
		"expected '2 passed' in summary, got: " + stdout
	);
	assert.ok(
		stdout.includes("1 failed"),
		"expected '1 failed' in summary, got: " + stdout
	);
});
