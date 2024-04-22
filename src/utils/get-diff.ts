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
		if (a === b) {
			return;
		}

		if (a !== undefined && b === undefined) {
			output.removed.push([path, a]);
			return;
		}

		if (a === undefined && b !== undefined) {
			output.added.push([path, b]);
			return;
		}

		if (
			a !== null &&
			typeof a === "object" &&
			b !== null &&
			typeof b === "object"
		) {
			const aKeys = Object.keys(a);
			const bKeys = Object.keys(b);

			if (aKeys.length === 0 && bKeys.length === 0) {
				return;
			}

			const allKeys = aKeys.concat(bKeys);
			const length = allKeys.length;

			for (let i = 0; i < length; i += 1) {
				const key = allKeys[i];

				if (i !== allKeys.indexOf(key)) {
					continue;
				}

				innerDiff(a[key], b[key], path.concat(key));
			}

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
