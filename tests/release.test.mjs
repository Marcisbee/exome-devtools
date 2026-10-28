import { test } from "node:test";
import assert from "node:assert/strict";
import { submitExtension } from "../scripts/publish-extension.mjs";

const config = {
	publisherId: "publisher",
	itemId: "a".repeat(32),
	token: "test-token",
	version: "1.2.0",
	zip: Buffer.from("test ZIP"),
};
function mockApi(t, replies) {
	const calls = [];
	t.mock.method(globalThis, "fetch", async (url, options) => {
		calls.push({ url, ...options });
		assert.ok(replies.length, "unexpected API request");
		const [status, body] = replies.shift();
		return new Response(JSON.stringify(body), { status });
	});
	return calls;
}
test("uploads package before submitting and reports pending review accurately", async (t) => {
	const calls = mockApi(t, [
		[200, {}],
		[200, { uploadState: "SUCCEEDED", crxVersion: "1.2.0" }],
		[200, { state: "PENDING_REVIEW" }],
	]);
	assert.equal(await submitExtension(config), "PENDING_REVIEW");
	assert.deepEqual(
		calls.map((c) => new URL(c.url).pathname),
		[
			`/v2/publishers/publisher/items/${config.itemId}:fetchStatus`,
			`/upload/v2/publishers/publisher/items/${config.itemId}:upload`,
			`/v2/publishers/publisher/items/${config.itemId}:publish`,
		],
	);
	assert.equal(calls[1].method, "POST");
	assert.equal(calls[1].body, config.zip);
	assert.equal(calls[2].method, "POST");
});
test("failed upload, HTTP denial and mismatched version never submit", async (t) => {
	for (const response of [
		[200, { uploadState: "FAILED" }],
		[403, {}],
		[200, { uploadState: "SUCCEEDED", crxVersion: "1.1.0" }],
	]) {
		const calls = mockApi(t, [[200, {}], response]);
		await assert.rejects(submitExtension(config));
		assert.equal(calls.length, 2);
		t.mock.restoreAll();
	}
});
test("retries do not upload a version already published or pending review", async (t) => {
	for (const [key, state, expected] of [
		["publishedItemRevisionStatus", "PUBLISHED", "ALREADY_PUBLISHED"],
		["submittedItemRevisionStatus", "PENDING_REVIEW", "PENDING_REVIEW"],
	]) {
		const calls = mockApi(t, [
			[
				200,
				{ [key]: { state, distributionChannels: [{ crxVersion: "1.2.0" }] } },
			],
		]);
		assert.equal(await submitExtension(config), expected);
		assert.equal(calls.length, 1);
		t.mock.restoreAll();
	}
});
test("waits for asynchronous upload success before publishing", async (t) => {
	const calls = mockApi(t, [
		[200, {}],
		[200, { uploadState: "IN_PROGRESS" }],
		[200, { lastAsyncUploadState: "SUCCEEDED" }],
		[200, { state: "PENDING_REVIEW" }],
	]);
	assert.equal(await submitExtension(config), "PENDING_REVIEW");
	assert.ok(calls[2].url.endsWith(":fetchStatus"));
	assert.ok(calls[3].url.endsWith(":publish"));
});
