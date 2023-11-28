// @ts-check
import * as esbuild from "esbuild";

import { packagePlugin } from "./common.mjs";

const ctx = await esbuild.context({
	entryPoints: ["./src/index.tsx"],
	bundle: true,
	outdir: "www",
	format: "esm",
	platform: "browser",
	sourcemap: "inline",
	splitting: true,
	define: {
		"process.env.NODE_ENV": JSON.stringify("development"),
	},
	minify: false,
	target: "es2015",
	jsx: "automatic",
	logLevel: "info",
	loader: {
		".module.css": "local-css",
	},
	plugins: [packagePlugin],
});

await ctx.watch();
await ctx.serve({
	servedir: "www",
});
