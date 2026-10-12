"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { resolveSelectedTask } = require("../src/tasks.js");

describe("resolveSelectedTask", () => {
	it("returns the saved task when it exists in the list", () => {
		const result = resolveSelectedTask(["Default Task", "Calculus", "Chemistry"], "Chemistry");
		assert.equal(result, "Chemistry");
	});

	it("returns the first task when saved task is not in the list", () => {
		const result = resolveSelectedTask(["Default Task", "Calculus"], "Chemistry");
		assert.equal(result, "Default Task");
	});

	it("returns the first task when saved is null", () => {
		const result = resolveSelectedTask(["Default Task"], null);
		assert.equal(result, "Default Task");
	});

	it("returns the first task when saved is empty string", () => {
		const result = resolveSelectedTask(["Default Task", "Calculus"], "");
		assert.equal(result, "Default Task");
	});

	it("returns the first task when saved is undefined", () => {
		const result = resolveSelectedTask(["Default Task"], undefined);
		assert.equal(result, "Default Task");
	});

	it("works with a single-element task list where saved matches", () => {
		const result = resolveSelectedTask(["Only Task"], "Only Task");
		assert.equal(result, "Only Task");
	});

	it("works with a single-element task list where saved does not match", () => {
		const result = resolveSelectedTask(["Only Task"], "Gone Task");
		assert.equal(result, "Only Task");
	});

	it("returns the first task when the task list is empty", () => {
		const result = resolveSelectedTask([], "Chemistry");
		assert.equal(result, "");
	});
});
