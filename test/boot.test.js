"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Parse the local <script src> tags from index.html in document order
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");

function extractScripts(html) {
	const re = /<script\s+src="\.\/([^"]+)"/g;
	const scripts = [];
	let m;
	while ((m = re.exec(html)) !== null) {
		scripts.push(m[1]);
	}
	return scripts;
}

const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scriptPaths = extractScripts(indexHtml); // e.g. ["src/records.js", ..., "index.js"]

// ---------------------------------------------------------------------------
// Recursive Proxy stub: any property access returns a callable proxy.
// ---------------------------------------------------------------------------

function makeStub(name) {
	const stub = new Proxy(function () { return makeStub(name + "()"); }, {
		get(target, prop) {
			if (prop === Symbol.toPrimitive || prop === "valueOf") return () => 0;
			if (prop === "toString") return () => "";
			if (prop === "then") return undefined; // not a thenable
			if (prop === "length" || prop === "size") return 0;
			if (prop === "checked") return false;
			if (prop === "result") return [];
			return makeStub(name + "." + String(prop));
		},
		set() { return true; },
		has() { return false; },
	});
	return stub;
}

// ---------------------------------------------------------------------------
// Build a real in-memory localStorage
// ---------------------------------------------------------------------------

function makeLocalStorage(seed) {
	const store = Object.assign({}, seed);
	return {
		getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
		setItem(k, v) { store[k] = String(v); },
		removeItem(k) { delete store[k]; },
		clear() { Object.keys(store).forEach((k) => delete store[k]); },
		key(i) { return Object.keys(store)[i] ?? null; },
		get length() { return Object.keys(store).length; },
	};
}

// ---------------------------------------------------------------------------
// Build a minimal browser-like sandbox context
// ---------------------------------------------------------------------------

function makeContext(localStorageSeed) {
	// Real IDB-like stub: open() returns a fake request that fires onsuccess
	const fakeIDB = {
		open() {
			const req = {
				result: {
					transaction() {
						return {
							objectStore() {
								return {
									createIndex() { return {}; },
									index() { return { getAll() { return { onsuccess: null }; }, openCursor() { return {}; } }; },
									add() { return { onsuccess: null }; },
									get() { return { onsuccess: null }; },
									put() { return {}; },
									delete() { return {}; },
									getAll() { return { onsuccess: null, result: [] }; },
								};
							},
							oncomplete: null,
							onerror: null,
						};
					},
					createObjectStore() {
						const store = {
							createIndex() { return {}; },
							transaction: { oncomplete: null },
						};
						return store;
					},
				},
				onupgradeneeded: null,
				onsuccess: null,
				onerror: null,
			};
			// Simulate async onsuccess via setImmediate – but we just fire it synchronously
			// (the scripts only assign the handlers; they don't await the result at top level)
			return req;
		},
	};

	const fakeSpeechSynthesis = {
		cancel() {},
		speak() {},
	};

	const ctx = {
		// Timers — do not run
		setTimeout() { return 0; },
		clearTimeout() {},
		setInterval() { return 0; },
		clearInterval() {},

		// console
		console,

		// DOM stubs via recursive proxy
		document: new Proxy({}, {
			get(target, prop) {
				if (prop === "getElementById") return () => makeStub("el");
				if (prop === "querySelector") return () => makeStub("qs");
				if (prop === "querySelectorAll") return () => ({ forEach() {} });
				if (prop === "addEventListener") return () => {};
				if (prop === "createElementNS") return () => makeStub("svgEl");
				if (prop === "createElement") return () => makeStub("el");
				if (prop === "createTextNode") return () => makeStub("textNode");
				if (prop === "documentElement") return makeStub("documentElement");
				if (prop === "activeElement") return makeStub("activeElement");
				if (prop === "title") return "";
				return makeStub("document." + String(prop));
			},
			set() { return true; },
		}),

		// navigator
		navigator: {
			serviceWorker: { register() {} },
			storage: { persist() {} },
		},

		// Worker — silent
		Worker: function Worker() {
			return {
				addEventListener() {},
				postMessage() {},
			};
		},

		// Notification
		Notification: Object.assign(function Notification() {}, {
			permission: "denied",
			requestPermission() { return Promise.resolve("denied"); },
		}),

		// localStorage
		localStorage: makeLocalStorage(localStorageSeed),

		// matchMedia
		matchMedia() { return { matches: false, addEventListener() {} }; },

		// speechSynthesis
		speechSynthesis: fakeSpeechSynthesis,
		SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {},

		// indexedDB
		indexedDB: fakeIDB,

		// AudioContext (not needed at boot but referenced)
		AudioContext: function AudioContext() { return makeStub("AudioContext"); },

		// Intl (real)
		Intl,
		Date,
		Math,
		JSON,
		Array,
		Object,
		String,
		Number,
		Boolean,
		Promise,
		Set,
		Map,
		Error,
		FormData: function FormData() { return { get() { return ""; } }; },
		Blob: function Blob() {},
		URL: { createObjectURL() { return "blob:fake"; }, revokeObjectURL() {} },
		IDBKeyRange: { only() {} },
		alert() {},
		confirm() { return false; },
		requestAnimationFrame() {},
		cancelAnimationFrame() {},
		loop: undefined,
	};

	Object.defineProperty(ctx, "window", { value: ctx, writable: true, configurable: true });
	return ctx;
}

// ---------------------------------------------------------------------------
// Boot helper: run all scripts in a VM context
// ---------------------------------------------------------------------------

function boot(localStorageSeed) {
	const ctx = makeContext(localStorageSeed);
	vm.createContext(ctx);

	for (const rel of scriptPaths) {
		const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
		try {
			vm.runInContext(src, ctx, { filename: rel });
		} catch (err) {
			err.message = `[${rel}] ${err.message}`;
			throw err;
		}
	}
}

// ---------------------------------------------------------------------------
// Seed for a "returning user" (pomo-version already set, two tasks)
// ---------------------------------------------------------------------------

const RETURNING_USER_SEED = {
	"pomo-version": "1",
	"pomo-tasks": JSON.stringify(["Default Task", "Work"]),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("boot: returning user (pre-seeded localStorage) throws no error", () => {
	assert.doesNotThrow(() => boot(RETURNING_USER_SEED));
});

test("boot: first visit (empty localStorage) throws no error", () => {
	assert.doesNotThrow(() => boot({}));
});
