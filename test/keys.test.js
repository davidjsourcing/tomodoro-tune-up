"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { isTypingTarget } = require("../src/keys.js");

describe("isTypingTarget", () => {
	// Text-like INPUT types → true
	it("returns true for INPUT type=text", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "text" }), true);
	});
	it("returns true for INPUT type=search", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "search" }), true);
	});
	it("returns true for INPUT type=email", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "email" }), true);
	});
	it("returns true for INPUT type=url", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "url" }), true);
	});
	it("returns true for INPUT type=number", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "number" }), true);
	});
	it("returns true for INPUT type=password", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "password" }), true);
	});
	it("returns true for INPUT with missing type", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT" }), true);
	});
	it("returns true for INPUT with empty type", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "" }), true);
	});

	// Non-text INPUT types → false
	it("returns false for INPUT type=checkbox", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "checkbox" }), false);
	});
	it("returns false for INPUT type=radio", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "radio" }), false);
	});
	it("returns false for INPUT type=button", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "button" }), false);
	});
	it("returns false for INPUT type=submit", () => {
		assert.equal(isTypingTarget({ tagName: "INPUT", type: "submit" }), false);
	});

	// TEXTAREA and SELECT → true
	it("returns true for TEXTAREA", () => {
		assert.equal(isTypingTarget({ tagName: "TEXTAREA" }), true);
	});
	it("returns true for SELECT", () => {
		assert.equal(isTypingTarget({ tagName: "SELECT" }), true);
	});

	// contenteditable → true
	it("returns true for element with isContentEditable=true", () => {
		assert.equal(isTypingTarget({ tagName: "DIV", isContentEditable: true }), true);
	});
	it("returns false for element with isContentEditable=false", () => {
		assert.equal(isTypingTarget({ tagName: "DIV", isContentEditable: false }), false);
	});

	// BUTTON → false
	it("returns false for BUTTON", () => {
		assert.equal(isTypingTarget({ tagName: "BUTTON" }), false);
	});

	// null / undefined → false
	it("returns false for null", () => {
		assert.equal(isTypingTarget(null), false);
	});
	it("returns false for undefined", () => {
		assert.equal(isTypingTarget(undefined), false);
	});
});
