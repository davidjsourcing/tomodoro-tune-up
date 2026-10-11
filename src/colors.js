(function (root) {
	"use strict";

	/**
	 * Build a mapping of task name -> CSS colour string for a given ordered
	 * list of tasks (typically sorted by time, largest first).
	 *
	 * Colours are deterministic for a given ordered list.  Hues are spread
	 * evenly around the colour wheel using the golden-angle step (~137.5°)
	 * to maximise perceptual distance.  Lightness alternates between two
	 * values so adjacent tasks with similar hues are still visually distinct
	 * on both dark and light themes.
	 *
	 * @param {Array<string>} tasks - Ordered list of task names.
	 * @returns {Object} Map of { taskName: "hsl(...)" }.
	 */
	function taskPalette(tasks) {
		var palette = {};
		if (!tasks || tasks.length === 0) {
			return palette;
		}
		// Golden-angle step in degrees keeps hues maximally spread.
		var GOLDEN_ANGLE = 137.50776405003785;
		// Alternate between two lightness values that look good on both themes.
		var LIGHTNESS = [58, 72];
		var SATURATION = 65;

		for (var i = 0; i < tasks.length; i++) {
			var hue = (i * GOLDEN_ANGLE) % 360;
			var lightness = LIGHTNESS[i % LIGHTNESS.length];
			palette[tasks[i]] = "hsl(" + hue.toFixed(2) + "," + SATURATION + "%," + lightness + "%)";
		}
		return palette;
	}

	/**
	 * Return the CSS colour for a single task within a list of tasks.
	 *
	 * @param {string}        task  - The task name to look up.
	 * @param {Array<string>} tasks - The full ordered list (same as passed to taskPalette).
	 * @returns {string} CSS colour string.
	 */
	function taskColor(task, tasks) {
		return taskPalette(tasks)[task];
	}

	var TomodoroColors = {
		taskPalette: taskPalette,
		taskColor: taskColor,
	};

	// Browser global
	if (typeof root !== "undefined") {
		root.TomodoroColors = TomodoroColors;
	}

	// Node / CommonJS
	if (typeof module !== "undefined") {
		module.exports = TomodoroColors;
	}
}(typeof window !== "undefined" ? window : this));
