export const undefinedDiff = new (class {})();

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
