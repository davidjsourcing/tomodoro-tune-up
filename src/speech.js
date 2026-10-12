// speech.js — spoken reminders helper for Tomodoro
// Browser global: window.TomodoroSpeech
// CommonJS tail at the bottom for Node tests.

/**
 * shouldSpeak(secondsLeft, totalSecs, intervalMins)
 * Returns true when:
 *   - intervalMins > 0
 *   - 0 < secondsLeft < totalSecs  (not at the very start or very end)
 *   - secondsLeft is an exact multiple of intervalMins * 60
 */
function shouldSpeak(secondsLeft, totalSecs, intervalMins) {
	if (intervalMins <= 0) return false;
	if (secondsLeft <= 0 || secondsLeft >= totalSecs) return false;
	var intervalSecs = intervalMins * 60;
	return secondsLeft % intervalSecs === 0;
}

/**
 * reminderText(secondsLeft, round)
 * round: "focus" | "short" | "long"
 * Returns e.g. "10 minutes left in your focus round"
 *             "1 minute left in your short break"
 */
function reminderText(secondsLeft, round) {
	var mins = Math.floor(secondsLeft / 60);
	var unit = mins === 1 ? "minute" : "minutes";
	var label;
	if (round === "focus") {
		label = "focus round";
	} else if (round === "short") {
		label = "short break";
	} else {
		label = "long break";
	}
	return mins + " " + unit + " left in your " + label;
}

/**
 * shouldAnnounceTransition(opts)
 * opts: { transitionsEnabled, intervalMins, running }
 * Returns true only when:
 *   - transitionsEnabled is true (user opted in)
 *   - intervalMins > 0 (spoken reminders are switched on)
 *   - running is true (the round ended naturally, not a manual skip on a paused timer)
 */
function shouldAnnounceTransition(opts) {
	if (!opts.transitionsEnabled) return false;
	if (opts.intervalMins <= 0) return false;
	if (!opts.running) return false;
	return true;
}

/**
 * transitionText(nextRound)
 * nextRound: "focus" | "short" | "long"
 */
function transitionText(nextRound) {
	if (nextRound === "short") {
		return "Focus round done. Time for a short break.";
	}
	if (nextRound === "long") {
		return "Focus round done. Time for a long break.";
	}
	return "Break's over. Back to focus.";
}

/**
 * speak(text, synth)
 * synth: window.speechSynthesis (or undefined/null when unavailable)
 * Returns false when synth is missing; cancels any queued speech, speaks text, returns true.
 */
function speak(text, synth) {
	if (!synth) return false;
	synth.cancel();
	var utterance = new SpeechSynthesisUtterance(text);
	synth.speak(utterance);
	return true;
}

// Browser global
if (typeof window !== "undefined") {
	window.TomodoroSpeech = { shouldSpeak: shouldSpeak, shouldAnnounceTransition: shouldAnnounceTransition, reminderText: reminderText, transitionText: transitionText, speak: speak };
}

if (typeof module !== "undefined") {
	module.exports = { shouldSpeak: shouldSpeak, shouldAnnounceTransition: shouldAnnounceTransition, reminderText: reminderText, transitionText: transitionText, speak: speak };
}
