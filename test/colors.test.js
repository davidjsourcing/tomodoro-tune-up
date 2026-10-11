"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { taskPalette, taskColor } = require("../src/colors.js");

// ---------------------------------------------------------------------------
// 1. Determinism: same input -> same output on repeated calls.
// ---------------------------------------------------------------------------
test("taskPalette is deterministic for the same ordered list", function () {
	var tasks = ["Math", "Physics", "Chemistry", "Biology", "History"];
	var p1 = taskPalette(tasks);
	var p2 = taskPalette(tasks);
	tasks.forEach(function (t) {
		assert.equal(p1[t], p2[t], "colour for '" + t + "' must be the same on repeated calls");
	});
});

// ---------------------------------------------------------------------------
// 2. Order matters: re-ordering tasks changes colours.
// ---------------------------------------------------------------------------
test("taskPalette colours depend on position in the list", function () {
	var p1 = taskPalette(["A", "B"]);
	var p2 = taskPalette(["B", "A"]);
	// The colour assigned to "A" at index 0 vs index 1 must differ.
	assert.notEqual(p1["A"], p2["A"], "colour for 'A' must change when its position changes");
});

// ---------------------------------------------------------------------------
// 3. Distinctness: 12 tasks must all receive different colours.
// ---------------------------------------------------------------------------
test("taskPalette returns distinct colours for 12 tasks", function () {
	var tasks = [
		"Math", "Physics", "Chemistry", "Biology",
		"History", "Geography", "English", "French",
		"Music", "Art", "PE", "IT"
	];
	var palette = taskPalette(tasks);
	var colours = tasks.map(function (t) { return palette[t]; });
	var unique = new Set(colours);
	assert.equal(unique.size, tasks.length,
		"all 12 tasks must have unique colours, got " + unique.size + " unique values");
});

// ---------------------------------------------------------------------------
// 4. Valid hsl() output format.
// ---------------------------------------------------------------------------
test("taskPalette returns valid hsl() strings", function () {
	var tasks = ["Alpha", "Beta", "Gamma"];
	var palette = taskPalette(tasks);
	var hslPattern = /^hsl\(\d+(\.\d+)?,\d+%,\d+%\)$/;
	tasks.forEach(function (t) {
		assert.match(palette[t], hslPattern,
			"colour for '" + t + "' must be a valid hsl() string, got: " + palette[t]);
	});
});

// ---------------------------------------------------------------------------
// 5. Empty list returns empty object.
// ---------------------------------------------------------------------------
test("taskPalette returns empty object for empty list", function () {
	assert.deepEqual(taskPalette([]), {});
});

// ---------------------------------------------------------------------------
// 6. Empty list via null/undefined.
// ---------------------------------------------------------------------------
test("taskPalette returns empty object for null/undefined", function () {
	assert.deepEqual(taskPalette(null), {});
	assert.deepEqual(taskPalette(undefined), {});
});

// ---------------------------------------------------------------------------
// 7. Single task returns exactly one entry.
// ---------------------------------------------------------------------------
test("taskPalette returns one entry for a single-task list", function () {
	var palette = taskPalette(["Maths"]);
	var keys = Object.keys(palette);
	assert.equal(keys.length, 1, "must have exactly one entry");
	assert.ok(palette["Maths"], "entry must exist for the task");
	// Must be a non-empty string.
	assert.equal(typeof palette["Maths"], "string");
	assert.ok(palette["Maths"].length > 0);
});

// ---------------------------------------------------------------------------
// 8. taskColor is consistent with taskPalette.
// ---------------------------------------------------------------------------
test("taskColor returns the same value as taskPalette lookup", function () {
	var tasks = ["X", "Y", "Z"];
	var palette = taskPalette(tasks);
	tasks.forEach(function (t) {
		assert.equal(taskColor(t, tasks), palette[t],
			"taskColor must match taskPalette for task '" + t + "'");
	});
});
