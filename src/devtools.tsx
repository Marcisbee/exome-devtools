import { Exome, Middleware, getExomeId, update } from "exome";
import { useStore } from "exome/preact";
import { createContext, render } from "preact";
import { useContext, useMemo, useState } from "preact/hooks";

import styles from "./devtools.module.css";
import { hexToColor, lerpMultipleColors } from "./utils/color-lerp";
import { exploreExomeInstance } from "./utils/explore-exome-instance";
import { exomeToJson } from "./utils/exome-to-json";
import { getDiff } from "./utils/get-diff";
import { RouterOutlet, RouterStore, routerContext } from "./devtools/router";

function getExomeName(instance: Exome) {
	return getExomeId(instance).replace(/-[a-z0-9]+$/gi, "");
}

const timingColor = lerpMultipleColors({
	0: 0x8bc34a,
	1: 0xf44336,
});

function getTimingColor(time?: number) {
	if (time == null) {
		return;
	}

	return hexToColor(timingColor(Math.min(1, time / 100)));
}

interface Action {
	id: string;
	name: string;
	payload: any[];
	instance: Exome;
	depth: number;
	now: number;
	time?: number;
	trace: string;
	before: Record<string, any>;
	after?: Record<string, any>;
}

class DevtoolsActionsStore extends Exome {
	public actions: Action[] = [];
	public instances = new Map<string, Exome>();
	public count = new Map<string, number[]>();

	constructor(public maxAge: number) {
		super();
	}

	public addAction(action: Action) {
		this.actions.push(action);

		const actionId = `${getExomeId(action.instance)}.${action.name}`;
		if (!this.count.has(actionId)) {
			this.count.set(actionId, []);
		}

		if (this.actions.length > this.maxAge) {
			this.actions.shift();
		}
	}

	public addInstance(instance: Exome) {
		this.instances.set(getExomeId(instance), instance);
	}
}

class DevtoolsStore extends Exome {
	public actions: DevtoolsActionsStore;

	constructor(public maxAge: number) {
		super();

		this.actions = new DevtoolsActionsStore(maxAge);
	}
}

const devtoolsContext = createContext<DevtoolsStore>(null as any);

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

function RouteDevtoolsActions() {
	const routes = useMemo(
		() => ({
			$actionId: DevtoolsActionsContent,
			"*": DevtoolsActionsContent,
		}),
		[],
	);

	return (
		<div className={styles.body}>
			<DevtoolsActionsList />
			<RouterOutlet routes={routes} />
		</div>
	);
}

function RouteDevtoolsState() {
	return (
		<div className={styles.body}>
			<DevtoolsState />
		</div>
	);
}

function RouteDevtoolsPerformance() {
	return (
		<div className={styles.body}>
			<DevtoolsPerformance />
		</div>
	);
}

function DevtoolsActionsList() {
	const { router } = useContext(routerContext);
	const { url, navigate } = useStore(router);
	const devtoolsStore = useContext(devtoolsContext);
	const { actions } = useStore(devtoolsStore.actions);

	return (
		<div className={styles.actionsLeft}>
			{actions.map(({ id, depth, instance, name, time }) => {
				const actionUrl = `actions/${id}`;

				return (
					<button
						key={id}
						type="button"
						className={[styles.actionButton, url === actionUrl && styles.action]
							.filter(Boolean)
							.join(" ")}
						onClick={() => {
							navigate(actionUrl);
						}}
					>
						<small style={{ opacity: 0.4 }}>
							{getExomeName(instance)}
							<br />
						</small>
						{new Array(depth - 1).fill(null).map(() => (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="1em"
								height="1em"
								viewBox="0 0 256 256"
								style={{
									width: 16,
									height: 16,
									marginTop: -2,
									marginLeft: -5,
									color: "inherit",
								}}
							>
								<path
									fill="currentColor"
									d="M136 128a8 8 0 1 1-8-8a8 8 0 0 1 8 8Z"
								/>
							</svg>
						))}
						<span>
							{name}{" "}
							{time === undefined ? (
								<small style={{ opacity: 0.4 }}>waiting...</small>
							) : (
								<small
									style={{
										color: getTimingColor(time),
									}}
								>
									({time.toFixed(1)}ms)
								</small>
							)}
						</span>
					</button>
				);
			})}
		</div>
	);
}

