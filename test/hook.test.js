"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { summarizeTap } = require("../.bob/hooks/summarize.cjs");

// ---------------------------------------------------------------------------
// TAP format (stable -- what node --test-reporter=tap produces)
// Lines like "# pass 29" / "# fail 0"
// ---------------------------------------------------------------------------

test("summarizeTap: TAP format with 29 pass 0 fail", function () {
	var tap = [
		"TAP version 13",
		"ok 1 - some test",
		"1..29",
		"# tests 29",
		"# suites 0",
		"# pass 29",
		"# fail 0",
		"# cancelled 0",
		"# skipped 0",
		"# todo 0",
		"# duration_ms 153.057193",
	].join("\n");
	assert.equal(summarizeTap(tap), "tests: 29 passed, 0 failed");
});

test("summarizeTap: TAP format with 2 failures includes names", function () {
	var tap = [
		"TAP version 13",
		"ok 1 - passes fine",
		"not ok 2 - alpha fails",
		"not ok 3 - beta fails",
		"1..3",
		"# tests 3",
		"# pass 1",
		"# fail 2",
	].join("\n");
	var result = summarizeTap(tap);
	assert.equal(result, "tests: 1 passed, 2 failed\n  failing: alpha fails, beta fails");
});

test("summarizeTap: TAP format only reports up to 3 failing names", function () {
	var tap = [
		"TAP version 13",
		"not ok 1 - a",
		"not ok 2 - b",
		"not ok 3 - c",
		"not ok 4 - d",
		"1..4",
		"# tests 4",
		"# pass 0",
		"# fail 4",
	].join("\n");
	var result = summarizeTap(tap);
	assert.equal(result, "tests: 0 passed, 4 failed\n  failing: a, b, c");
});

// ---------------------------------------------------------------------------
// Old single-line format: "# tests N, pass P, fail F"
// ---------------------------------------------------------------------------

test("summarizeTap: old single-line comma format", function () {
	var tap = "# tests 5, pass 5, fail 0";
	assert.equal(summarizeTap(tap), "tests: 5 passed, 0 failed");
});

test("summarizeTap: old single-line comma format with failures", function () {
	var tap = [
		"not ok 1 - old format fail",
		"# tests 2, pass 1, fail 1",
	].join("\n");
	var result = summarizeTap(tap);
	assert.equal(result, "tests: 1 passed, 1 failed\n  failing: old format fail");
});

// ---------------------------------------------------------------------------
// ANSI spec-reporter format (what Bob/FORCE_COLOR env produces)
// Lines like "\u001b[34mℹ pass 29\u001b[39m"
// ---------------------------------------------------------------------------

test("summarizeTap: ANSI spec-reporter format 29 pass 0 fail", function () {
	var ansi = [
		"\u001b[34m\u2139 tests 29\u001b[39m",
		"\u001b[34m\u2139 suites 0\u001b[39m",
		"\u001b[34m\u2139 pass 29\u001b[39m",
		"\u001b[34m\u2139 fail 0\u001b[39m",
		"\u001b[34m\u2139 cancelled 0\u001b[39m",
		"\u001b[34m\u2139 skipped 0\u001b[39m",
		"\u001b[34m\u2139 todo 0\u001b[39m",
		"\u001b[34m\u2139 duration_ms 146.23217\u001b[39m",
	].join("\n");
	assert.equal(summarizeTap(ansi), "tests: 29 passed, 0 failed");
});

test("summarizeTap: ANSI spec-reporter format with 2 failures includes names", function () {
	var ansi = [
		"\u001b[32m\u2714 passes fine \u001b[90m(1ms)\u001b[39m\u001b[39m",
		"\u001b[31m\u2716 alpha fails\u001b[39m",
		"\u001b[31m\u2716 beta fails\u001b[39m",
		"\u001b[34m\u2139 tests 3\u001b[39m",
		"\u001b[34m\u2139 pass 1\u001b[39m",
		"\u001b[34m\u2139 fail 2\u001b[39m",
	].join("\n");
	var result = summarizeTap(ansi);
	assert.equal(result, "tests: 1 passed, 2 failed\n  failing: alpha fails, beta fails");
});

test("summarizeTap: ANSI spec-reporter only reports up to 3 failing names", function () {
	var ansi = [
		"\u001b[31m\u2716 a\u001b[39m",
		"\u001b[31m\u2716 b\u001b[39m",
		"\u001b[31m\u2716 c\u001b[39m",
		"\u001b[31m\u2716 d\u001b[39m",
		"\u001b[34m\u2139 tests 4\u001b[39m",
		"\u001b[34m\u2139 pass 0\u001b[39m",
		"\u001b[34m\u2139 fail 4\u001b[39m",
	].join("\n");
	var result = summarizeTap(ansi);
	assert.equal(result, "tests: 0 passed, 4 failed\n  failing: a, b, c");
});

// ---------------------------------------------------------------------------
// Edge case: no summary lines found -> 0 passed 0 failed
// ---------------------------------------------------------------------------

test("summarizeTap: no recognisable summary returns 0 passed 0 failed", function () {
	assert.equal(summarizeTap("nothing to see here"), "tests: 0 passed, 0 failed");
});
