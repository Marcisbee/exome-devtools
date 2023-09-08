// @ts-check
import * as esbuild from "esbuild";
// import { es5Plugin } from "esbuild-plugin-es5";
import { writeFileSync } from "fs";

const result = await esbuild.build({
	entryPoints: ["./src/devtools.tsx"],
	bundle: true,
	outdir: "dist",
	format: "esm",
	platform: "browser",
	sourcemap: "external",
	splitting: false,
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	minify: true,
	target: "es2019",
	// target: "es5",
	jsx: "automatic",
	logLevel: "info",
	metafile: true,
	// external: ["exome"],
	// alias: {
	// 	"exome/preact": "./node_modules/exome/preact.js",
	// },
	loader: {
		".module.css": "local-css",
	},

	plugins: [
		// es5Plugin(),
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