function DevtoolsActionsContent() {
	const store = useContext(devtoolsContext);
	const { params } = useContext(routerContext);
	const { actions } = useStore(store.actions);
	const action = actions.find(({ id }) => params?.actionId === id);

	if (!action) {
		return <div className={styles.actionsRight}>No Action Selected</div>;
	}

	const instanceName = getExomeName(action.instance);

	const diff = getDiff(action.before, action.after || {});

	return (
		<div className={styles.actionsRight}>
			<h3>
				<span>{instanceName}.</span>
				<strong>{action.name}</strong>
			</h3>

			<br />

			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="1em"
					height="1em"
					viewBox="0 0 256 256"
				>
					<g fill="currentColor">
						<path
							d="M216 136a88 88 0 1 1-88-88a88 88 0 0 1 88 88Z"
							opacity=".2"
						/>
						<path d="M128 40a96 96 0 1 0 96 96a96.11 96.11 0 0 0-96-96Zm0 176a80 80 0 1 1 80-80a80.09 80.09 0 0 1-80 80Zm45.66-125.66a8 8 0 0 1 0 11.32l-40 40a8 8 0 0 1-11.32-11.32l40-40a8 8 0 0 1 11.32 0ZM96 16a8 8 0 0 1 8-8h48a8 8 0 0 1 0 16h-48a8 8 0 0 1-8-8Z" />
					</g>
				</svg>
				Timing:{" "}
				<span
					style={{
						color: getTimingColor(action.time),
					}}
				>
					{action.time === undefined ? "Waiting..." : action.time.toFixed(1)}
					<small>ms</small>
				</span>
			</div>

			<br />

			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="1em"
					height="1em"
					viewBox="0 0 256 256"
				>
					<g fill="currentColor">
						<path
							d="M240 120v64a8 8 0 0 1-8 8h-24a24 24 0 0 0-32-22.63A24 24 0 0 0 160 192H96a24 24 0 0 0-48 0H24a8 8 0 0 1-8-8v-40h160v-24Z"
							opacity=".2"
						/>
						<path d="m247.42 117l-14-35a15.93 15.93 0 0 0-14.84-10H184v-8a8 8 0 0 0-8-8H24A16 16 0 0 0 8 72v112a16 16 0 0 0 16 16h17a32 32 0 0 0 62 0h50a32 32 0 0 0 62 0h17a16 16 0 0 0 16-16v-64a7.94 7.94 0 0 0-.58-3ZM184 88h34.58l9.6 24H184ZM24 72h144v64H24Zm48 136a16 16 0 1 1 16-16a16 16 0 0 1-16 16Zm81-24h-50a32 32 0 0 0-62 0H24v-32h144v12.31A32.11 32.11 0 0 0 153 184Zm31 24a16 16 0 1 1 16-16a16 16 0 0 1-16 16Zm48-24h-17a32.06 32.06 0 0 0-31-24v-32h48Z" />
					</g>
				</svg>
				Payload:
				<pre
					style={{
						padding: 10,
						backgroundColor: "#f0f0f0",
						fontSize: 10,
						width: "100%",
					}}
				>
					{JSON.stringify(
						action.payload,
						(_key, value) => {
							if (value == null || typeof value !== "object") {
								return value;
							}

							if (value instanceof Exome) {
								return {
									$$exome_id: getExomeId(value),
								};
							}

							if (
								value.constructor !== Array &&
								value.constructor !== Object &&
								value.constructor !== Date
							) {
								return {
									$$exome_class: value.constructor.name,
								};
							}

							return value;
						},
						2,
					)}
				</pre>
			</div>

			<br />

			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="1em"
					height="1em"
					viewBox="0 0 256 256"
				>
					<g fill="currentColor">
						<path
							d="M96 96v64H40V40h120v56Zm64 0v64H96v56h120V96Z"
							opacity=".2"
						/>
						<path d="M216 88h-48V40a8 8 0 0 0-8-8H40a8 8 0 0 0-8 8v120a8 8 0 0 0 8 8h48v48a8 8 0 0 0 8 8h120a8 8 0 0 0 8-8V96a8 8 0 0 0-8-8ZM48 152V48h104v40H96a8 8 0 0 0-8 8v56Zm104-48v48h-48v-48Zm56 104H104v-40h56a8 8 0 0 0 8-8v-56h40Z" />
					</g>
				</svg>
				Diff:
				<pre
					style={{
						padding: 10,
						backgroundColor: "#f0f0f0",
						fontSize: 10,
						width: "100%",
					}}
				>
					{Object.entries(diff).map(([key, [before, after]]) => (
						<div>
							<strong>{key}</strong>:{" "}
							<span>
								<mark style={{ backgroundColor: "#ef9a9a" }}>
									{JSON.stringify(before, null, 1)}
								</mark>
								{" => "}
								<mark style={{ backgroundColor: "#9ccc65" }}>
									{JSON.stringify(after, null, 1)}
								</mark>
							</span>
						</div>
					))}
				</pre>
			</div>

			<br />

			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="1em"
					height="1em"
					viewBox="0 0 256 256"
				>
					<g fill="currentColor">
						<path
							d="M216 80c0 26.51-39.4 48-88 48s-88-21.49-88-48s39.4-48 88-48s88 21.49 88 48Z"
							opacity=".2"
						/>
						<path d="M128 24c-53.83 0-96 24.6-96 56v96c0 31.4 42.17 56 96 56s96-24.6 96-56V80c0-31.4-42.17-56-96-56Zm80 104c0 9.62-7.88 19.43-21.61 26.92C170.93 163.35 150.19 168 128 168s-42.93-4.65-58.39-13.08C55.88 147.43 48 137.62 48 128v-16.64c17.06 15 46.23 24.64 80 24.64s62.94-9.68 80-24.64ZM69.61 53.08C85.07 44.65 105.81 40 128 40s42.93 4.65 58.39 13.08C200.12 60.57 208 70.38 208 80s-7.88 19.43-21.61 26.92C170.93 115.35 150.19 120 128 120s-42.93-4.65-58.39-13.08C55.88 99.43 48 89.62 48 80s7.88-19.43 21.61-26.92Zm116.78 149.84C170.93 211.35 150.19 216 128 216s-42.93-4.65-58.39-13.08C55.88 195.43 48 185.62 48 176v-16.64c17.06 15 46.23 24.64 80 24.64s62.94-9.68 80-24.64V176c0 9.62-7.88 19.43-21.61 26.92Z" />
					</g>
				</svg>
				Instance:
				<pre
					style={{
						padding: 10,
						backgroundColor: "#f0f0f0",
						fontSize: 10,
						width: "100%",
					}}
				>
					{JSON.stringify(
						action.after,
						(key, value) => {
							if (value == null || typeof value !== "object") {
								return value;
							}

							if (value instanceof Exome && key !== "") {
								return {
									$$exome_id: getExomeId(value),
								};
							}

							if (
								value.constructor.name !== "Array" &&
								value.constructor.name !== "Object" &&
								value.constructor.name !== "Date" &&
								key !== ""
							) {
								return {
									$$exome_class: value.constructor.name,
								};
							}

							return value;
						},
						2,
					)}
				</pre>
			</div>

			<br />

			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="1em"
					height="1em"
					viewBox="0 0 256 256"
				>
					<g fill="currentColor">
						<path
							d="m240 112l-36 40H40a8 8 0 0 1-8-8V80a8 8 0 0 1 8-8h164Z"
							opacity=".2"
						/>
						<path d="m246 106.65l-36-40a8 8 0 0 0-6-2.65h-68V32a8 8 0 0 0-16 0v32H40a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h80v64a8 8 0 0 0 16 0v-64h68a8 8 0 0 0 5.95-2.65l36-40a8 8 0 0 0 .05-10.7ZM200.44 144H40V80h160.44l28.8 32Z" />
					</g>
				</svg>
				Trace: <i>{action.trace}</i>{" "}
				<button type="button" onClick={() => console.log(action.trace)}>
					push to console
				</button>
			</div>
		</div>
	);
}

