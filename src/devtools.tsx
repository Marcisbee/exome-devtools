import { Exome, getExomeId, onAction } from "exome";
import { Middleware, update } from "exome";
import { useStore } from "exome/preact";
import { render } from "preact";
import { useContext, useMemo, useState } from "preact/hooks";

import type {
	DevtoolsExtensionInterface,
	ExomeDevtoolsConfig,
} from "./protocol";

import {
	HistoryButtonBack,
	HistoryButtonNext,
} from "./components/history-button/history-button";
import styles from "./devtools.module.css";
import {
	HistoryStore,
	RouterOutlet,
	RouterStore,
	routerContext,
} from "./devtools/router";
import { RouteDevtoolsActions } from "./routes/actions";
import { RouteDevtoolsDetails } from "./routes/details";
import { RouteDevtoolsProfiler } from "./routes/profiler";
import { RouteDevtoolsState } from "./routes/state";
import {
	Action,
	DevtoolsActionsStore,
	DevtoolsEventStore,
	DevtoolsStore,
	devtoolsContext,
} from "./store";
import { targetExomeToJson } from "./utils/exome-to-json";
import { targetGetExomeName } from "./utils/get-exome-name";
import { useResize } from "./utils/use-resize";

const routes = {
	details: RouteDevtoolsDetails,
	actions: RouteDevtoolsActions,
	state: RouteDevtoolsState,
	profiler: RouteDevtoolsProfiler,
};

