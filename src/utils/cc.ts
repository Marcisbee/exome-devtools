export function cc(names: (string | boolean | null | undefined)[]) {
	return names.filter(Boolean).join(" ");
}
