import { Exome, Middleware, getExomeId, update } from "exome";
import { useStore } from "exome/preact";
import { render } from "preact";
import { useContext, useMemo } from "preact/hooks";

import styles from "./devtools.module.css";
import { exomeToJson } from "./utils/exome-to-json";
import { RouterOutlet, RouterStore, routerContext } from "./devtools/router";
import {
	Action,
	DevtoolsActionsStore,
	DevtoolsStore,
	devtoolsContext,
} from "./store";
import { RouteDevtoolsActions } from "./routes/actions";
import { getExomeName } from "./utils/get-exome-name";
import { RouteDevtoolsState } from "./routes/state";

interface DevtoolsProps {
	name: string;
	devtoolsStore: DevtoolsStore;
}

function Devtools({ name, devtoolsStore }: DevtoolsProps) {
	const router = useMemo(() => new RouterStore("actions"), []);
	const routes = useMemo(
		() => ({
			actions: RouteDevtoolsActions,
			state: RouteDevtoolsState,
			performance: RouteDevtoolsPerformance,
		}),
		[],
	);

	return (
		<devtoolsContext.Provider value={devtoolsStore}>
			<routerContext.Provider value={{ router, depth: 0 }}>
				<div className={styles.devtools}>
					<div className={styles.head}>
						<div>
							<strong>{name}</strong>
						</div>

						<div>
							<button
								type="button"
								onClick={() => {
									router.navigate("actions");
								}}
							>
								Actions
							</button>
							<button
								type="button"
								onClick={() => {
									router.navigate("state");
								}}
							>
								State
							</button>
							<button
								type="button"
								onClick={() => {
									router.navigate("performance");
								}}
							>
								Performance
							</button>
						</div>
					</div>

					<RouterOutlet routes={routes} />
				</div>
			</routerContext.Provider>
		</devtoolsContext.Provider>
	);
}

function RouteDevtoolsPerformance() {
	return (
		<div className={styles.body}>
			<DevtoolsPerformance />
		</div>
	);
}

function DevtoolsPerformance() {
	const store = useContext(devtoolsContext);
	const { actions } = useStore(store.actions);

	let nn = 0;

	return (
		<div style={{ flex: 1, width: "100%" }}>
			<div>Not fully implemented</div>
			<div
				style={{
					whiteSpace: "nowrap",
					backgroundColor: "#f0f0f0",
					padding: 10,
					overflowX: "scroll",
					overflowY: "hidden",
				}}
			>
				{actions.map(({ time, name, now, depth }, index) => {
					const diff = index ? now - nn : 0;

					if (index) {
						nn = now;
					}

					if (depth > 1) {
						return null;
					}

					return (
						<span
							style={{
								display: "inline-block",
								width: Math.max(Math.floor(time!), 3),
								overflow: "hidden",
								border: "1px solid #fff",
								backgroundColor: "orange",
								marginLeft: diff / 100,
							}}
						>
							{name}
						</span>
					);
				})}
			</div>
		</div>
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
		if (!(instance instanceof Exome)) {
			return;
		}

		if (instance instanceof DevtoolsStore) {
			return;
		}

		if (instance instanceof RouterStore) {
			return;
		}

		if (instance instanceof DevtoolsActionsStore) {
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
		const storeName = getExomeName(instance);

		if (ignoreListStores.indexOf(storeName) > -1) {
			return;
		}

		if (ignoreListActions.indexOf(`${storeName}.${name}`) > -1) {
			return;
		}

		const before = exomeToJson(instance);
		const id = String(Math.random());
		const trace = new Error().stack?.split("at ")[6] || "";

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
	};
}
