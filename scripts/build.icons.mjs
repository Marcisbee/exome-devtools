// @ts-check
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

/**
 * https://bl.ocks.org/jennyknuth/222825e315d45a738ed9d6e04c7a88d0
 * @param {string} svg
 */
function encodeSvg(svg) {
	return svg
		.replace(
			"<svg",
			~svg.indexOf("xmlns")
				? "<svg"
				: '<svg xmlns="http://www.w3.org/2000/svg"',
		)
		.replace(/\n/g, "") // @TODO I added this!!! Check if works!
		.replace(/"/g, "'")
		.replace(/%/g, "%25")
		.replace(/#/g, "%23")
		.replace(/{/g, "%7B")
		.replace(/}/g, "%7D")
		.replace(/</g, "%3C")
		.replace(/>/g, "%3E");
}

/**
 * @param {string} svg
 */
function buildUri(svg) {
	return `url("data:image/svg+xml;utf8,${encodeSvg(svg)}")`;
}

/**
 * @param {string} svg
 */
function svgToUri(svg) {
	// if an SVG icon have the `currentColor` value,
	// it's very likely to be a monochrome icon
	const mask = svg.includes("currentColor");

	const uri = buildUri(svg);

	return {
		mask,
		uri,
	};

	// // monochrome
	// if (mask) {
	// 	return {
	// 		mask: `${uri} no-repeat`,
	// 		"mask-size": "100% 100%",
	// 		"background-color": "currentColor",
	// 		height: "1em",
	// 		width: "1em",
	// 	};
	// }

	// // colored
	// return {
	// 	background: `${uri} no-repeat`,
	// 	"background-size": "100% 100%",
	// 	"background-color": "transparent",
	// 	height: "1em",
	// 	width: "1em",
	// };
}

const masked = [];
const begged = [];

for (const filePath of readdirSync("icons", {
	recursive: true,
	withFileTypes: false,
}).sort()) {
	const name = String(filePath).replace(/\.svg$/, "");

	const { uri, mask } = svgToUri(readFileSync(`icons/${filePath}`, "utf-8"));

	if (mask) {
		masked.push({
			name,
			uri,
		});
	} else {
		begged.push({
			name,
			uri,
		});
	}

	// console.log("Writing `app/graphql/main.ts`");
	// await Deno.writeTextFile(outputFile, output);

	// console.log("✅ Done");

	// console.log(title, svgToUri(text));
}

const outputCss = `[class^="icon-"] {
	-webkit-mask-size: 100% 100%;
	mask-size: 100% 100%;
	background-color: currentColor;
	color: inherit;
	display: inline-block;
	height: 1.2em;
	width: 1.2em;
	vertical-align: text-bottom;
}

${masked
	.map(
		({ name, uri }) => `.icon-${name} {
	--icn: ${uri};
	-webkit-mask: var(--icn) no-repeat;
	mask: var(--icn) no-repeat;
	-webkit-mask-size: 100% 100%;
	mask-size: 100% 100%;
}`,
	)
	.join("\n\n")}

${begged
	.map(
		({ name, uri }) => `.icon-${name} {
	background: ${uri} no-repeat;
	background-size: 100% 100%;
}`,
	)
	.join("\n\n")}
`;

const outputTypes = `import type { JSXInternal } from "preact/src/jsx";
import { cc } from "../../utils/cc";

import "./icons.css";

export interface IconProps
	extends JSXInternal.DetailedHTMLProps<
		JSXInternal.HTMLAttributes<HTMLElement>,
		HTMLElement
	> {
	type: ${masked
		.concat(begged)
		.map(({ name }) => JSON.stringify(name))
		.join(" | ")};
}

export function Icon({ type, className, ...props }: IconProps) {
	return <i {...props} className={cc([\`icon-\${type}\`, className as string])} />;
}
`;

mkdirSync("./src/components/icon", { recursive: true });

writeFileSync("./src/components/icon/icons.css", outputCss);
writeFileSync("./src/components/icon/icon.tsx", outputTypes);

console.log("✅ Done");
