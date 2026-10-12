"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { shouldSpeak, shouldAnnounceTransition, reminderText, transitionText, speak } = require("../src/speech.js");

// ---------------------------------------------------------------------------
// shouldSpeak(secondsLeft, totalSecs, intervalMins)
// ---------------------------------------------------------------------------

test("shouldSpeak: returns false when intervalMins is 0 (Off)", function () {
	assert.equal(shouldSpeak(600, 1500, 0), false);
});

test("shouldSpeak: returns false when intervalMins is negative", function () {
	assert.equal(shouldSpeak(600, 1500, -5), false);
});

test("shouldSpeak: returns false when secondsLeft is 0 (boundary)", function () {
	assert.equal(shouldSpeak(0, 1500, 5), false);
});

test("shouldSpeak: returns false when secondsLeft equals totalSecs (start boundary)", function () {
	assert.equal(shouldSpeak(1500, 1500, 5), false);
});

test("shouldSpeak: returns true at exact 5-minute multiple (300 s)", function () {
	assert.equal(shouldSpeak(300, 1500, 5), true);
});

test("shouldSpeak: returns true at exact 10-minute multiple (600 s)", function () {
	assert.equal(shouldSpeak(600, 1500, 10), true);
});

test("shouldSpeak: returns true at exact 1-minute multiple (60 s)", function () {
	assert.equal(shouldSpeak(60, 300, 1), true);
});

test("shouldSpeak: returns true at exact 30-minute multiple (1800 s)", function () {
	assert.equal(shouldSpeak(1800, 3600, 30), true);
});

test("shouldSpeak: returns false when secondsLeft is not a multiple of intervalMins*60", function () {
	assert.equal(shouldSpeak(301, 1500, 5), false);
});

test("shouldSpeak: returns false when secondsLeft is not a multiple (1 min interval, 61 s left)", function () {
	assert.equal(shouldSpeak(61, 300, 1), false);
});

test("shouldSpeak: returns true at multiple exact inner intervals (10-min interval, 600 of 1500)", function () {
	assert.equal(shouldSpeak(600, 1500, 10), true);
});

test("shouldSpeak: returns false at totalSecs itself even if multiple of interval", function () {
	// 1500 is 25*60, and intervalMins=5 -> 300, 1500%300===0 but secondsLeft===totalSecs
	assert.equal(shouldSpeak(1500, 1500, 5), false);
});

// ---------------------------------------------------------------------------
// reminderText(secondsLeft, round)
// ---------------------------------------------------------------------------

test("reminderText: 10 minutes left in focus round", function () {
	assert.equal(reminderText(600, "focus"), "10 minutes left in your focus round");
});

test("reminderText: 5 minutes left in focus round", function () {
	assert.equal(reminderText(300, "focus"), "5 minutes left in your focus round");
});

test("reminderText: 1 minute left uses singular (focus)", function () {
	assert.equal(reminderText(60, "focus"), "1 minute left in your focus round");
});

test("reminderText: 5 minutes left in short break", function () {
	assert.equal(reminderText(300, "short"), "5 minutes left in your short break");
});

test("reminderText: 1 minute left uses singular (short break)", function () {
	assert.equal(reminderText(60, "short"), "1 minute left in your short break");
});

test("reminderText: 10 minutes left in long break", function () {
	assert.equal(reminderText(600, "long"), "10 minutes left in your long break");
});

test("reminderText: 1 minute left uses singular (long break)", function () {
	assert.equal(reminderText(60, "long"), "1 minute left in your long break");
});

test("reminderText: 30 minutes left in focus round", function () {
	assert.equal(reminderText(1800, "focus"), "30 minutes left in your focus round");
});

// ---------------------------------------------------------------------------
// transitionText(nextRound)
// ---------------------------------------------------------------------------

test("transitionText: focus -> short break", function () {
	assert.equal(transitionText("short"), "Focus round done. Time for a short break.");
});

test("transitionText: focus -> long break", function () {
	assert.equal(transitionText("long"), "Focus round done. Time for a long break.");
});

test("transitionText: break -> focus", function () {
	assert.equal(transitionText("focus"), "Break's over. Back to focus.");
});

// ---------------------------------------------------------------------------
// speak(text, synth)
// ---------------------------------------------------------------------------

test("speak: returns false when synth is undefined", function () {
	assert.equal(speak("hello", undefined), false);
});

test("speak: returns false when synth is null", function () {
	assert.equal(speak("hello", null), false);
});

test("speak: returns true with a fake synth, cancels and speaks", function () {
	let cancelled = false;
	let spokenText = null;
	const fakeSynth = {
		cancel: function () { cancelled = true; },
		speak: function (u) { spokenText = u.text; },
	};
	// We need a SpeechSynthesisUtterance constructor to be available.
	// In Node there isn't one, so speech.js must only create it when synth is present.
	// Provide a fake constructor on the global.
	global.SpeechSynthesisUtterance = function (text) { this.text = text; };
	const result = speak("5 minutes left in your focus round", fakeSynth);
	assert.equal(result, true);
	assert.equal(cancelled, true);
	assert.equal(spokenText, "5 minutes left in your focus round");
	delete global.SpeechSynthesisUtterance;
});

test("speak: cancels any queued speech before speaking", function () {
	let cancelCallCount = 0;
	let speakCallCount = 0;
	const fakeSynth = {
		cancel: function () { cancelCallCount++; },
		speak: function () { speakCallCount++; },
	};
	global.SpeechSynthesisUtterance = function (text) { this.text = text; };
	speak("test", fakeSynth);
	assert.equal(cancelCallCount, 1);
	assert.equal(speakCallCount, 1);
	delete global.SpeechSynthesisUtterance;
});

// ---------------------------------------------------------------------------
// shouldAnnounceTransition({ transitionsEnabled, intervalMins, running })
// ---------------------------------------------------------------------------

test("shouldAnnounceTransition: returns true when all conditions met", function () {
	assert.equal(shouldAnnounceTransition({ transitionsEnabled: true, intervalMins: 5, running: true }), true);
});

test("shouldAnnounceTransition: returns false when transitionsEnabled is false", function () {
	assert.equal(shouldAnnounceTransition({ transitionsEnabled: false, intervalMins: 5, running: true }), false);
});

test("shouldAnnounceTransition: returns false when intervalMins is 0 (reminders Off)", function () {
	assert.equal(shouldAnnounceTransition({ transitionsEnabled: true, intervalMins: 0, running: true }), false);
});

test("shouldAnnounceTransition: returns false when intervalMins is negative", function () {
	assert.equal(shouldAnnounceTransition({ transitionsEnabled: true, intervalMins: -1, running: true }), false);
});

test("shouldAnnounceTransition: returns false when running is false (manual skip on paused timer)", function () {
	assert.equal(shouldAnnounceTransition({ transitionsEnabled: true, intervalMins: 5, running: false }), false);
});

test("shouldAnnounceTransition: returns false when all three are false", function () {
	assert.equal(shouldAnnounceTransition({ transitionsEnabled: false, intervalMins: 0, running: false }), false);
});

test("shouldAnnounceTransition: returns false when transitionsEnabled false and running false", function () {
	assert.equal(shouldAnnounceTransition({ transitionsEnabled: false, intervalMins: 5, running: false }), false);
});

test("shouldAnnounceTransition: returns false when transitionsEnabled true, intervalMins 0, running false", function () {
	assert.equal(shouldAnnounceTransition({ transitionsEnabled: true, intervalMins: 0, running: false }), false);
});
