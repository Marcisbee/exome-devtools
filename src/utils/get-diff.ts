import {
	PROPERTY_TYPE_ACTION,
	PROPERTY_TYPE_GETTER,
	PROPERTY_TYPE_SILENT,
} from "./explore-exome-instance";

const NORMAL_KEY_REGEXP = new RegExp(
	`^${PROPERTY_TYPE_GETTER}:`.replace(/(\$)/g, "\\$"),
);
const IGNORE_KEY_REGEXP = new RegExp(
	`^(${PROPERTY_TYPE_ACTION}|${PROPERTY_TYPE_SILENT}):`.replace(/(\$)/g, "\\$"),
);

function normalKey(key: string) {
	return key.replace(NORMAL_KEY_REGEXP, "");
}

export interface Diff {
	added: [string[], any][];
	removed: [string[], any][];
	edited: [string[], any, any][];
}

export function getDiff(before: any, after: any): Diff {
	const output: Diff = {
		added: [],
		removed: [],
		edited: [],
	};

	innerDiff(before, after);

	return output;

	function innerDiff(a: any, b: any, path: string[] = []) {
		if (Object.is(a, b)) return;
		if (
			a !== null &&
			b !== null &&
			typeof a === "object" &&
			typeof b === "object" &&
			Array.isArray(a) === Array.isArray(b)
		) {
			for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
				const childPath = path.concat(key);
				if (!Object.prototype.hasOwnProperty.call(a, key))
					output.added.push([childPath, b[key]]);
				else if (!Object.prototype.hasOwnProperty.call(b, key))
					output.removed.push([childPath, a[key]]);
				else innerDiff(a[key], b[key], childPath);
			}
			if (
				Array.isArray(a) &&
				a.length !== b.length &&
				Object.keys(a).length === 0 &&
				Object.keys(b).length === 0
			)
				output.edited.push([path, a, b]);
			return;
		}

		output.edited.push([path, a, b]);
	}
}

export function getShallowExomeJson(state: Record<string, any>) {
	if (!state || typeof state !== "object") {
		return state;
	}

	const keys = Object.keys(state).filter((key) => !IGNORE_KEY_REGEXP.test(key));
	const output: Record<string, any> = {};

	for (const key of keys) {
		output[normalKey(key)] = state[key];
	}

	return output;
}
