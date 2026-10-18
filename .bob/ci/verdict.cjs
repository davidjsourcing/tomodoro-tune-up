"use strict";

/**
 * finalText(streamJsonl) -> string
 *
 * From a "bob run -f stream-json" event stream (one JSON object per line),
 * join the "content" of assistant "message" events that come AFTER the LAST
 * "tool_use" event.  Blank or non-JSON lines are silently ignored.
 *
 * When there is no tool_use event, all assistant message content is returned.
 */
function finalText(streamJsonl) {
	var lines = streamJsonl.split("\n");
	var events = [];

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		if (!line) continue;
		try {
			events.push(JSON.parse(line));
		} catch (e) {
			// ignore non-JSON lines
		}
	}

	// Find index of last tool_use event
	var lastToolUse = -1;
	for (var j = 0; j < events.length; j++) {
		if (events[j].type === "tool_use") {
			lastToolUse = j;
		}
	}

	// Collect assistant message content after the last tool_use
	var parts = [];
	for (var k = lastToolUse + 1; k < events.length; k++) {
		var ev = events[k];
		if (ev.type === "message" && ev.role === "assistant" && typeof ev.content === "string") {
			parts.push(ev.content);
		}
	}

	return parts.join("");
}

/**
 * tally(text) -> { confirmed, wrong, unverifiable }
 *
 * Count lines whose first word (after optional leading markdown like "| ", "- ",
 * "**") is CONFIRMED, WRONG or UNVERIFIABLE.
 */
function tally(text) {
	var confirmed = 0;
	var wrong = 0;
	var unverifiable = 0;

	var lines = text.split("\n");
	// Strip common markdown lead characters: |, -, *, spaces
	var leadingMd = /^[\|\-\*\s]+/;

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].replace(leadingMd, "");
		if (/^CONFIRMED\b/.test(line)) {
			confirmed++;
		} else if (/^WRONG\b/.test(line)) {
			wrong++;
		} else if (/^UNVERIFIABLE\b/.test(line)) {
			unverifiable++;
		}
	}

	return { confirmed: confirmed, wrong: wrong, unverifiable: unverifiable };
}

/**
 * runStats(streamJsonl) -> { cost, toolCalls }
 *
 * From the final "result" event, extract stats.session_costs and
 * stats.tool_calls.  Returns { cost: null, toolCalls: null } if not found.
 */
function runStats(streamJsonl) {
	var lines = streamJsonl.split("\n");
	var cost = null;
	var toolCalls = null;

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		if (!line) continue;
		try {
			var ev = JSON.parse(line);
			if (ev.type === "result" && ev.stats) {
				if (ev.stats.session_costs != null) cost = ev.stats.session_costs;
				if (ev.stats.tool_calls != null) toolCalls = ev.stats.tool_calls;
			}
		} catch (e) {
			// ignore non-JSON lines
		}
	}

	return { cost: cost, toolCalls: toolCalls };
}

// ---------------------------------------------------------------------------
// CLI: node .bob/ci/verdict.cjs <stream.jsonl>
// Prints a markdown report to stdout. Exit 0 always (audit informs, not blocks).
// ---------------------------------------------------------------------------
if (require.main === module) {
	var fs = require("node:fs");
	var filePath = process.argv[2];
	var streamJsonl = filePath ? fs.readFileSync(filePath, "utf8") : "";

	var text = finalText(streamJsonl);
	var t = tally(text);
	var stats = runStats(streamJsonl);

	var costStr = stats.cost != null ? stats.cost.toFixed(2) + " Bobcoins" : "n/a";
	var toolCallsStr = stats.toolCalls != null ? String(stats.toolCalls) : "n/a";

	var report = [
		"## Claim Checker Report",
		"",
		"| Verdict | Count |",
		"| --- | --- |",
		"| CONFIRMED | " + t.confirmed + " |",
		"| WRONG | " + t.wrong + " |",
		"| UNVERIFIABLE | " + t.unverifiable + " |",
		"",
		"**Cost:** " + costStr + "  |  **Tool calls:** " + toolCallsStr,
		"",
		"### Bob's verdict",
		"",
		text,
	].join("\n");

	process.stdout.write(report + "\n");
	process.exit(0);
}

module.exports = { finalText, tally, runStats };
