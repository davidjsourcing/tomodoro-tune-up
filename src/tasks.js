var TomodoroTasks = (function () {
	/**
	 * Given the current task list and the task name persisted in localStorage,
	 * return the task that should actually be selected.
	 *
	 * Rules:
	 *   - If `saved` is a non-empty string that exists in `tasks`, return it.
	 *   - Otherwise return the first element of `tasks`, or "" when tasks is empty.
	 *
	 * @param {string[]} tasks  - ordered list of task names
	 * @param {string|null|undefined} saved - value from localStorage
	 * @returns {string}
	 */
	function resolveSelectedTask(tasks, saved) {
		if (tasks.length === 0) return "";
		if (saved && tasks.includes(saved)) return saved;
		return tasks[0];
	}

	return { resolveSelectedTask: resolveSelectedTask };
})();

if (typeof module !== "undefined") module.exports = { resolveSelectedTask: TomodoroTasks.resolveSelectedTask };