function Devtools() {
	// const [isOpen, setIsOpen] = useState(false);
	const { name } = useStore(useContext(devtoolsContext));
	const router = useMemo(() => new RouterStore("actions"), []);
	const { urlChunks, navigateMemoFirst } = useStore(router);
	// const maxHeight = useMemo(() => window.innerHeight / 1.5, []);
	// const [refResizeTarget, onMouseDown, height] = useResize(500, "n");

	// if (!isOpen) {
	// 	return (
	// 		<div className={styles.devtoolsLauncher}>
	// 			<button type="button" onClick={() => setIsOpen(true)}>
	// 				<svg
	// 					xmlns="http://www.w3.org/2000/svg"
	// 					width="184"
	// 					height="184"
	// 					fill="none"
	// 					viewBox="0 0 184 184"
	// 				>
	// 					<g
	// 						fill="currentColor"
	// 						fill-rule="evenodd"
	// 						clip-path="url(#a)"
	// 						clip-rule="evenodd"
	// 					>
	// 						<path d="M23 173Zm38-42-27 19A379 379 0 0 1 151 33l-20 28c5 6 9 14 10 22 32-37 49-70 39-80-11-11-60 19-109 68-49 48-79 98-67 109 9 10 42-7 79-39-8-1-16-5-22-10ZM174 23h-1 1Zm-13-13v1-1ZM11 161s-1 0 0 0Z" />
	// 						<path d="M11 23h1-1Zm76 75C64 74 45 52 34 34c8 5 17 11 26 19 7-6 14-9 23-11C46 11 13-5 4 4-8 15 22 65 71 113c49 49 98 79 110 68 9-10-8-43-40-80-1 8-5 15-10 22l20 27c-18-11-41-29-64-52Zm74 76v-1 1Zm13-13h-1 1ZM24 11c-1 0-1 0 0 0Z" />
	// 					</g>
	// 					<defs>
	// 						<clipPath id="a">
	// 							<path fill="#fff" d="M0 0h184v184H0z" />
	// 						</clipPath>
	// 					</defs>
	// 				</svg>
	// 			</button>
	// 		</div>
	// 	);
	// }

	return (
		<routerContext.Provider value={{ router, depth: 0 }}>
			<div
				// ref={refResizeTarget}
				className={styles.devtools}
				// style={{
				// 	height: Math.min(maxHeight, Math.max(300, height)),
				// }}
			>
				{/* <div className={styles.resizerTop} onMouseDown={onMouseDown} /> */}

				<div className={styles.head}>
					{/* <button
						type="button"
						onClick={() => setIsOpen(false)}
						className={styles.headClose}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								fill-rule="evenodd"
								d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 7a1 1 0 1 0-1 1l2 2-2 2a1 1 0 1 0 1 1l2-2 2 2a1 1 0 1 0 1-1l-2-2 2-2a1 1 0 1 0-1-1l-2 2-2-2z"
								clip-rule="evenodd"
							/>
						</svg>
					</button> */}

					<div className={styles.headTitle}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="184"
							height="184"
							fill="none"
							viewBox="0 0 184 184"
						>
							<g
								fill="#F5841B"
								fill-rule="evenodd"
								clip-path="url(#a)"
								clip-rule="evenodd"
							>
								<path d="M23 173Zm38-42-27 19A379 379 0 0 1 151 33l-20 28c5 6 9 14 10 22 32-37 49-70 39-80-11-11-60 19-109 68-49 48-79 98-67 109 9 10 42-7 79-39-8-1-16-5-22-10ZM174 23h-1 1Zm-13-13v1-1ZM11 161s-1 0 0 0Z" />
								<path d="M11 23h1-1Zm76 75C64 74 45 52 34 34c8 5 17 11 26 19 7-6 14-9 23-11C46 11 13-5 4 4-8 15 22 65 71 113c49 49 98 79 110 68 9-10-8-43-40-80-1 8-5 15-10 22l20 27c-18-11-41-29-64-52Zm74 76v-1 1Zm13-13h-1 1ZM24 11c-1 0-1 0 0 0Z" />
							</g>
							<defs>
								<clipPath id="a">
									<path fill="#fff" d="M0 0h184v184H0z" />
								</clipPath>
							</defs>
						</svg>
						<strong>{name}</strong>
						<HistoryButtonBack />
						<HistoryButtonNext />
					</div>

					<div>
						<button
							type="button"
							className={[
								styles.mainMenuButton,
								urlChunks[0] === "details" && styles.active,
							]
								.filter(Boolean)
								.join(" ")}
							onClick={() => {
								navigateMemoFirst("details", "details");
							}}
						>
							<span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="1em"
									height="1em"
									viewBox="0 0 24 24"
								>
									<g
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									>
										<circle cx="12" cy="12" r="10"></circle>
										<path d="M12 16v-4m0-4h.01"></path>
									</g>
								</svg>
								Details
							</span>
						</button>
						<button
							type="button"
							className={[
								styles.mainMenuButton,
								urlChunks[0] === "actions" && styles.active,
							]
								.filter(Boolean)
								.join(" ")}
							onClick={() => {
								navigateMemoFirst("actions", "actions");
							}}
						>
							<span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="1em"
									height="1em"
									viewBox="0 0 24 24"
								>
									<g
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									>
										<rect
											width="18"
											height="18"
											x="3"
											y="3"
											rx="2"
											ry="2"
										></rect>
										<path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3m-6 4.2h5.7"></path>
									</g>
								</svg>
								Actions
							</span>
						</button>
						<button
							type="button"
							className={[
								styles.mainMenuButton,
								urlChunks[0] === "state" && styles.active,
							]
								.filter(Boolean)
								.join(" ")}
							onClick={() => {
								navigateMemoFirst("state", "state");
							}}
						>
							<span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="1em"
									height="1em"
									viewBox="0 0 24 24"
								>
									<g
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									>
										<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
										<path d="M3 5v14a9 3 0 0 0 18 0V5"></path>
										<path d="M3 12a9 3 0 0 0 18 0"></path>
									</g>
								</svg>
								State
							</span>
						</button>
						{/* <button
							type="button"
							className={[
								styles.mainMenuButton,
								urlChunks[0] === "subscribers" && styles.active,
							]
								.filter(Boolean)
								.join(" ")}
							onClick={() => {
								navigateMemoFirst("subscribers", "subscribers");
							}}
							disabled
						>
							<span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="w-6 h-6"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
									/>
								</svg>
								Subscribers (WIP)
							</span>
						</button> */}
						<button
							type="button"
							className={[
								styles.mainMenuButton,
								urlChunks[0] === "profiler" && styles.active,
							]
								.filter(Boolean)
								.join(" ")}
							onClick={() => {
								navigateMemoFirst("profiler", "profiler");
							}}
							disabled
						>
							<span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="1em"
									height="1em"
									viewBox="0 0 24 24"
								>
									<g
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									>
										<path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
										<path d="M22 12A10 10 0 0 0 12 2v10z"></path>
									</g>
								</svg>
								Profiler (WIP)
							</span>
						</button>
					</div>
				</div>

				<RouterOutlet routes={routes} />
			</div>
		</routerContext.Provider>
	);
}

class ConnectionsStore extends Exome {
	public active?: DevtoolsStore;
	public connections: DevtoolsStore[] = [];

	public connect(connection: DevtoolsStore) {
		this.connections.push(connection);

		if (!this.active) {
			this.active = connection;
		}
	}

	public disconnect(connection: DevtoolsStore) {
		const index = this.connections.indexOf(connection);
		if (index < 0) return;
		this.connections.splice(index, 1);

		if (this.active === connection) {
			this.active = this.connections[0];
		}
	}

