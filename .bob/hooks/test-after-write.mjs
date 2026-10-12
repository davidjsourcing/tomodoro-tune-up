import { spawnSync } from "node:child_process";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

const event = JSON.parse(raw);
const writtenPath = String(event.tool_input?.path ?? "");

if (!writtenPath.endsWith(".js")) {
    process.exit(0);
}

const cwd = String(event.cwd ?? process.cwd());

const result = spawnSync("node", ["--test", "test/*.test.js"], {
    shell: true,
    cwd,
    encoding: "utf8",
    timeout: 55000,
});

const output = (result.stdout ?? "") + (result.stderr ?? "");

// Parse the TAP summary line: "# tests N, pass P, fail F"
// Node's test runner emits a line like: "# tests 29, pass 29, fail 0"
// or in newer versions: "# tests: run: 29, passed: 29, failed: 0, cancelled: 0, ..."
let passed = 0;
let failed = 0;

const summaryMatch = output.match(/#\s+tests\s+(\d+),\s*pass\s+(\d+),\s*fail\s+(\d+)/);
if (summaryMatch) {
    passed = parseInt(summaryMatch[2], 10);
    failed = parseInt(summaryMatch[3], 10);
} else {
    // Newer format: "# tests: run: N, passed: P, failed: F"
    const runMatch = output.match(/passed:\s*(\d+)/);
    const failMatch = output.match(/failed:\s*(\d+)/);
    if (runMatch) passed = parseInt(runMatch[1], 10);
    if (failMatch) failed = parseInt(failMatch[1], 10);
}

let summary = "tests: " + passed + " passed, " + failed + " failed";

if (failed > 0) {
    // Extract up to 3 failing test names from "not ok N - <name>" lines
    const notOkLines = output.match(/^not ok \d+ - .+$/gm) ?? [];
    const names = notOkLines
        .slice(0, 3)
        .map(function(line) { return line.replace(/^not ok \d+ - /, ""); });
    if (names.length > 0) {
        summary += "\n  failing: " + names.join(", ");
    }
}

process.stdout.write(summary + "\n");
process.exit(0);
