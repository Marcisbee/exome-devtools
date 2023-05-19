export function getDiff(a: Record<string, any>, b: Record<string, any>) {
	const output: Record<string, any[]> = {};

	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	const allKeys = aKeys.concat(bKeys);

	for (const key of allKeys) {
		const aValue = a[key];
		const bValue = b[key];

		if (aValue === bValue) {
			continue;
		}

		if (output[key]) {
			continue;
		}

		output[key] = [
			aValue != null ? aValue : null,
			bValue != null ? bValue : null,
		];
	}

	return output;
}
