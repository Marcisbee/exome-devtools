import { chromium } from "playwright";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
const server = createServer((req, res) => {
	res.setHeader("Content-Type", "text/html");
	res.end(
		"<title>Extension regression</title><body>Application fixture</body>",
	);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}/`;
await mkdir(".cache", { recursive: true });
const profile = await mkdtemp(".cache/extension-");
const extension = resolve("extension/dist");
const context = await chromium.launchPersistentContext(profile, {
	executablePath: process.env.CHROME_PATH || undefined,
	headless: false,
	args: [
		`--disable-extensions-except=${extension}`,
		`--load-extension=${extension}`,
		"--auto-open-devtools-for-tabs",
	],
});
try {
	const page = await context.newPage();
	await page.goto(url);
	const cdp = await context.newCDPSession(page);
	async function waitFor(check, label) {
		for (let i = 0; i < 100; i++) {
			if (await check()) return;
			await new Promise((done) => setTimeout(done, 100));
		}
		throw Error(`Timed out: ${label}`);
	}
	await waitFor(async () => {
		const targets = (await cdp.send("Target.getTargets")).targetInfos;
		const frontend = targets.find(
			(t) => t.title === `DevTools - 127.0.0.1:${server.address().port}/`,
		);
		return (
			frontend &&
			targets.some(
				(t) =>
					t.parentId === frontend.targetId && t.url.endsWith("/devtools.html"),
			)
		);
	}, "extension DevTools page");
	await page.waitForFunction(() => !!window.__EXOME_DEVTOOLS_EXTENSION__);
	const connect = async (frame, name) =>
		frame.evaluate((name) => {
			window.syncs ??= [];
			window.connections ??= {};
			const c = window.__EXOME_DEVTOOLS_EXTENSION__.connect({
				name,
				maxAge: 3,
				details: { version: "test" },
			});
			window.connections[name] = c;
			c.subscribe((event) => {
				window.syncs.push([name, event.type]);
				c.send({
					event: "update",
					type: "all",
					payload: { states: [[`${name}-1`, { count: 1 }]], actions: [] },
				});
			});
		}, name);
	await connect(page, "A");
	await waitFor(() => page.evaluate(() => window.syncs.length === 1), "A sync");
	await connect(page, "B");
	await waitFor(
		() => page.evaluate(() => window.syncs.some(([name]) => name === "B")),
		"B sync",
	);
	assert.deepEqual(await page.evaluate(() => window.syncs), [
		["A", "sync"],
		["B", "sync"],
	]);
	await page.evaluate((url) => {
		const frame = document.createElement("iframe");
		frame.src = url + "frame";
		document.body.append(frame);
	}, url);
	await waitFor(
		() => page.frames().some((f) => f.url() === url + "frame"),
		"child frame",
	);
	const frame = page.frames().find((f) => f.url() === url + "frame");
	await frame.waitForFunction(() => !!window.__EXOME_DEVTOOLS_EXTENSION__);
	await connect(frame, "Frame");
	await waitFor(
		() => frame.evaluate(() => window.syncs.length === 1),
		"frame sync",
	);
	assert.deepEqual(await page.evaluate(() => window.syncs), [
		["A", "sync"],
		["B", "sync"],
	]);
	// The same discovery message is sent when the panel opens or navigation completes.
	await page.evaluate(() => {
		window.syncs = [];
		window.postMessage(
			{ source: "exome-devtools-extension-in", data: { type: "discover" } },
			"*",
		);
	});
	await waitFor(
		() => page.evaluate(() => window.syncs.length === 2),
		"rediscovery",
	);
	assert.deepEqual(
		await page.evaluate(() => window.syncs.map((x) => x[0]).sort()),
		["A", "B"],
	);
	await page.evaluate(() => {
		window.connections.A.disconnect();
		window.connections.A.disconnect();
		window.syncs = [];
		window.postMessage(
			{ source: "exome-devtools-extension-in", data: { type: "discover" } },
			"*",
		);
	});
	await waitFor(
		() => page.evaluate(() => window.syncs.length === 1),
		"disconnect and rediscovery",
	);
	assert.deepEqual(await page.evaluate(() => window.syncs), [["B", "sync"]]);
	await page.reload();
	await page.waitForFunction(() => !!window.__EXOME_DEVTOOLS_EXTENSION__);
	await connect(page, "Reloaded");
	await waitFor(
		() => page.evaluate(() => window.syncs.length > 0),
		"reload sync",
	);
	assert.ok(
		(await page.evaluate(() => window.syncs)).every(
			([name]) => name === "Reloaded",
		),
	);
	console.log(
		"Unpacked extension: independent connections, frame routing, rediscovery, repeated disconnect and navigation passed",
	);
} finally {
	await context.close();
	await new Promise((done) => server.close(done));
	await rm(profile, { recursive: true, force: true });
}
