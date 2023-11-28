// @ts-check
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "fs";

import packageJson from "../package.json" assert { type: "json" };

import { packagePlugin } from "./common.mjs";

const result = await esbuild.build({
	entryPoints: ["./src/devtools.tsx"],
	bundle: true,
	outdir: "./dist",
	format: "esm",
	platform: "browser",
	sourcemap: "external",
	splitting: false,
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	minify: true,
	target: "es2019",
	jsx: "automatic",
	logLevel: "info",
	metafile: true,
	plugins: [packagePlugin],
});

writeFileSync("metafile.json", JSON.stringify(result.metafile));

// Handle extension building
await esbuild.build({
	entryPoints: [
		"./extension/src/background.ts",
		"./extension/src/content_script.ts",
		"./extension/src/page_script.ts",
		"./extension/src/devtools.ts",
	],
	bundle: true,
	write: true,
	minify: true,
	outdir: "./extension/dist",
	format: "esm",
	target: "es2019",
	platform: "browser",
	sourcemap: false,
	logLevel: "info",
	alias: {
		"exome-devtools": "./dist",
	},
	plugins: [packagePlugin],
});

const { metafile } = await esbuild.build({
	entryPoints: ["./extension/public/**/*"],
	loader: {
		".html": "copy",
		".json": "copy",
		".png": "copy",
	},
	write: true,
	outdir: "./extension/dist",
	logLevel: "info",
	metafile: true,
});

const [outputManifestPath] =
	Object.entries(metafile.outputs).find(
		([_, data]) => data.inputs["extension/public/manifest.json"],
	) || [];

if (!outputManifestPath) {
	throw new Error("Output manifest.json not found");
}

const manifestJson = JSON.parse(readFileSync(outputManifestPath, "utf-8"));

manifestJson.version = packageJson.version;

writeFileSync(outputManifestPath, JSON.stringify(manifestJson, null, 2));
