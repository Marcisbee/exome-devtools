import { Exome, getExomeId, onAction } from "exome";
import { Middleware, update } from "exome";
import { useStore } from "exome/preact";
import { render } from "preact";
import { useContext, useMemo, useState } from "preact/hooks";

import type {
	DevtoolsExtensionInterface,
	ExomeDevtoolsConfig,
} from "../lib/devtools-exome";

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
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="w-6 h-6"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
									/>
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
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
									/>
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
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
									/>
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
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
									/>
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
		this.connections.splice(this.connections.indexOf(connection), 1);

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
		const { active } = useStore(connectionsStore);

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
					<strong>No Exome connection found</strong>
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
				<Devtools />
			</devtoolsContext.Provider>
		);
	}

	render(<ConnectionApp />, target);

	// @TODO: Handle unmounting
	// function unmount() {
	// 	if ((target as any)._prevVNode != null) {
	// 		render(null, target);
	// 	}
	// }
}

(window as any).__EXOME_DEVTOOLS_EXTENSION__ = {
	connect(config) {
		const store = new DevtoolsStore(
			config.name,
			config.maxAge!,
			config.details,
		);

		connectionsStore.connect(store);

		Promise.resolve().then(store.events.sync);

		return {
			disconnect() {
				connectionsStore.disconnect(store);
			},
			send(data) {
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
						for (const state of data.payload.states) {
							store.actions.addInstance(state[0], state[1]);
						}

						store.actions.actions = [];
						for (const action of data.payload.actions) {
							store.actions.addAction(action);
						}
						return;
					}

					return;
				}
			},
			subscribe(cb) {
				return onAction(
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
			},
		};
	},
} satisfies DevtoolsExtensionInterface;
