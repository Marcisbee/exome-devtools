// @ts-check
import * as esbuild from "esbuild";
// import { compile } from "sass";

// const sassModulePlugin = {
// 	name: "local-sass",
// 	setup({ onLoad }) {
// 		onLoad({ filter: /\.module\.scss$/ }, (args) => {
// 			const { css } = compile(args.path);

// 			return { contents: css, loader: "local-css" };
// 			//                              ^^^^^^^^^^^
// 		});
// 	},
// };

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
	alias: {
		preact: './node_modules/preact',
		'preact/hooks': './node_modules/preact/hooks',
	},
	// plugins: [sassModulePlugin],
});

await ctx.watch();
await ctx.serve({
	servedir: "www",
});
