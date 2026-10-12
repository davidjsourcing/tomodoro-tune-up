import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { summarizeTap } = require("./summarize.cjs");

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

const event = JSON.parse(raw);
const writtenPath = String(event.tool_input?.path ?? "");

if (!writtenPath.endsWith(".js")) {
    process.exit(0);
}

const cwd = String(event.cwd ?? process.cwd());

const result = spawnSync(
    "node",
    ["--test", "--test-reporter=tap", "test/*.test.js"],
    {
        shell: true,
        cwd,
        encoding: "utf8",
        timeout: 55000,
    }
);

const output = (result.stdout ?? "") + (result.stderr ?? "");

process.stdout.write(summarizeTap(output) + "\n");
process.exit(0);
