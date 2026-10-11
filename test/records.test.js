"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { collectTaskRecords } = require("../src/records.js");

// ---------------------------------------------------------------------------
// Fake store builder
//
// fakeData: { [taskName]: Array<record> }
// delays:   { [taskName]: milliseconds } — controls when onsuccess fires,
//           letting us simulate out-of-order completion.
// ---------------------------------------------------------------------------
function makeFakeStore(fakeData, delays) {
	delays = delays || {};
	return {
		index: function (name) {
			return {
				getAll: function (keyRange) {
					// keyRange is just the task value (our stub passes through the value).
					var task = keyRange;
					var records = (fakeData[task] || []).slice();
					var req = { result: null, onsuccess: null, onerror: null };
					var delay = delays[task] !== undefined ? delays[task] : 0;
					setTimeout(function () {
						req.result = records;
						if (req.onsuccess) req.onsuccess();
					}, delay);
					return req;
				}
			};
		}
	};
}

// ---------------------------------------------------------------------------
// Inline re-implementation of the ORIGINAL buggy strategy.
// Resolves when the callback for the LAST task in the array fires (by index),
// not when all requests have completed.
// ---------------------------------------------------------------------------
function buggyCollect(store, tasks) {
	return new Promise(function (resolve) {
		if (!tasks || tasks.length === 0) {
			resolve([]);
			return;
		}
		var result = [];
		tasks.forEach(function (task, i) {
			var req = store.index("task").getAll(task); // key range value passed directly
			req.onsuccess = function () {
				result.push.apply(result, req.result);
				// BUG: resolves when the callback for the LAST index fires,
				// regardless of whether all other callbacks have already fired.
				if (i === tasks.length - 1) {
					resolve(result);
				}
			};
		});
	});
}

// ---------------------------------------------------------------------------
// Test data: three tasks, each with 2 records
// ---------------------------------------------------------------------------
var DATA = {
	alpha: [{ task: "alpha", duration: 10 }, { task: "alpha", duration: 20 }],
	beta:  [{ task: "beta",  duration: 30 }, { task: "beta",  duration: 40 }],
	gamma: [{ task: "gamma", duration: 50 }, { task: "gamma", duration: 60 }]
};
var ALL_TASKS = ["alpha", "beta", "gamma"];

// ---------------------------------------------------------------------------
// 1. Demonstrate the bug: buggyCollect drops records when the last task in
//    the array finishes FIRST (shortest delay) and the other tasks are still
//    in-flight.
// ---------------------------------------------------------------------------
test("buggyCollect drops records when requests complete out of order", function (t, done) {
	// alpha → 50 ms, beta → 10 ms, gamma → 0 ms
	// Task order: ["alpha", "beta", "gamma"]
	// "gamma" is last (index 2) and has delay 0 — its onsuccess fires before
	// alpha and beta complete, so buggyCollect resolves with only gamma's records.
	var delays = { alpha: 50, beta: 10, gamma: 0 };
	var store = makeFakeStore(DATA, delays);
	buggyCollect(store, ALL_TASKS).then(function (records) {
		// Should contain all 6 records but the bug causes it to miss alpha & beta.
		assert.ok(
			records.length < 6,
			"buggyCollect should return fewer than all 6 records due to the race bug, got " + records.length
		);
		done();
	}).catch(done);
});

// ---------------------------------------------------------------------------
// 2. collectTaskRecords returns every record regardless of completion order.
// ---------------------------------------------------------------------------
test("collectTaskRecords returns all records when requests complete out of order", function (t, done) {
	// Same delays: last task (gamma, index 2) finishes first.
	var delays = { alpha: 50, beta: 10, gamma: 0 };
	var store = makeFakeStore(DATA, delays);
	collectTaskRecords(store, ALL_TASKS).then(function (records) {
		assert.equal(records.length, 6, "should return all 6 records");
		// Verify each task's records are present
		var alphaCount = records.filter(function (r) { return r.task === "alpha"; }).length;
		var betaCount  = records.filter(function (r) { return r.task === "beta";  }).length;
		var gammaCount = records.filter(function (r) { return r.task === "gamma"; }).length;
		assert.equal(alphaCount, 2);
		assert.equal(betaCount,  2);
		assert.equal(gammaCount, 2);
		done();
	}).catch(done);
});

// ---------------------------------------------------------------------------
// 3. Handles empty tasks array — resolves immediately with [].
// ---------------------------------------------------------------------------
test("collectTaskRecords resolves with [] when tasks is empty", function (t, done) {
	var store = makeFakeStore({}, {});
	collectTaskRecords(store, []).then(function (records) {
		assert.deepEqual(records, []);
		done();
	}).catch(done);
});

// ---------------------------------------------------------------------------
// 4. Rejects when any request fires onerror.
// ---------------------------------------------------------------------------
test("collectTaskRecords rejects when a request errors", function (t, done) {
	var errorStore = {
		index: function () {
			return {
				getAll: function () {
					var req = { result: null, onsuccess: null, onerror: null, error: new Error("IDB failure") };
					setTimeout(function () {
						if (req.onerror) req.onerror();
					}, 0);
					return req;
				}
			};
		}
	};
	collectTaskRecords(errorStore, ["any-task"]).then(function () {
		done(new Error("Promise should have rejected"));
	}).catch(function (err) {
		assert.ok(err instanceof Error, "rejection value should be an Error");
		assert.equal(err.message, "IDB failure");
		done();
	});
});

// ---------------------------------------------------------------------------
// 5. Handles null and undefined as the tasks argument — resolves with [].
// ---------------------------------------------------------------------------
test("collectTaskRecords resolves with [] when tasks is null", function (t, done) {
	var store = makeFakeStore({}, {});
	collectTaskRecords(store, null).then(function (records) {
		assert.deepEqual(records, []);
		done();
	}).catch(done);
});

test("collectTaskRecords resolves with [] when tasks is undefined", function (t, done) {
	var store = makeFakeStore({}, {});
	collectTaskRecords(store, undefined).then(function (records) {
		assert.deepEqual(records, []);
		done();
	}).catch(done);
});
