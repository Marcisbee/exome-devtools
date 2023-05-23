// @ts-check
import * as esbuild from "esbuild";
import { cssModules } from "esbuild-plugin-lightningcss-modules";
import { writeFileSync } from "fs";

const result = await esbuild.build({
	entryPoints: ["./src/devtools.tsx"],
	bundle: true,
	outdir: "dist",
	format: "esm",
	platform: "browser",
	sourcemap: "external",
	splitting: true,
	define: {
		"process.env.NODE_ENV": JSON.stringify("development"),
	},
	minify: true,
	target: "es2015",
	jsx: "automatic",
	logLevel: "info",
	metafile: true,

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

writeFileSync("metafile.json", JSON.stringify(result.metafile));
