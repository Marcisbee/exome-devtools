import { Exome } from "exome";
import { useStore } from "exome/preact";
import { ComponentType, createContext } from "preact";
import { useContext, useMemo } from "preact/hooks";

import { matchRoute } from "../utils/match-route";

export class RouterStore extends Exome {
	private memoRoutes: Record<string, string | undefined> = {};

	constructor(public url: string, public urlChunks: string[] = url.split("/")) {
		super();
	}

	public navigate(url: RouterStore["url"], memoKey?: string) {
		this.url = url;
		this.urlChunks = url.split("/");

		if (memoKey) {
			this.memoRoutes[memoKey] = url;
		}
	}

	public navigateMemoFirst(memoKey: string, fallbackUrl: RouterStore["url"]) {
		const url = this.memoRoutes[memoKey];

		if (url) {
			this.navigate(url);
			return;
		}

		this.navigate(fallbackUrl, memoKey);
	}
}

export const routerContext = createContext<{
	router: RouterStore;
	depth: number;
	params?: Record<string, any>;
}>(null as any);

interface RouterOutletProps {
	routes: Record<string, ComponentType>;
}

export function RouterOutlet({ routes }: RouterOutletProps) {
	const { router, depth } = useContext(routerContext);
	const { url, urlChunks } = useStore(router);

	const routesKeys = useMemo(() => Object.keys(routes), [routes]);
	let RouteComponent: ComponentType | undefined;
	let routeParams: Record<string, any> | undefined;
	let routeUrl: string | undefined;

	const testUrl = urlChunks.slice(depth).join("/");

	for (const routeKey of routesKeys) {
		const match = matchRoute(routeKey, testUrl);

		if (match || routeKey === "*") {
			RouteComponent = routes[routeKey];
			routeUrl = routeKey;
			routeParams = match?.groups;
			break;
		}
	}

	return (
		<routerContext.Provider
			value={useMemo(
				() => ({
					router,
					depth: depth + (routeUrl?.split("/").length || 0),
					params: routeParams,
				}),
				[url],
			)}
		>
			{RouteComponent ? <RouteComponent /> : null}
		</routerContext.Provider>
	);
}
