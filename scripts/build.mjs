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
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	minify: true,
	target: "es2019",
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

		{
			name: "my-plugin",
			setup(build) {
				build.onResolve({ filter: /^exome$/ }, (args) => ({
					path: args.path,
					namespace: "my-plugin",
				}));

				build.onLoad({ filter: /.*/, namespace: "my-plugin" }, () => {
					const contents =
						"module.exports = window.__EXOME_DEVTOOLS__ && window.__EXOME_DEVTOOLS__.meta";
					return { contents };
				});
			},
		},
	],
});

writeFileSync("metafile.json", JSON.stringify(result.metafile));
