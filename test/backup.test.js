"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeBackup } = require("../src/backup.js");

// ---------------------------------------------------------------------------
// 1. Valid input passes through intact
// ---------------------------------------------------------------------------
test("normalizeBackup: valid entries are returned as plain {t,d,n} objects", function () {
	var input = [
		{ t: 25, d: 1000, n: "Work" },
		{ t: 5,  d: 2000, n: "Reading" }
	];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 2);
	assert.deepEqual(result.records[0], { t: 25, d: 1000, n: "Work" });
	assert.deepEqual(result.records[1], { t: 5,  d: 2000, n: "Reading" });
	assert.equal(result.skipped, 0);
});

// ---------------------------------------------------------------------------
// 2. Invalid entries are skipped and counted
// ---------------------------------------------------------------------------
test("normalizeBackup: entries missing or invalid t are skipped", function () {
	var input = [
		{ t: 0,        d: 1000, n: "Task" },   // t <= 0
		{ t: -1,       d: 2000, n: "Task" },   // t negative
		{ t: Infinity, d: 3000, n: "Task" },   // t not finite
		{ t: "25",     d: 4000, n: "Task" },   // t is string
		{ t: 25,       d: 5000, n: "Task" }    // valid
	];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 1);
	assert.equal(result.skipped, 4);
});

test("normalizeBackup: entries missing or invalid d are skipped", function () {
	var input = [
		{ t: 25, d: NaN,       n: "Task" },   // d is NaN
		{ t: 25, d: Infinity,  n: "Task" },   // d not finite
		{ t: 25, d: "1000",    n: "Task" },   // d is string
		{ t: 25, d: 1000,      n: "Task" }    // valid
	];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 1);
	assert.equal(result.skipped, 3);
});

test("normalizeBackup: entries missing or invalid n are skipped", function () {
	var input = [
		{ t: 25, d: 1000, n: ""    },   // empty string
		{ t: 25, d: 2000, n: 42   },   // number
		{ t: 25, d: 3000, n: null },   // null
		{ t: 25, d: 4000, n: "OK" }    // valid
	];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 1);
	assert.equal(result.skipped, 3);
});

test("normalizeBackup: non-object entries are skipped", function () {
	var input = [
		null,
		42,
		"string",
		[1, 2, 3],
		{ t: 10, d: 1000, n: "Valid" }
	];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 1);
	assert.equal(result.skipped, 4);
});

// ---------------------------------------------------------------------------
// 3. Duplicates by d are collapsed (first wins)
// ---------------------------------------------------------------------------
test("normalizeBackup: duplicate d values keep only the first occurrence", function () {
	var input = [
		{ t: 25, d: 1000, n: "First"  },
		{ t: 10, d: 1000, n: "Second" },  // duplicate d
		{ t: 15, d: 2000, n: "Third"  }
	];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 2);
	assert.equal(result.records[0].n, "First");   // first kept
	assert.equal(result.records[1].n, "Third");
	assert.equal(result.skipped, 1);
});

test("normalizeBackup: multiple duplicates are all counted as skipped", function () {
	var input = [
		{ t: 5, d: 999, n: "A" },
		{ t: 5, d: 999, n: "A" },
		{ t: 5, d: 999, n: "A" }
	];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 1);
	assert.equal(result.skipped, 2);
});

// ---------------------------------------------------------------------------
// 4. tasks are unique and ordered by first appearance
// ---------------------------------------------------------------------------
test("normalizeBackup: tasks list contains unique names in order of first appearance", function () {
	var input = [
		{ t: 25, d: 1000, n: "Bravo"  },
		{ t: 25, d: 2000, n: "Alpha"  },
		{ t: 25, d: 3000, n: "Bravo"  },  // duplicate name (different d)
		{ t: 25, d: 4000, n: "Charlie" }
	];
	var result = normalizeBackup(input);
	assert.deepEqual(result.tasks, ["Bravo", "Alpha", "Charlie"]);
});

test("normalizeBackup: tasks list is empty when all entries are invalid", function () {
	var input = [
		{ t: -1, d: 1000, n: "Task" }
	];
	var result = normalizeBackup(input);
	assert.deepEqual(result.tasks, []);
});

// ---------------------------------------------------------------------------
// 5. Non-array input throws TypeError
// ---------------------------------------------------------------------------
test("normalizeBackup: throws TypeError for null", function () {
	assert.throws(
		function () { normalizeBackup(null); },
		function (err) {
			return err instanceof TypeError && /null/.test(err.message);
		}
	);
});

test("normalizeBackup: throws TypeError for object", function () {
	assert.throws(
		function () { normalizeBackup({}); },
		function (err) {
			return err instanceof TypeError && /object/.test(err.message);
		}
	);
});

test("normalizeBackup: throws TypeError for string", function () {
	assert.throws(
		function () { normalizeBackup("[]"); },
		function (err) {
			return err instanceof TypeError && /string/.test(err.message);
		}
	);
});

test("normalizeBackup: throws TypeError for number", function () {
	assert.throws(
		function () { normalizeBackup(42); },
		function (err) {
			return err instanceof TypeError && /number/.test(err.message);
		}
	);
});

test("normalizeBackup: throws TypeError for undefined", function () {
	assert.throws(
		function () { normalizeBackup(undefined); },
		TypeError
	);
});

// ---------------------------------------------------------------------------
// 6. Empty array is valid — returns empty results
// ---------------------------------------------------------------------------
test("normalizeBackup: empty array returns empty records and tasks with 0 skipped", function () {
	var result = normalizeBackup([]);
	assert.deepEqual(result.records, []);
	assert.deepEqual(result.tasks, []);
	assert.equal(result.skipped, 0);
});

// ---------------------------------------------------------------------------
// 7. Optional note field m
// ---------------------------------------------------------------------------
test("normalizeBackup: m string is kept on records that have it", function () {
	var input = [{ t: 25, d: 1000, n: "Work", m: "deep focus" }];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 1);
	assert.equal(result.records[0].m, "deep focus");
});

test("normalizeBackup: m is absent when entry has no m field", function () {
	var input = [{ t: 25, d: 1000, n: "Work" }];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 1);
	assert.equal("m" in result.records[0], false);
});

test("normalizeBackup: non-string m is dropped (not propagated)", function () {
	var input = [{ t: 25, d: 1000, n: "Work", m: 42 }];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 1);
	assert.equal("m" in result.records[0], false);
});

test("normalizeBackup: m too long is cut to 280 chars", function () {
	var input = [{ t: 25, d: 1000, n: "Work", m: "x".repeat(300) }];
	var result = normalizeBackup(input);
	assert.equal(result.records.length, 1);
	assert.equal(result.records[0].m.length, 280);
});
