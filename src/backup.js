(function (root) {
	"use strict";

	/**
	 * Normalise a parsed backup JSON value into usable records.
	 *
	 * @param {*} parsed - The value obtained from JSON.parse() on a backup file.
	 * @returns {{ records: Array<{t:number,d:number,n:string}>, tasks: string[], skipped: number }}
	 *   records  – valid entries, deduplicated by d (first occurrence wins), as plain {t,d,n} objects.
	 *   tasks    – unique task names in order of first appearance across the valid entries.
	 *   skipped  – number of entries dropped (invalid shape or duplicate d).
	 * @throws {TypeError} if parsed is not an array.
	 */
	function normalizeBackup(parsed) {
		if (!Array.isArray(parsed)) {
			throw new TypeError(
				"normalizeBackup: expected an array, got " + (parsed === null ? "null" : typeof parsed)
			);
		}

		var records = [];
		var tasks = [];
		var seenD = {};
		var skipped = 0;

		for (var i = 0; i < parsed.length; i++) {
			var entry = parsed[i];

			// Must be a plain object (not null, not array)
			if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
				skipped += 1;
				continue;
			}

			var t = entry.t;
			var d = entry.d;
			var n = entry.n;

			// t must be a finite positive number (minutes)
			if (typeof t !== "number" || !isFinite(t) || t <= 0) {
				skipped += 1;
				continue;
			}

			// d must be a finite number (timestamp)
			if (typeof d !== "number" || !isFinite(d)) {
				skipped += 1;
				continue;
			}

			// n must be a non-empty string
			if (typeof n !== "string" || n.length === 0) {
				skipped += 1;
				continue;
			}

			// deduplicate by d — keep the first occurrence
			if (seenD[d]) {
				skipped += 1;
				continue;
			}
			seenD[d] = true;

			records.push({ t: t, d: d, n: n });

			if (tasks.indexOf(n) === -1) {
				tasks.push(n);
			}
		}

		return { records: records, tasks: tasks, skipped: skipped };
	}

	var TomodoroBackup = { normalizeBackup: normalizeBackup };

	// Browser global
	if (typeof root !== "undefined") {
		root.TomodoroBackup = TomodoroBackup;
	}

	// Node / CommonJS
	if (typeof module !== "undefined") {
		module.exports = TomodoroBackup;
	}
}(typeof window !== "undefined" ? window : this));
