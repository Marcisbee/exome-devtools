import { useState } from "preact/hooks";

export function useQueryFilter<T extends any[] = any[]>(
	unfilteredList: T,
	get: (value: T[number]) => any = (a) => a,
) {
	const [query, setQuery] = useState("");
	const filteredList = unfilteredList
		.filter(
			(value) =>
				get(value).toLowerCase() !== query &&
				get(value).toLowerCase().indexOf(query) > -1,
		)
		.sort(
			(a, b) =>
				get(a).toLowerCase().indexOf(query) -
				get(b).toLowerCase().indexOf(query),
		);

	return [query, setQuery, filteredList as T] as const;
}
