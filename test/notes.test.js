"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeNote, noteFromRecord, withNote } = require("../src/notes.js");

// ---------------------------------------------------------------------------
// sanitizeNote
// ---------------------------------------------------------------------------

test("sanitizeNote: returns trimmed string", function () {
	assert.equal(sanitizeNote("  hello  "), "hello");
});

test("sanitizeNote: collapses internal runs of whitespace (spaces/tabs) to single space", function () {
	assert.equal(sanitizeNote("foo   bar\t\tbaz"), "foo bar baz");
});

test("sanitizeNote: collapses newlines to single spaces", function () {
	assert.equal(sanitizeNote("line1\nline2\r\nline3"), "line1 line2 line3");
});

test("sanitizeNote: collapses mixed whitespace runs with newlines", function () {
	assert.equal(sanitizeNote("hello\n  \nworld"), "hello world");
});

test("sanitizeNote: truncates to maxLen (default 280)", function () {
	var long = "a".repeat(300);
	var result = sanitizeNote(long);
	assert.equal(result.length, 280);
});

test("sanitizeNote: truncates to custom maxLen", function () {
	var result = sanitizeNote("hello world", 5);
	assert.equal(result, "hello");
});

test("sanitizeNote: empty string returns empty string", function () {
	assert.equal(sanitizeNote(""), "");
});

test("sanitizeNote: whitespace-only string returns empty string", function () {
	assert.equal(sanitizeNote("   \n\t  "), "");
});

test("sanitizeNote: non-string input returns empty string", function () {
	assert.equal(sanitizeNote(null), "");
	assert.equal(sanitizeNote(undefined), "");
	assert.equal(sanitizeNote(42), "");
	assert.equal(sanitizeNote({}), "");
});

test("sanitizeNote: exactly maxLen chars is not truncated", function () {
	var s = "a".repeat(280);
	assert.equal(sanitizeNote(s).length, 280);
});

test("sanitizeNote: one char over maxLen is cut to maxLen", function () {
	var s = "a".repeat(281);
	assert.equal(sanitizeNote(s).length, 280);
});

// ---------------------------------------------------------------------------
// noteFromRecord
// ---------------------------------------------------------------------------

test("noteFromRecord: returns m when present and a string", function () {
	assert.equal(noteFromRecord({ t: 25, d: 1000, n: "Work", m: "hello" }), "hello");
});

test("noteFromRecord: returns empty string when m is absent", function () {
	assert.equal(noteFromRecord({ t: 25, d: 1000, n: "Work" }), "");
});

test("noteFromRecord: returns empty string when m is not a string (number)", function () {
	assert.equal(noteFromRecord({ t: 25, d: 1000, n: "Work", m: 42 }), "");
});

test("noteFromRecord: returns empty string when m is null", function () {
	assert.equal(noteFromRecord({ t: 25, d: 1000, n: "Work", m: null }), "");
});

test("noteFromRecord: returns empty string when m is empty string", function () {
	assert.equal(noteFromRecord({ t: 25, d: 1000, n: "Work", m: "" }), "");
});

// ---------------------------------------------------------------------------
// withNote
// ---------------------------------------------------------------------------

test("withNote: returns a new object with m set when note is non-empty", function () {
	var record = { t: 25, d: 1000, n: "Work" };
	var result = withNote(record, "studying");
	assert.equal(result.m, "studying");
	assert.equal(result.t, 25);
	assert.equal(result.d, 1000);
	assert.equal(result.n, "Work");
});

test("withNote: sanitizes the note before setting m", function () {
	var record = { t: 25, d: 1000, n: "Work" };
	var result = withNote(record, "  hello  world  ");
	assert.equal(result.m, "hello world");
});

test("withNote: removes m when sanitized note is empty", function () {
	var record = { t: 25, d: 1000, n: "Work", m: "old note" };
	var result = withNote(record, "   ");
	assert.equal("m" in result, false);
});

test("withNote: does not mutate the input record (adding m)", function () {
	var record = { t: 25, d: 1000, n: "Work" };
	withNote(record, "note");
	assert.equal("m" in record, false);
});

test("withNote: does not mutate the input record (removing m)", function () {
	var record = { t: 25, d: 1000, n: "Work", m: "old" };
	withNote(record, "");
	assert.equal(record.m, "old");
});

test("withNote: does not mutate the input record (updating m)", function () {
	var record = { t: 25, d: 1000, n: "Work", m: "old" };
	withNote(record, "new");
	assert.equal(record.m, "old");
});

test("withNote: truncates note to 280 chars", function () {
	var record = { t: 25, d: 1000, n: "Work" };
	var result = withNote(record, "a".repeat(300));
	assert.equal(result.m.length, 280);
});