	public setActive(connection?: DevtoolsStore) {
		this.active = connection;
	}
}

const connectionsStore = new ConnectionsStore();

export function renderUI(target: HTMLElement) {
	if (typeof document === "undefined") {
		return () => {};
	}

	function ConnectionApp() {
		const { active, connections, setActive } = useStore(connectionsStore);

		if (!active) {
			return (
				<div className={styles.waitingForConnection}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="184"
						height="184"
						fill="none"
						viewBox="0 0 184 184"
					>
						<g
							fill="#F5841B"
							fill-rule="evenodd"
							clip-path="url(#a)"
							clip-rule="evenodd"
						>
							<path d="M23 173Zm38-42-27 19A379 379 0 0 1 151 33l-20 28c5 6 9 14 10 22 32-37 49-70 39-80-11-11-60 19-109 68-49 48-79 98-67 109 9 10 42-7 79-39-8-1-16-5-22-10ZM174 23h-1 1Zm-13-13v1-1ZM11 161s-1 0 0 0Z" />
							<path d="M11 23h1-1Zm76 75C64 74 45 52 34 34c8 5 17 11 26 19 7-6 14-9 23-11C46 11 13-5 4 4-8 15 22 65 71 113c49 49 98 79 110 68 9-10-8-43-40-80-1 8-5 15-10 22l20 27c-18-11-41-29-64-52Zm74 76v-1 1Zm13-13h-1 1ZM24 11c-1 0-1 0 0 0Z" />
						</g>
						<defs>
							<clipPath id="a">
								<path fill="#fff" d="M0 0h184v184H0z" />
							</clipPath>
						</defs>
					</svg>
					<strong>Waiting for Exome connections</strong>
					<div>
						<a
							href="https://exome.js.org/guides#devtools"
							target="_blank"
							rel="noreferrer"
						>
							Read more
						</a>
					</div>
				</div>
			);
		}

		return (
			<devtoolsContext.Provider value={active}>
				{connections.length > 1 && (
					<label>
						Connection{" "}
						<select
							aria-label="Connection"
							value={connections.indexOf(active)}
							onChange={(event) =>
								setActive(connections[Number(event.currentTarget.value)])
							}
						>
							{connections.map((connection, index) => (
								<option value={index}>
									{connection.name} ({index + 1})
								</option>
							))}
						</select>
					</label>
				)}
				<Devtools key={getExomeId(active)} />
			</devtoolsContext.Provider>
		);
	}

	render(<ConnectionApp />, target);

	return () => render(null, target);
}

(window as any).__EXOME_DEVTOOLS_EXTENSION__ = {
	connect(config) {
		const store = new DevtoolsStore(
			config.name,
			config.maxAge ?? 20,
			config.details,
		);

		connectionsStore.connect(store);

		let connected = true;
		const subscriptions = new Set<() => void>();
		Promise.resolve().then(() => {
			if (connected) store.events.sync();
		});

		return {
			disconnect() {
				if (!connected) return;
				connected = false;
				for (const unsubscribe of subscriptions) unsubscribe();
				subscriptions.clear();
				connectionsStore.disconnect(store);
			},
			send(data) {
				if (!connected) return;
				if (data.event === "send") {
					if (data.type === "states") {
						for (const [name, state] of data.payload) {
							store.actions.addInstance(name, state);
						}
						return;
					}

					if (data.type === "state") {
						store.actions.addInstance(data.payload[0], data.payload[1]);
						return;
					}

					if (data.type === "actions") {
						for (const action of data.payload) {
							store.actions.addAction(action);
						}
						return;
					}

					if (data.type === "action") {
						store.actions.addAction(data.payload);
						return;
					}

					return;
				}

				if (data.event === "update") {
					if (data.type === "state") {
						store.actions.updateInstance(
							data.payload[0],
							data.payload[1],
							data.payload[2],
						);
						return;
					}

					if (data.type === "action") {
						store.actions.updateAction(data.payload);
						return;
					}

					if (data.type === "all") {
						store.actions.replaceSnapshot(
							data.payload.states,
							data.payload.actions,
						);
						return;
					}

					return;
				}
			},
			subscribe(cb) {
				if (!connected) return () => {};
				const unsubscribe = onAction(
					DevtoolsEventStore,
					null,
					(instance, action, payload) => {
						if (instance !== store.events) {
							return;
						}

						if (action === "sync") {
							cb({ type: "sync" });
							return;
						}
					},
				);
				subscriptions.add(unsubscribe);
				return () => {
					if (subscriptions.delete(unsubscribe)) unsubscribe();
				};
			},
		};
	},
} satisfies DevtoolsExtensionInterface;
