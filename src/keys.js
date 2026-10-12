var TomodoroKeys = (function () {
	"use strict";

	var TEXT_INPUT_TYPES = { text: true, search: true, email: true, url: true, number: true, password: true };

	/**
	 * Returns true when el is a target that expects keyboard text input, meaning
	 * the global keydown handler should leave the key alone.
	 *
	 * Covers:
	 *   - INPUT whose type is text-like (text, search, email, url, number, password)
	 *     or whose type is absent / empty (defaults to text)
	 *   - TEXTAREA
	 *   - SELECT
	 *   - Any element with isContentEditable === true
	 *
	 * @param {Element|null|undefined} el
	 * @returns {boolean}
	 */
	function isTypingTarget(el) {
		if (!el) return false;
		var tag = el.tagName;
		if (tag === "TEXTAREA" || tag === "SELECT") return true;
		if (tag === "INPUT") {
			var t = el.type;
			// No type / empty type defaults to "text" in browsers
			if (!t) return true;
			return TEXT_INPUT_TYPES[t.toLowerCase()] === true;
		}
		if (el.isContentEditable === true) return true;
		return false;
	}

	return { isTypingTarget: isTypingTarget };
}());

// Browser global
if (typeof window !== "undefined") {
	window.TomodoroKeys = TomodoroKeys;
}

// Node / CommonJS
if (typeof module !== "undefined") {
	module.exports = { isTypingTarget: TomodoroKeys.isTypingTarget };
}
