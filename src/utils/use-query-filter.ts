import { useState } from "preact/hooks";

export function filterQuery<T>(
	items: T[],
	query: string,
	label: (item: T) => string,
	fields: (item: T) => Record<string, unknown>,
) {
	const [name = "", ...rest] = query.toLowerCase().split(",");
	const parameter = rest.join(",").trim();
	const separator = parameter.indexOf("=");
	const key = (
		separator < 0 ? parameter : parameter.slice(0, separator)
	).trim();
	const value = separator < 0 ? "" : parameter.slice(separator + 1).trim();
	return items
		.filter(
			(item) =>
				label(item).toLowerCase().includes(name.trim()) &&
				(!key ||
					Object.entries(fields(item)).some(
						([k, v]) =>
							k.toLowerCase().includes(key) &&
							(!value ||
								(typeof v !== "object" &&
									typeof v !== "function" &&
									String(v).toLowerCase().includes(value))),
					)),
		)
		.sort(
			(a, b) =>
				label(a).toLowerCase().indexOf(name.trim()) -
				label(b).toLowerCase().indexOf(name.trim()),
		);
}

export function useQueryFilter<T>(
	items: T[],
	label: (item: T) => string,
	fields: (item: T) => Record<string, unknown>,
) {
	const [query, setQuery] = useState("");
	return [query, setQuery, filterQuery(items, query, label, fields)] as const;
}