function DevtoolsState() {
	const store = useContext(devtoolsContext);
	const [active, setActive] = useState<string | null>();
	const { instances, count } = useStore(store.actions);

	const instanceDetails = active
		? exploreExomeInstance(instances.get(active)!)
		: undefined;

	return (
		<>
			<div className={styles.actionsLeft}>
				{[...instances.entries()].map(([key, value]) => (
					<button
						key={`state-${key}`}
						type="button"
						className={[styles.actionButton, active === key && styles.action]
							.filter(Boolean)
							.join(" ")}
						onClick={() => {
							setActive(key);
						}}
					>
						<small style={{ opacity: 0.4 }}>
							{key.split("-").pop()}
							<br />
						</small>
						<span>{getExomeName(value)}</span>
					</button>
				))}
			</div>

			<div className={styles.actionsRight}>
				{active && instanceDetails ? (
					<>
						<h3>{active}</h3>

						<br />

						<div>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="1em"
								height="1em"
								viewBox="0 0 256 256"
							>
								<g fill="currentColor">
									<path
										d="M216 80c0 26.51-39.4 48-88 48s-88-21.49-88-48s39.4-48 88-48s88 21.49 88 48Z"
										opacity=".2"
									/>
									<path d="M128 24c-53.83 0-96 24.6-96 56v96c0 31.4 42.17 56 96 56s96-24.6 96-56V80c0-31.4-42.17-56-96-56Zm80 104c0 9.62-7.88 19.43-21.61 26.92C170.93 163.35 150.19 168 128 168s-42.93-4.65-58.39-13.08C55.88 147.43 48 137.62 48 128v-16.64c17.06 15 46.23 24.64 80 24.64s62.94-9.68 80-24.64ZM69.61 53.08C85.07 44.65 105.81 40 128 40s42.93 4.65 58.39 13.08C200.12 60.57 208 70.38 208 80s-7.88 19.43-21.61 26.92C170.93 115.35 150.19 120 128 120s-42.93-4.65-58.39-13.08C55.88 99.43 48 89.62 48 80s7.88-19.43 21.61-26.92Zm116.78 149.84C170.93 211.35 150.19 216 128 216s-42.93-4.65-58.39-13.08C55.88 195.43 48 185.62 48 176v-16.64c17.06 15 46.23 24.64 80 24.64s62.94-9.68 80-24.64V176c0 9.62-7.88 19.43-21.61 26.92Z" />
								</g>
							</svg>
							State:
							<pre
								style={{
									padding: 10,
									backgroundColor: "#f0f0f0",
									fontSize: 10,
									width: "100%",
								}}
							>
								{instanceDetails.state.map((name) => (
									<div>
										<strong>{name}</strong>:{" "}
										<span>
											{JSON.stringify(
												(instances.get(active) as any)[name],
												null,
												2,
											)}
										</span>
									</div>
								))}

								{instanceDetails.getters.map((name) => (
									<div>
										<strong>
											{name} <mark>getter</mark>
										</strong>
										: <button type="button">show value</button>
									</div>
								))}
							</pre>
						</div>

						<br />

						<div>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="1em"
								height="1em"
								viewBox="0 0 256 256"
							>
								<g fill="currentColor">
									<path
										d="M216 80c0 26.51-39.4 48-88 48s-88-21.49-88-48s39.4-48 88-48s88 21.49 88 48Z"
										opacity=".2"
									/>
									<path d="M128 24c-53.83 0-96 24.6-96 56v96c0 31.4 42.17 56 96 56s96-24.6 96-56V80c0-31.4-42.17-56-96-56Zm80 104c0 9.62-7.88 19.43-21.61 26.92C170.93 163.35 150.19 168 128 168s-42.93-4.65-58.39-13.08C55.88 147.43 48 137.62 48 128v-16.64c17.06 15 46.23 24.64 80 24.64s62.94-9.68 80-24.64ZM69.61 53.08C85.07 44.65 105.81 40 128 40s42.93 4.65 58.39 13.08C200.12 60.57 208 70.38 208 80s-7.88 19.43-21.61 26.92C170.93 115.35 150.19 120 128 120s-42.93-4.65-58.39-13.08C55.88 99.43 48 89.62 48 80s7.88-19.43 21.61-26.92Zm116.78 149.84C170.93 211.35 150.19 216 128 216s-42.93-4.65-58.39-13.08C55.88 195.43 48 185.62 48 176v-16.64c17.06 15 46.23 24.64 80 24.64s62.94-9.68 80-24.64V176c0 9.62-7.88 19.43-21.61 26.92Z" />
								</g>
							</svg>
							Actions:
							<pre
								style={{
									padding: 10,
									backgroundColor: "#f0f0f0",
									fontSize: 10,
									width: "100%",
								}}
							>
								{instanceDetails.actions.map((name) => {
									const actionCount = count.get(
										`${getExomeId(instances.get(active)!)}.${name}`,
									);
									const fnString = Object.getOwnPropertyDescriptor(
										Object.getPrototypeOf(instances.get(active)!),
										name,
									)?.value.toString();

									return (
										<div>
											<strong title={fnString}>{name} </strong>

											<span>
												{JSON.stringify(
													!actionCount
														? {
																times: 0,
														  }
														: {
																times: actionCount.length,
																avgTime: `${(
																	actionCount.reduce((a, b) => a + b, 0) /
																	actionCount.length
																).toFixed(1)}ms`,
														  },
												)}
											</span>
										</div>
									);
								})}

								{instanceDetails.silentActions.map((name) => (
									<div>
										<strong>
											{name} <mark>silent</mark>
										</strong>
									</div>
								))}
							</pre>
						</div>
					</>
				) : (
					<div>No store selected</div>
				)}
			</div>
		</>
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
