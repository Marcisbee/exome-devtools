// @ts-check
import * as esbuild from "esbuild";
import { writeFileSync } from "fs";

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
});

await esbuild.build({
	entryPoints: ["./lib/devtools-exome.ts"],
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
	external: ["exome"],
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
});

await esbuild.build({
	entryPoints: ["./extension/public/**/*"],
	loader: {
		".html": "copy",
		".json": "copy",
		".png": "copy",
	},
	write: true,
	outdir: "./extension/dist",
	logLevel: "info",
});
