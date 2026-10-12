"use strict";

// Strip ANSI escape codes so the same function handles both TAP and the
// spec-reporter output that Node emits when FORCE_COLOR is set.
function stripAnsi(str) {
	// eslint-disable-next-line no-control-regex
	return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Parse the output of `node --test` (TAP reporter, spec reporter, or the
 * old single-line comma format) and return a one-line summary string.
 *
 * @param {string} output  Combined stdout+stderr from the test run
 * @returns {string}       e.g. "tests: 29 passed, 0 failed"
 *                         or   "tests: 1 passed, 2 failed\n  failing: a, b"
 */
function summarizeTap(output) {
	var clean = stripAnsi(output);

	var passed = 0;
	var failed = 0;

	// Format 1 (old single-line): "# tests N, pass P, fail F"
	var commaMatch = clean.match(/#\s+tests\s+\d+,\s*pass\s+(\d+),\s*fail\s+(\d+)/);
	if (commaMatch) {
		passed = parseInt(commaMatch[1], 10);
		failed = parseInt(commaMatch[2], 10);
	} else {
		// Format 2 (TAP multi-line): "# pass N" / "# fail N"
		// Format 3 (spec-reporter after strip): "ℹ pass N" / "ℹ fail N"
		var passMatch = clean.match(/(?:#|ℹ)\s+pass\s+(\d+)/);
		var failMatch = clean.match(/(?:#|ℹ)\s+fail\s+(\d+)/);
		if (passMatch) passed = parseInt(passMatch[1], 10);
		if (failMatch) failed = parseInt(failMatch[1], 10);
	}

	var summary = "tests: " + passed + " passed, " + failed + " failed";

	if (failed > 0) {
		// TAP failures: "not ok N - name"
		var notOkLines = clean.match(/^not ok \d+ - .+$/gm) ?? [];
		var names = notOkLines
			.slice(0, 3)
			.map(function (line) { return line.replace(/^not ok \d+ - /, ""); });

		// Spec-reporter failures: lines starting with "✖ name" (after ANSI strip)
		if (names.length === 0) {
			var failLines = clean.match(/^✖ .+$/gm) ?? [];
			names = failLines
				.slice(0, 3)
				.map(function (line) { return line.replace(/^✖\s+/, "").replace(/\s*\(.*$/, "").trimEnd(); });
		}

		if (names.length > 0) {
			summary += "\n  failing: " + names.join(", ");
		}
	}

	return summary;
}

module.exports = { summarizeTap };
