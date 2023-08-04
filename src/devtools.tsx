import { Exome, Middleware, getExomeId, update } from "exome";
import { useStore } from "exome/preact";
import { render } from "preact";
import { useMemo, useState } from "preact/hooks";

import styles from "./devtools.module.css";
import { exomeToJson } from "./utils/exome-to-json";
import {
	HistoryStore,
	RouterOutlet,
	RouterStore,
	routerContext,
} from "./devtools/router";
import {
	Action,
	DevtoolsActionsStore,
	DevtoolsStore,
	devtoolsContext,
} from "./store";
import { RouteDevtoolsActions } from "./routes/actions";
import { getExomeName } from "./utils/get-exome-name";
import { RouteDevtoolsState } from "./routes/state";
import { RouteDevtoolsProfiler } from "./routes/profiler";
import { useResize } from "./utils/use-resize";
import { HistoryButtonBack, HistoryButtonNext } from "./components/history-button/history-button";

interface DevtoolsProps {
	name: string;
	devtoolsStore: DevtoolsStore;
}

const routes = {
	actions: RouteDevtoolsActions,
	state: RouteDevtoolsState,
	profiler: RouteDevtoolsProfiler,
};

function Devtools({ name, devtoolsStore }: DevtoolsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const router = useMemo(() => new RouterStore("actions"), []);
	const { urlChunks, navigateMemoFirst } = useStore(router);
	const maxHeight = useMemo(() => window.innerHeight / 1.5, []);
	const [refResizeTarget, onMouseDown, height] = useResize(500, "n");

	if (!isOpen) {
		return (
			<div className={styles.devtoolsLauncher}>
				<button type="button" onClick={() => setIsOpen(true)}>
					devtools
				</button>
			</div>
		);
	}

	return (
		<devtoolsContext.Provider value={devtoolsStore}>
			<routerContext.Provider value={{ router, depth: 0 }}>
				<div
					ref={refResizeTarget}
					className={styles.devtools}
					style={{
						height: Math.min(maxHeight, Math.max(300, height)),
					}}
				>
					<div className={styles.resizerTop} onMouseDown={onMouseDown} />

					<div className={styles.head}>
						<button
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
						</button>

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
									Profiler
								</span>
							</button>
						</div>
					</div>

					<RouterOutlet routes={routes} />
				</div>
			</routerContext.Provider>
		</devtoolsContext.Provider>
	);
}

interface InlineDevtoolsOptions {
	name: string;
	maxAge?: number;
	ignoreListActions?: string[];
	ignoreListStores?: string[];
}

export function inlineDevtools({
	name = "Exome",
	maxAge = 20,
	ignoreListActions = [],
	ignoreListStores = [],
}: InlineDevtoolsOptions): Middleware {
	if (typeof document === "undefined") {
		return () => {};
	}

	const target = document.createElement("div");
	document.body.appendChild(target);
	const devtoolsStore = new DevtoolsStore(maxAge);
	const { addAction, addInstance, count } = devtoolsStore.actions;

	render(<Devtools name={name} devtoolsStore={devtoolsStore} />, target);

	// @TODO: Handle unmounting
	// function unmount() {
	// 	if ((target as any)._prevVNode != null) {
	// 		render(null, target);
	// 	}
	// }

	let depth = 0;

	return (instance, name, payload) => {
		try {
			if (!(instance instanceof Exome)) {
				return;
			}

			if (instance instanceof DevtoolsStore) {
				return;
			}

			if (instance instanceof RouterStore) {
				return;
			}

			if (instance instanceof HistoryStore) {
				return;
			}

			if (instance instanceof DevtoolsActionsStore) {
				return;
			}

			const storeName = getExomeName(instance);

			if (ignoreListStores.indexOf(storeName) > -1) {
				return;
			}

			if (name === "NEW") {
				addInstance(instance);
				return;
			}

			if (name === "LOAD_STATE") {
				return;
			}

			const actionId = `${getExomeId(instance)}.${name}`;

			if (ignoreListActions.indexOf(`${storeName}.${name}`) > -1) {
				return;
			}

			const before = exomeToJson(instance);
			const id = String(Math.random());
			const trace = new Error().stack?.split(/\n/g)[6] || "";

			const start = performance.now();
			depth += 1;

			const action: Action = {
				id,
				name,
				instance,
				payload,
				now: start,
				depth,
				// time: performance.now() - start,
				trace,

				before,
			};

			addAction(action);

			return () => {
				action.time = performance.now() - start;
				action.after = exomeToJson(instance);
				count.get(actionId)!.push(action.time);

				depth -= 1;

				update(devtoolsStore.actions);
				// devtoolsStore.addAction({
				//   id: String(Math.random()),
				//   name,
				//   instance,
				//   payload,
				//   now: start,
				//   time: performance.now() - start,
				// });
			};
		} catch (_e) {
			// ignore
		}
	};
}
