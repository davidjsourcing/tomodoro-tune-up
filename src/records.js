(function (root) {
	"use strict";

	// Provide a minimal IDBKeyRange stub when running outside a browser (e.g. Node tests).
	var KeyRange = (typeof IDBKeyRange !== "undefined")
		? IDBKeyRange
		: { only: function (v) { return v; } };

	/**
	 * Collect all IndexedDB records for the given tasks from the given object store.
	 *
	 * @param {Object} store  - An IDBObjectStore (or compatible fake) that exposes
	 *                          index(name).getAll(keyRange) returning a request object
	 *                          with .onsuccess, .onerror, and .result.
	 * @param {Array}  tasks  - Array of task key values to query.
	 * @returns {Promise<Array>} Resolves with the concatenation of all records across
	 *                           all tasks, regardless of the order requests complete.
	 *                           Resolves [] when tasks is empty.
	 *                           Rejects if any single request fires onerror.
	 */
	function collectTaskRecords(store, tasks) {
		return new Promise(function (resolve, reject) {
			if (!tasks || tasks.length === 0) {
				resolve([]);
				return;
			}

			var results = new Array(tasks.length);
			var completed = 0;

			tasks.forEach(function (task, i) {
				var req = store.index("task").getAll(KeyRange.only(task));
				req.onsuccess = function () {
					results[i] = req.result;
					completed += 1;
					if (completed === tasks.length) {
						// Flatten in original task order, independent of completion order.
						var all = [];
						for (var j = 0; j < results.length; j++) {
							all.push.apply(all, results[j]);
						}
						resolve(all);
					}
				};
				req.onerror = function () {
					reject(req.error);
				};
			});
		});
	}

	var TomodoroRecords = { collectTaskRecords: collectTaskRecords };

	// Browser global
	if (typeof root !== "undefined") {
		root.TomodoroRecords = TomodoroRecords;
	}

	// Node / CommonJS
	if (typeof module !== "undefined") {
		module.exports = TomodoroRecords;
	}
}(typeof window !== "undefined" ? window : this));
