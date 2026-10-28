import { build } from "esbuild";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";

// Published middleware is the producer: do not duplicate its wire messages here.
const packages = [
	"exome-v2_4_0",
	"exome-v2_4",
	"exome-v2_5",
	"exome-v2_6",
	"exome-v2_7",
	"exome-v2_8",
	"exome-v2_9",
	"exome",
];
const assets = new Map([
	["/ui.js", ["text/javascript", await readFile("dist/devtools.js")]],
	["/ui.css", ["text/css", await readFile("dist/devtools.css")]],
]);
const versions = [];
for (const name of packages) {
	const { version } = JSON.parse(
		await readFile(`node_modules/${name}/package.json`),
	);
	versions.push(version);
	const result = await build({
		stdin: {
			contents: `
import {Exome, addMiddleware} from 'exome';
import {unstableExomeDevtools} from '${name}/devtools';
addMiddleware(unstableExomeDevtools({name:'Exome ${version}',maxAge:20}));
class Counter extends Exome {
 count = ${versions.length * 100};
 increment() { this.count++; }
 async incrementAsync() { await Promise.resolve(); this.count++; }
}
const counter = new Counter();
window.bump = () => counter.increment();
window.bumpAsync = () => counter.incrementAsync();
counter.increment();
`,
			resolveDir: process.cwd(),
		},
		bundle: true,
		write: false,
		format: "esm",
		alias: {
			"exome/devtools": resolve(`node_modules/${name}/devtools.mjs`),
			exome: resolve(`node_modules/${name}/exome.mjs`),
		},
	});
	assets.set(`/app-${version}.js`, [
		"text/javascript",
		result.outputFiles[0].text,
	]);
	assets.set(`/app-${version}`, [
		"text/html",
		`<!doctype html><script type="module" src="/app-${version}.js"></script>`,
	]);
}
const server = createServer((req, res) => {
	const [type, body] = assets.get(req.url) || [
		"text/html",
		'<!doctype html><link rel="stylesheet" href="/ui.css"><div id="root" style="height:100vh"></div>',
	];
	res.setHeader("Content-Type", type);
	res.end(body);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
	executablePath: process.env.CHROME_PATH || undefined,
});
try {
	const page = await browser.newPage({
		viewport: { width: 1100, height: 740 },
	});
	const errors = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto(url);
	await page.evaluate(async () => {
		const { renderUI } = await import("/ui.js");
		renderUI(document.getElementById("root"));
	});
	// All releases stay connected together; their store classes intentionally share a name.
	for (const version of versions) {
		await page.evaluate((version) => {
			const frame = document.createElement("iframe");
			frame.hidden = true;
			frame.src = `/app-${version}`;
			document.body.append(frame);
		}, version);
		await page.waitForFunction(
			(version) =>
				[...document.querySelectorAll("select option")].some((o) =>
					o.textContent.includes(version),
				) || document.body.textContent.includes(`Exome ${version}`),
			version,
		);
	}
	const selector = page.getByRole("combobox", { name: "Connection" });
	for (const [index, version] of versions.entries()) {
		await selector.selectOption({ label: `Exome ${version} (${index + 1})` });
		await page.getByRole("button", { name: "Details", exact: true }).click();
		await page
			.getByRole("region", { name: "Connection overview" })
			.locator("dl > div")
			.filter({ has: page.getByText("Exome version", { exact: true }) })
			.getByText(`v${version}`, { exact: true })
			.waitFor();
		await page.getByRole("button", { name: "State", exact: true }).click();
		await page.getByRole("button", { name: /^Counter-/ }).click();
		await page
			.getByText(String((index + 1) * 100 + 1), { exact: true })
			.waitFor();
		const frame = page
			.frames()
			.find((f) => f.url() === `${url}/app-${version}`);
		await frame.evaluate(() => window.bumpAsync());
		await page
			.getByText(String((index + 1) * 100 + 2), { exact: true })
			.waitFor();
		await page.getByRole("button", { name: "Actions", exact: true }).click();
		await page
			.getByRole("button", { name: /Counter.*incrementAsync/s })
			.click();
		await page
			.getByText(String((index + 1) * 100 + 2), { exact: true })
			.first()
			.waitFor();
		console.log(
			`Exome ${version}: real middleware, state updates, async action history and connection switching passed`,
		);
	}
	// An old producer updates while the newest connection is selected.
	const oldest = page
		.frames()
		.find((f) => f.url() === `${url}/app-${versions[0]}`);
	await oldest.evaluate(() => window.bump());
	await selector.selectOption({ label: `Exome ${versions[0]} (1)` });
	await page.getByRole("button", { name: "State", exact: true }).click();
	await page.getByRole("button", { name: /^Counter-/ }).click();
	await page.getByText("103", { exact: true }).waitFor();
	assert.deepEqual(errors, []);
} finally {
	await browser.close();
	await new Promise((done) => server.close(done));
}
