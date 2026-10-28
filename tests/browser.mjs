import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
const js = await readFile("dist/devtools.js");
const css = await readFile("dist/devtools.css");
const server = createServer((req, res) => {
	if (req.url === "/devtools.js") {
		res.setHeader("Content-Type", "text/javascript");
		res.end(js);
		return;
	}
	if (req.url === "/devtools.css") {
		res.setHeader("Content-Type", "text/css");
		res.end(css);
		return;
	}
	res.setHeader("Content-Type", "text/html");
	res.end(
		'<!doctype html><link rel="stylesheet" href="/devtools.css"><div id="root" style="height:480px;position:relative"></div>',
	);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
	executablePath: process.env.CHROME_PATH || undefined,
	headless: true,
});
try {
	const page = await browser.newPage({
		viewport: { width: 1000, height: 700 },
	});
	const errors = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto(`http://127.0.0.1:${server.address().port}`);
	await page.evaluate(async () => {
		const { renderUI } = await import("/devtools.js");
		renderUI(document.getElementById("root"));
		const connection = window.__EXOME_DEVTOOLS_EXTENSION__.connect({
			name: "Test app",
			maxAge: 3,
			details: { version: "2.6.0" },
		});
		window.connection = connection;
		const action = {
			id: "1",
			name: "increment",
			instance: "Counter-1",
			depth: 1,
			now: 0,
			time: 5,
			trace: "",
			payload: [],
			before: { value: [], child: { $$exome_id: "Counter-2" } },
			after: { value: {}, count: 1, child: { $$exome_id: "Counter-2" } },
		};
		connection.send({
			event: "update",
			type: "all",
			payload: {
				states: [
					[
						"Counter-1",
						{
							count: 1,
							"$$exome_gt:double": null,
							list: [1, 2],
							big: { $$exome_bigint: "9007199254740993" },
							cycle: { $$exome_circular: true },
						},
					],
					["Counter-2", { count: 999 }],
				],
				actions: [action],
			},
		});
	});
	await page
		.getByRole("searchbox", { name: "Filter actions" })
		.fill("increment,count=1");
	await page.getByRole("button", { name: /Counter.*increment/s }).click();
	await page.getByRole("button", { name: "Before", exact: true }).click();
	await page
		.getByText("Counter-2 (reference; historical value not captured)")
		.first()
		.waitFor({ state: "visible" });
	assert.match(await page.locator("#root").innerText(), /Diff \(2\)/);
	assert.equal(
		(await page.locator("#root").innerText()).includes("999"),
		false,
	);
	await page.getByRole("button", { name: "State", exact: true }).click();
	await page.getByRole("button", { name: "Counter-1", exact: true }).click();
	await page.getByText("9007199254740993n", { exact: true }).waitFor();
	await page.getByText("[Circular]", { exact: true }).waitFor();
	await page.getByText("not evaluated", { exact: true }).waitFor();
	const array = page.getByRole("button", {
		name: "Array(2) [1, 2]",
		exact: true,
	});
	await array.focus();
	await page.keyboard.press("Enter");
	assert.equal(
		await page
			.getByRole("button", { name: "Array(2) [", exact: true })
			.getAttribute("aria-expanded"),
		"true",
	);
	await page.keyboard.press("Space");
	assert.equal(await array.getAttribute("aria-expanded"), "false");
	await page.setViewportSize({ width: 380, height: 700 });
	const listBox = await page
		.getByRole("button", { name: "Counter-1", exact: true })
		.boundingBox();
	const stateBox = await page
		.getByText("not evaluated", { exact: true })
		.boundingBox();
	assert.ok(stateBox.y > listBox.y, "narrow panel stacks list above inspector");
	await page.getByRole("button", { name: "Details", exact: true }).click();
	assert.match(
		await page.locator("#root").innerText(),
		/Retained completed actions: 1 \(1x\)/,
	);
	// Identical store/action IDs in two connections must remain independent.
	await page.evaluate(() => {
		window.second = window.__EXOME_DEVTOOLS_EXTENSION__.connect({
			name: "Second",
			maxAge: 3,
			details: { version: "2.6.0" },
		});
		window.second.send({
			event: "update",
			type: "all",
			payload: {
				states: [["Counter-1", { count: 200 }]],
				actions: [
					{
						id: "1",
						name: "secondAction",
						instance: "Counter-1",
						depth: 1,
						now: 0,
						time: 8,
						trace: "",
						payload: [],
						before: { count: 199 },
						after: { count: 200 },
					},
				],
			},
		});
	});
	const selector = page.getByRole("combobox", { name: "Connection" });
	await page.getByRole("button", { name: "Actions", exact: true }).click();
	for (const width of [1100, 380]) {
		await page.setViewportSize({ width, height: 700 });
		const bounds = await page.evaluate(() => {
			const root = document.getElementById("root").getBoundingClientRect();
			const select = document.querySelector("select").getBoundingClientRect();
			const nav = [...document.querySelectorAll("button")]
				.find((el) => el.textContent.trim() === "State")
				.getBoundingClientRect();
			const filter = document
				.querySelector("input[type=search]")
				.getBoundingClientRect();
			return {
				rootBottom: root.bottom,
				panelBottom: document
					.querySelector("select")
					.closest("label")
					.closest("div")
					.parentElement.parentElement.getBoundingClientRect().bottom,
				selectBottom: select.bottom,
				navTop: nav.top,
				navBottom: nav.bottom,
				filterTop: filter.top,
			};
		});
		assert.ok(
			bounds.selectBottom <= bounds.navTop,
			"connection selector must not overlap navigation",
		);
		assert.ok(
			bounds.navBottom <= bounds.filterTop,
			"navigation must not overlap content",
		);
		assert.ok(
			bounds.panelBottom <= bounds.rootBottom + 1,
			"panel must fit its embedding container",
		);
	}

	await selector.click({ timeout: 1500 });
	await page.keyboard.press("Escape");
	await selector.selectOption({ label: "Second (2)" });
	await page.getByRole("button", { name: /Counter.*secondAction/s }).waitFor();
	assert.equal(
		await page.getByRole("button", { name: /Counter.*increment/s }).count(),
		0,
	);
	await page.getByRole("button", { name: "State", exact: true }).click();
	await page.getByRole("button", { name: "Counter-1", exact: true }).click();
	await page.getByText("200", { exact: true }).waitFor();
	await page.evaluate(() =>
		window.connection.send({
			event: "update",
			type: "state",
			payload: ["Counter-1", { count: 42 }],
		}),
	);
	assert.equal(await page.getByText("42", { exact: true }).count(), 0);
	await selector.selectOption({ label: "Test app (1)" });
	await page.getByRole("button", { name: /Counter.*increment/s }).waitFor();
	assert.equal(
		await page.getByRole("button", { name: /Counter.*secondAction/s }).count(),
		0,
	);
	await page.getByRole("button", { name: "State", exact: true }).click();
	await page.getByRole("button", { name: "Counter-1", exact: true }).click();
	await page.getByText("42", { exact: true }).waitFor();

	await page.evaluate(() =>
		window.connection.send({
			event: "update",
			type: "all",
			payload: { states: [], actions: [] },
		}),
	);
	await page.getByRole("button", { name: "State", exact: true }).click();
	assert.equal(
		await page.getByRole("button", { name: "Counter-1", exact: true }).count(),
		0,
	);
	await page.evaluate(() => {
		window.connection.disconnect();
		window.connection.disconnect();
	});
	await page.getByText("Second", { exact: true }).waitFor();
	assert.deepEqual(errors, []);
	console.log(
		"Production UI: filtering, diffs, snapshots, getters, keyboard, narrow panel, sync, connection switching/isolation and disposal passed",
	);
} finally {
	await browser.close();
	await new Promise((resolve) => server.close(resolve));
}
