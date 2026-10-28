import { chromium } from "playwright";
import { createServer } from "vite";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";

// Run against an unpacked production extension and published Exome middleware.
// HMR edits real modules; explicit GC makes collection deterministic for the test.
const producer = process.env.HMR_EXOME || "exome";
const legacy = producer !== "exome" || Boolean(process.env.OLD_EXTENSION_PATH);
await mkdir(".cache", { recursive: true });
const root = await mkdtemp(resolve(".cache/hmr-"));
await cp("tests/fixtures/hmr", root, { recursive: true });
const source = await readFile(`${root}/store.js`, "utf8");
const server = await createServer({
	root,
	configFile: false,
	resolve: {
		alias: [
			{
				find: "exome/devtools",
				replacement: resolve(`node_modules/${producer}/devtools.mjs`),
			},
			{
				find: "exome",
				replacement: resolve(`node_modules/${producer}/exome.mjs`),
			},
		],
	},
	server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const url = server.resolvedUrls.local[0];
const profile = await mkdtemp(resolve(".cache/hmr-profile-"));
const extension = resolve(process.env.OLD_EXTENSION_PATH || "extension/dist");
const context = await chromium.launchPersistentContext(profile, {
	executablePath: process.env.CHROME_PATH || undefined,
	headless: false,
	slowMo: process.env.EVIDENCE_DIR ? 250 : 0,
	args: [
		`--disable-extensions-except=${extension}`,
		`--load-extension=${extension}`,
		"--auto-open-devtools-for-tabs",
		"--window-size=1280,900",
	],
});
try {
	const page = context.pages()[0] || (await context.newPage());
	const errors = [];
	page.on("pageerror", (error) => errors.push(error.message));
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
		return targets.some(
			(target) =>
				target.url.startsWith("chrome-extension://") &&
				target.url.endsWith("/devtools.html"),
		);
	}, "extension DevTools page");
	const frontend = (await cdp.send("Target.getTargets")).targetInfos.find((t) =>
		t.url.startsWith("devtools://"),
	);
	const { sessionId } = await cdp.send("Target.attachToTarget", {
		targetId: frontend.targetId,
		flatten: false,
	});
	let requestId = 0;
	const evaluateFrontend = (expression, targetSession = sessionId) =>
		new Promise((resolve, reject) => {
			const id = ++requestId;
			const receive = ({ message }) => {
				const result = JSON.parse(message);
				if (result.id !== id) return;
				cdp.off("Target.receivedMessageFromTarget", receive);
				if (result.error || result.result?.exceptionDetails)
					reject(Error(JSON.stringify(result)));
				else resolve(result.result.result.value);
			};
			cdp.on("Target.receivedMessageFromTarget", receive);
			cdp
				.send("Target.sendMessageToTarget", {
					sessionId: targetSession,
					message: JSON.stringify({
						id,
						method: "Runtime.evaluate",
						params: { expression, returnByValue: true, awaitPromise: true },
					}),
				})
				.catch(reject);
		});
	let panelId;
	await waitFor(async () => {
		panelId = await evaluateFrontend(
			`(async()=>{const UI=await import('./ui/legacy/legacy.js'); return UI.InspectorView.InspectorView.instance().tabbedPane.tabIds().find(id=>id.endsWith('🔶Exome'));})()`,
		);
		return Boolean(panelId);
	}, "Exome tab registration");
	const showPanel = (id) =>
		evaluateFrontend(
			`(async()=>{const UI=await import('./ui/legacy/legacy.js'); await UI.InspectorView.InspectorView.instance().showPanel(${JSON.stringify(id)}); return true;})()`,
		);

	await showPanel(panelId);
	await waitFor(
		async () =>
			(await cdp.send("Target.getTargets")).targetInfos.some((t) =>
				t.url.endsWith("/panel.html"),
			),
		"visible extension panel",
	);
	const panelTarget = (await cdp.send("Target.getTargets")).targetInfos.find(
		(t) => t.url.endsWith("/panel.html"),
	);
	const panelSession = (
		await cdp.send("Target.attachToTarget", {
			targetId: panelTarget.targetId,
			flatten: false,
		})
	).sessionId;
	const panel = (expression) => evaluateFrontend(expression, panelSession);
	const click = async (text) => {
		await waitFor(
			() =>
				panel(
					`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()===${JSON.stringify(text)})`,
				),
			`button ${text}`,
		);
		return panel(
			`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)})?.click()`,
		);
	};
	const stores = () =>
		panel(
			`Array.from(document.querySelectorAll('button')).map(b=>b.textContent.trim()).filter(t=>/^Counter-/.test(t))`,
		);
	await click("State");
	await waitFor(
		async () => (await stores()).length === 1,
		"initial live store",
	);
	const first = (await stores())[0];
	await click(first);
	await page.getByRole("button", { name: "Increment current store" }).click();
	await page.getByText("101", { exact: true }).waitFor();
	let latest = first;
	for (let i = 1; i <= 3; i++) {
		const previous = await stores();
		await writeFile(
			`${root}/store.js`,
			source.replace("100", String(100 + i * 100)),
		);
		await page.getByText(String(100 + i * 100), { exact: true }).waitFor();
		await waitFor(
			async () => (await stores()).some((id) => !previous.includes(id)),
			"new HMR instance",
		);
		latest = (await stores()).find((id) => !previous.includes(id));
		if (process.env.EVIDENCE_DIR)
			await new Promise((done) => setTimeout(done, 1500));
		await cdp.send("HeapProfiler.collectGarbage");
		if (!legacy) {
			await waitFor(
				async () => (await stores()).length === 1,
				"released store removed from live panel",
			);
			assert.ok(!(await stores()).includes(first));
		}
		await page.getByRole("button", { name: "Increment current store" }).click();
	}
	if (legacy)
		assert.equal(
			(await stores()).length,
			4,
			"older peer remains usable without removal support",
		);
	else
		assert.match(await panel("document.body.innerText"), /No store selected/);
	await click(latest);
	await waitFor(
		async () => (await panel("document.body.innerText")).includes("401"),
		"current live state",
	);
	await click("Actions");
	await waitFor(
		() =>
			panel(
				`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('increment'))`,
			),
		"history list",
	);
	await panel(
		`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('increment'))?.click()`,
	);
	await click("Before");
	await waitFor(
		async () => (await panel("document.body.innerText")).includes("100"),
		"released store before snapshot",
	);
	await click("After");
	await waitFor(
		async () => (await panel("document.body.innerText")).includes("101"),
		"released store after snapshot",
	);
	if (process.env.EVIDENCE_DIR)
		await new Promise((done) => setTimeout(done, 2000));
	assert.deepEqual(errors, []);
	console.log(
		`${producer} + ${process.env.OLD_EXTENSION_PATH ? "previous" : "current"} panel: 3 real Vite hot reloads, live state and retained history passed; live stores=${legacy ? 4 : 1}`,
	);
} finally {
	await context.close();
	await server.close();
	await rm(root, { recursive: true, force: true });
	await rm(profile, { recursive: true, force: true });
}
