import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
async function source(path) {
	const result = await build({
		entryPoints: [path],
		bundle: true,
		platform: "node",
		format: "cjs",
		write: false,
	});
	const module = { exports: {} };
	new Function("module", "exports", "require", result.outputFiles[0].text)(
		module,
		module.exports,
		require,
	);
	return module.exports;
}
const { getDiff } = await source("src/utils/get-diff.ts");
const { filterQuery } = await source("src/utils/use-query-filter.ts");
const { DevtoolsActionsStore } = await source("src/store.ts");
const action = (id, extra = {}) => ({
	id,
	name: "increment",
	instance: "Counter-1",
	payload: [],
	depth: 1,
	now: 0,
	trace: "",
	before: { count: 0 },
	...extra,
});

test("diff distinguishes container types, missing properties and changed values", () => {
	assert.deepEqual(getDiff({ value: [] }, { value: {} }).edited, [
		[["value"], [], {}],
	]);
	assert.deepEqual(getDiff({}, { value: undefined }).added, [
		[["value"], undefined],
	]);
	assert.deepEqual(getDiff({ value: undefined }, {}).removed, [
		[["value"], undefined],
	]);
	assert.deepEqual(getDiff({ value: 1 }, { value: undefined }).edited, [
		[["value"], 1, undefined],
	]);
	assert.deepEqual(getDiff({ value: [1, 2] }, { value: [1] }).removed, [
		[["value", "1"], 2],
	]);
});
test("action and state queries use their own fields, safely handling partial syntax", () => {
	const actions = [
		action("1", { after: { count: 1 } }),
		action("2", { after: { count: 2 } }),
	];
	assert.deepEqual(
		filterQuery(
			actions,
			"increment,count=1",
			(a) => a.name,
			(a) => a.after,
		).map((a) => a.id),
		["1"],
	);
	const states = [
		["Counter-1", { count: 1 }],
		["Counter-2", { count: 2 }],
	];
	assert.deepEqual(
		filterQuery(
			states,
			"counter,count=2",
			(a) => a[0],
			(a) => a[1],
		),
		[states[1]],
	);
	assert.equal(
		filterQuery(
			actions,
			"increment,",
			(a) => a.name,
			(a) => a.after,
		).length,
		2,
	);
	assert.equal(
		filterQuery(
			actions,
			"increment,missing=",
			(a) => a.name,
			(a) => a.after,
		).length,
		0,
	);
});
test("full sync replaces instances and reconstructs retained completed statistics", () => {
	const store = new DevtoolsActionsStore(2);
	store.addInstance("Old-1", {});
	store.replaceSnapshot(
		[["Counter-1", { count: 3 }]],
		[action("1", { time: 5 }), action("2"), action("3", { time: 7 })],
	);
	assert.equal(store.instances.has("Old-1"), false);
	assert.deepEqual(
		store.actions.map((a) => a.id),
		["2", "3"],
	);
	assert.deepEqual(store.count.get("Counter-1.increment"), [7]);
	store.updateAction(action("2", { time: 3 }));
	store.updateAction(action("2", { time: 3 }));
	assert.deepEqual(store.count.get("Counter-1.increment"), [3, 7]);
	store.replaceSnapshot([], []);
	assert.equal(store.instances.size, 0);
	assert.equal(store.count.size, 0);
	assert.equal(store.actions.length, 0);
});
test("late completion does not restore an evicted action or overwrite live state", () => {
	const store = new DevtoolsActionsStore(1);
	const first = action("1");
	store.addAction(first);
	first.before.count = 100;
	assert.equal(store.actions[0].before.count, 0);
	store.addAction(action("2"));
	store.updateInstance("Counter-1", { count: 2 });
	store.updateAction(action("1", { time: 5, after: { count: 1 } }));
	assert.deepEqual(
		store.actions.map((a) => a.id),
		["2"],
	);
	assert.equal(store.count.size, 0);
	assert.equal(store.instances.get("Counter-1").count, 2);
	for (let i = 3; i < 103; i++) {
		store.addAction(action(String(i)));
		store.updateAction(action(String(i), { time: 1 }));
	}
	assert.deepEqual(store.count.get("Counter-1.increment"), [1]);
});

const {
	capturePerformance,
	summarizePerformance,
	serializePerformance,
	parsePerformance,
} = await source("src/performance.ts");
test("performance reports preserve timing evidence and distinguish pending, zero and failed calls", () => {
	const store = {
		name: "App",
		maxAge: 20,
		details: { version: "2.9.1" },
		actions: {
			actions: [
				action("1", {
					time: 0,
					payload: ["secret"],
					before: { token: "secret" },
				}),
				action("2", { time: 10, error: "failure" }),
				action("3"),
				action("4", {
					time: 40,
					instance: "Counter-2",
					depth: 2,
					trace: "caller.ts:10",
				}),
			],
		},
	};
	const report = capturePerformance(store);
	const json = serializePerformance(report);
	assert.equal(json.includes("secret"), false);
	const restored = parsePerformance(json);
	assert.deepEqual(
		restored.samples.map((s) => s.durationMs),
		[0, 10, null, 40],
	);
	assert.equal(restored.samples[3].trace, "caller.ts:10");
	const groups = summarizePerformance(restored.samples);
	assert.equal(groups[0].instance, "Counter-2");
	const group = groups[1];
	assert.deepEqual(
		[
			group.calls,
			group.completed,
			group.pending,
			group.failures,
			group.totalMs,
			group.meanMs,
			group.p95Ms,
			group.maxMs,
		],
		[3, 2, 1, 1, 10, 5, 10, 10],
	);
	assert.equal(JSON.parse(json).summary[1].pending, 1);
	for (const mutate of [
		(r) => (r.version = 2),
		(r) => (r.samples[0].durationMs = -1),
		(r) => (r.samples[0].startMs = "0"),
		(r) => (r.samples[0].depth = 0.5),
		(r) => (r.samples[1].id = r.samples[0].id),
		(r) => (r.connection = null),
	]) {
		const invalid = JSON.parse(json);
		mutate(invalid);
		assert.throws(() => parsePerformance(JSON.stringify(invalid)));
	}
	assert.throws(() => parsePerformance("not JSON"));
	assert.equal(
		summarizePerformance([{ ...restored.samples[2] }])[0].meanMs,
		null,
	);
});

test("performance P95 uses nearest rank across completed samples", () => {
	const samples = Array.from({ length: 20 }, (_, index) => ({
		id: String(index),
		instance: "Store-1",
		name: "run",
		startMs: index * 50,
		durationMs: index + 1,
		depth: 1,
		failed: false,
		trace: "",
	}));
	const [group] = summarizePerformance(samples);
	assert.deepEqual(
		[group.totalMs, group.meanMs, group.p95Ms, group.maxMs],
		[210, 10.5, 19, 20],
	);
});
