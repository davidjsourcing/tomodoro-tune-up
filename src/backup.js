(function (root) {
	"use strict";

	/**
	 * Sanitize a note string: collapse whitespace, trim, cut to maxLen.
	 * Used when TomodoroNotes is not yet loaded (e.g. in Node tests).
	 */
	function _sanitizeNote(s, maxLen) {
		if (typeof s !== "string") return null;
		if (typeof maxLen !== "number") maxLen = 280;
		s = s.replace(/\s+/g, " ").trim();
		if (s.length > maxLen) s = s.slice(0, maxLen);
		return s;
	}

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

			var rec = { t: t, d: d, n: n };
			// Carry optional note field m — sanitize to 280 chars
			var sanitizer = (root && root.TomodoroNotes) ? root.TomodoroNotes.sanitizeNote : _sanitizeNote;
			var rawM = entry.m;
			if (typeof rawM === "string") {
				var cleanM = sanitizer(rawM, 280);
				if (typeof cleanM === "string" && cleanM.length > 0) {
					rec.m = cleanM;
				}
			}
			records.push(rec);

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
