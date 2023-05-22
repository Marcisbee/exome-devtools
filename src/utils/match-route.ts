const cachedNormalRoutes: Record<string, string> = {};
const cachedSourceRoutes: Record<string, RegExp> = {};

function normalizeRoute(route: string): string {
	return (cachedNormalRoutes[route] ??= route
		.replace(/\/{2,}/g, "/")
		.replace(/^\/|\/$/g, ""));
}

function normalizeSourceRoute(route: string) {
	return (cachedSourceRoutes[route] ??= new RegExp(
		`^${normalizeRoute(route)
			.replace(/\*/g, "\\*")
			.replace(/\./g, "\\.")
			.replace(/\$([^\/$]+)/g, "(?<$1>[^\\/$]+)")}`,
	));
}

export function matchRoute(route: string, currentUrl: string) {
	const a = normalizeSourceRoute(route);
	const b = normalizeRoute(currentUrl);

	return b.match(a);
}
