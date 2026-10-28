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
