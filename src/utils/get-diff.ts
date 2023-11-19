import {
	PROPERTY_TYPE_ACTION,
	PROPERTY_TYPE_GETTER,
	PROPERTY_TYPE_SILENT,
} from "./explore-exome-instance";

export const undefinedDiff = new (class {})();

const NORMAL_KEY_REGEXP = new RegExp(
	`^${PROPERTY_TYPE_GETTER}:`.replace(/(\$)/g, "\\$"),
);
const IGNORE_KEY_REGEXP = new RegExp(
	`^(${PROPERTY_TYPE_ACTION}|${PROPERTY_TYPE_SILENT}):`.replace(/(\$)/g, "\\$"),
);

function normalKey(key: string) {
	return key.replace(NORMAL_KEY_REGEXP, "");
}

export function getDiff(a: any, b: any) {
	if (a === b) {
		return undefined;
	}

	if (b === undefined && a !== undefined) {
		return undefinedDiff;
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
			return undefined;
		}

		const allKeys = aKeys.concat(bKeys);
		const output: Record<string, any> = {};

		for (const key of allKeys) {
			const diff = getDiff(a[key], b[key]);

			if (diff === undefined) {
				continue;
			}

			output[key] = diff;
		}

		if (!Object.keys(output).length) {
			return undefined;
		}

		return output;
	}

	return b;
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
