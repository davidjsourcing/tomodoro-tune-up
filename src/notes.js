(function (root) {
	"use strict";

	/**
	 * Sanitize a free-text note.
	 *
	 * @param {*}      raw    - Raw value (expected string).
	 * @param {number} maxLen - Maximum length (default 280).
	 * @returns {string} Trimmed, newlines collapsed to spaces, truncated to maxLen.
	 */
	function sanitizeNote(raw, maxLen) {
		if (typeof raw !== "string") return "";
		if (typeof maxLen !== "number") maxLen = 280;
		// Collapse all whitespace runs (including newlines) to a single space, then trim
		var s = raw.replace(/\s+/g, " ").trim();
		if (s.length > maxLen) s = s.slice(0, maxLen);
		return s;
	}

	/**
	 * Extract the note string from a record, guarding absent/non-string m.
	 *
	 * @param {object} record
	 * @returns {string}
	 */
	function noteFromRecord(record) {
		if (record && typeof record.m === "string" && record.m.length > 0) {
			return record.m;
		}
		return "";
	}

	/**
	 * Return a NEW record with m set to the sanitized note, or m removed when the
	 * sanitized note is empty. Never mutates the input.
	 *
	 * @param {object} record
	 * @param {string} note
	 * @returns {object}
	 */
	function withNote(record, note) {
		var sanitized = sanitizeNote(note);
		var copy = {};
		var keys = Object.keys(record);
		for (var i = 0; i < keys.length; i++) {
			if (keys[i] !== "m") {
				copy[keys[i]] = record[keys[i]];
			}
		}
		if (sanitized.length > 0) {
			copy.m = sanitized;
		}
		return copy;
	}

	var TomodoroNotes = { sanitizeNote: sanitizeNote, noteFromRecord: noteFromRecord, withNote: withNote };

	// Browser global
	if (typeof root !== "undefined") {
		root.TomodoroNotes = TomodoroNotes;
	}

	// Node / CommonJS
	if (typeof module !== "undefined") {
		module.exports = TomodoroNotes;
	}
}(typeof window !== "undefined" ? window : this));
