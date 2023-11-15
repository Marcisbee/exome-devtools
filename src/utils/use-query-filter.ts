import { useState } from "preact/hooks";

export function useQueryFilter<T extends any[] = any[]>(
	unfilteredList: T,
	get: (value: T[number]) => any = (a) => a,
) {
	const [query, setQuery] = useState("");
	const [queryInstance, queryParams = ""] = query.toLowerCase().split(",");
	const [queryKey, queryValue] = queryParams.split("=");

	const filteredList = unfilteredList
		.filter(
			(value) =>
				((get(value).toLowerCase() !== queryInstance &&
					get(value).toLowerCase().indexOf(queryInstance) > -1) ||
					get(value).toLowerCase() === queryInstance) &&
				(!queryKey ||
					Object.entries(value[1]).find(
						([k, v]) =>
							k.toLowerCase().indexOf(queryKey) > -1 &&
							(!queryValue ||
								(typeof v !== "function" &&
									typeof v !== "object" &&
									String(v).toLowerCase().indexOf(queryValue) > -1)),
					)),
		)
		.sort(
			(a, b) =>
				get(a).toLowerCase().indexOf(queryInstance) -
				get(b).toLowerCase().indexOf(queryInstance),
		);

	return [queryInstance, setQuery, filteredList as T] as const;
}
