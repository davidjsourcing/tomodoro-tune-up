"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");

// 1. label-title-only: #task-select must have a <label for="task-select">
test("a11y: #task-select has a <label for> element", () => {
	assert.ok(
		/for="task-select"/.test(html),
		"Expected a <label for=\"task-select\"> element in index.html"
	);
});

// 2. page-has-heading-one: exactly one <h1> in the document
test("a11y: page contains exactly one <h1>", () => {
	const matches = html.match(/<h1[\s>]/gi) || [];
	assert.strictEqual(matches.length, 1, "Expected exactly one <h1> element in index.html");
});

// 3. region: top controls wrapped in a <header> that contains #taskswitcher
test("a11y: <header> element contains #taskswitcher", () => {
	// Find the header element and check that taskswitcher is inside it
	// Simple check: <header> must appear before id="taskswitcher" and </header> after
	const headerStart = html.indexOf("<header");
	const headerEnd = html.indexOf("</header>");
	assert.ok(headerStart !== -1, "Expected a <header> element in index.html");
	assert.ok(headerEnd !== -1, "Expected a closing </header> element in index.html");
	const taskSwitcherPos = html.indexOf('id="taskswitcher"');
	assert.ok(
		taskSwitcherPos > headerStart && taskSwitcherPos < headerEnd,
		"Expected #taskswitcher to be inside <header>"
	);
});

// 3. region: #menu has aria-label
test("a11y: #menu panel has aria-label", () => {
	// Find the element with id="menu" and check for aria-label on the same opening tag
	const menuTagMatch = html.match(/<(div|nav|aside|section)[^>]*id="menu"[^>]*>/);
	assert.ok(menuTagMatch, "Expected an element with id=\"menu\" in index.html");
	assert.ok(
		/aria-label=/.test(menuTagMatch[0]),
		"Expected aria-label attribute on the #menu element"
	);
});

// 3. region: #statistics has aria-label
test("a11y: #statistics panel has aria-label", () => {
	const statsTagMatch = html.match(/<(div|nav|aside|section)[^>]*id="statistics"[^>]*>/);
	assert.ok(statsTagMatch, "Expected an element with id=\"statistics\" in index.html");
	assert.ok(
		/aria-label=/.test(statsTagMatch[0]),
		"Expected aria-label attribute on the #statistics element"
	);
});

// 3. region: #managetasks has aria-label
test("a11y: #managetasks panel has aria-label", () => {
	const tasksTagMatch = html.match(/<(div|nav|aside|section)[^>]*id="managetasks"[^>]*>/);
	assert.ok(tasksTagMatch, "Expected an element with id=\"managetasks\" in index.html");
	assert.ok(
		/aria-label=/.test(tasksTagMatch[0]),
		"Expected aria-label attribute on the #managetasks element"
	);
});

// 4. aria-live region exists for round announcements
test("a11y: aria-live polite region exists", () => {
	assert.ok(
		/aria-live="polite"/.test(html),
		"Expected an element with aria-live=\"polite\" in index.html"
	);
});
