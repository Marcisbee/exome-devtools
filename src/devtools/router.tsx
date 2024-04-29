import { Exome, update } from "exome";
import { useStore } from "exome/preact";
import { ComponentType, createContext } from "preact";
import { useContext, useMemo } from "preact/hooks";

import { matchRoute } from "../utils/match-route";

export class HistoryStore extends Exome {
	private _past: string[] = [];
	private _future: string[] = [];

	public get canGoBack() {
		return this._past.length > 0;
	}

	public get canGoNext() {
		return this._future.length > 0;
	}

	constructor(private router: RouterStore) {
		super();
	}

	public back() {
		this._future.push(this.router.url);
		this.go(this._past.pop()!);
	}

	public next() {
		this._past.push(this.router.url);
		this.go(this._future.pop()!);
	}

	public addHistory(url: string) {
		this._past.push(url);
		this._future.splice(0, this._future.length);

		if (this._past.length > 10) {
			this._past.shift();
		}
	}

	private go(url: string) {
		this.router.url = url;
		this.router.urlChunks = url.split("/");

		update(this.router);
	}
}

export class RouterStore extends Exome {
	public history = new HistoryStore(this);

	private memoRoutes: Record<string, string | undefined> = {};

	constructor(
		public url: string,
		public urlChunks: string[] = url.split("/"),
	) {
		super();
	}

	public navigate(url: RouterStore["url"], memoKey?: string) {
		this.history.addHistory(this.url);

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
