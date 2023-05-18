// @ts-check
import * as esbuild from "esbuild";
import { cssModules } from "esbuild-plugin-lightningcss-modules";

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

	plugins: [
		cssModules({
			// add your own or other plugins in the "visitor" section see
			// https://lightningcss.dev/transforms.html
			// visitor: myLightningcssPlugin(),
			visitor: undefined,
			targets: {
				chrome: 80, // aligns somewhat to es2020
			},
			drafts: {
				nesting: true,
			},
			cssModulesPattern: undefined,
			includeFilter: /\.module\.css$/,
			excludeFilter: /normalize\.css/,
		}),
	],
});

await ctx.watch();

const { host, port } = await ctx.serve({
	servedir: "www",
});

console.log(`http://${host}:${port}`);
