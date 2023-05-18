import { Exome, Middleware, getExomeId, update } from "exome";
import { useStore } from "exome/preact";
import { render } from "preact";
import { useState } from "preact/hooks";

import styles from './devtools.module.css';

function getExomeName(instance: Exome) {
	return getExomeId(instance).replace(/-[a-z0-9]+$/gi, "");
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
}

class DevtoolsActionsStore extends Exome {
	public active?: string;
	public actions: Action[] = [];
	public instances = new Map<string, Exome>();

	constructor(public maxAge: number) {
		super();
	}

	public setActive(active: string) {
		this.active = active;
	}

	public addAction(action: Action) {
		this.actions.push(action);

		if (this.actions.length > this.maxAge) {
			this.actions.shift();
		}
	}

	public addInstance(instance: Exome) {
		this.instances.set(getExomeId(instance), instance);
	}
}

class DevtoolsStore extends Exome {
	public tab: "actions" | "state" | "performance" = "actions";
	public actions: DevtoolsActionsStore;

	constructor(public maxAge: number) {
		super();

		this.actions = new DevtoolsActionsStore(maxAge);
	}

	public setTab(tab: DevtoolsStore["tab"]) {
		this.tab = tab;
	}
}

interface DevtoolsProps {
	name: string;
	devtoolsStore: DevtoolsStore;
}

function Devtools({ name, devtoolsStore }: DevtoolsProps) {
	const { actions, tab, setTab } = useStore(devtoolsStore);

	return (
		<div className={styles.devtools}>
			<div className={styles.head}>
				<div>
					<strong>{name}</strong>
				</div>

				<div>
					<button type="button" onClick={() => setTab("actions")}>
						Actions
					</button>
					<button type="button" onClick={() => setTab("state")}>
						State
					</button>
					<button type="button" onClick={() => setTab("performance")}>
						Performance
					</button>
				</div>
			</div>

			{tab === "actions" && (
				<div className={styles.body}>
					<DevtoolsActionsList store={actions} />
					<DevtoolsActionsContent store={devtoolsStore} />
				</div>
			)}

			{tab === "state" && (
				<div className={styles.body}>
					<DevtoolsState store={devtoolsStore} />
				</div>
			)}

			{tab === "performance" && (
				<div className={styles.body}>
					<DevtoolsPerformance store={devtoolsStore} />
				</div>
			)}
		</div>
	);
}

interface DevtoolsActionsListProps {
	store: DevtoolsActionsStore;
}

function DevtoolsActionsList({ store }: DevtoolsActionsListProps) {
	const { active, actions, setActive } = useStore(store);

	return (
		<div className={styles.actionsLeft}>
			{actions.map(({ id, depth, instance, name, time }) => {
				return (
					<button
						key={id}
						type="button"
						className={[styles.actionButton, active === id && styles.action]
							.filter(Boolean)
							.join(" ")}
						onClick={() => {
							setActive(id);
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
								<small style={{ opacity: 0.4 }}>({time.toFixed(1)}ms)</small>
							)}
						</span>
					</button>
				);
			})}
		</div>
	);
}

interface DevtoolsActionsContentProps {
	store: DevtoolsStore;
}

function DevtoolsActionsContent({ store }: DevtoolsActionsContentProps) {
	const { actions, active } = useStore(store.actions);
	const action = actions.find(({ id }) => active === id);

	if (!action) {
		return <div className={styles.actionsRight}>No Action Selected</div>;
	}

	const instanceName = getExomeName(action.instance);

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
				{action.time === undefined ? "Waiting..." : action.time.toFixed(1)}
				<small>ms</small>
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
							d="M224 200a24 24 0 1 1-24-24a24 24 0 0 1 24 24Z"
							opacity=".2"
						/>
						<path d="M200 168a32.06 32.06 0 0 0-31 24H72a32 32 0 0 1 0-64h96a40 40 0 0 0 0-80H72a8 8 0 0 0 0 16h96a24 24 0 0 1 0 48H72a48 48 0 0 0 0 96h97a32 32 0 1 0 31-40Zm0 48a16 16 0 1 1 16-16a16 16 0 0 1-16 16Z" />
					</g>
				</svg>
				Trace: {action.trace}{" "}
				<button type="button" onClick={() => console.log(action.trace)}>
					push to console
				</button>
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
							d="M240 120v64a8 8 0 0 1-8 8h-24a24 24 0 0 0-32-22.63A24 24 0 0 0 160 192H96a24 24 0 0 0-48 0H24a8 8 0 0 1-8-8v-40h160v-24Z"
							opacity=".2"
						/>
						<path d="m247.42 117l-14-35a15.93 15.93 0 0 0-14.84-10H184v-8a8 8 0 0 0-8-8H24A16 16 0 0 0 8 72v112a16 16 0 0 0 16 16h17a32 32 0 0 0 62 0h50a32 32 0 0 0 62 0h17a16 16 0 0 0 16-16v-64a7.94 7.94 0 0 0-.58-3ZM184 88h34.58l9.6 24H184ZM24 72h144v64H24Zm48 136a16 16 0 1 1 16-16a16 16 0 0 1-16 16Zm81-24h-50a32 32 0 0 0-62 0H24v-32h144v12.31A32.11 32.11 0 0 0 153 184Zm31 24a16 16 0 1 1 16-16a16 16 0 0 1-16 16Zm48-24h-17a32.06 32.06 0 0 0-31-24v-32h48Z" />
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
						action.instance,
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
		</div>
	);
}

interface DevtoolsStateProps {
	store: DevtoolsStore;
}

function DevtoolsState({ store }: DevtoolsStateProps) {
	const [active, setActive] = useState<string | null>();
	const { instances } = useStore(store.actions);

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
				{active ? (
					<>
						<div>
							<strong>{active}</strong>
						</div>

						<br />

						<div>
							State:
							<pre
								style={{
									padding: 10,
									backgroundColor: "#f0f0f0",
									fontSize: 10,
									width: "100%",
								}}
							>
								{JSON.stringify(
									{ ...instances.get(active) },
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
							Actions:
							<pre
								style={{
									padding: 10,
									backgroundColor: "#f0f0f0",
									fontSize: 10,
									width: "100%",
								}}
							>
								{JSON.stringify(
									Object.getOwnPropertyNames(
										Object.getPrototypeOf(instances.get(active)),
									).filter(
										(key) =>
											key !== "constructor" &&
											typeof Object.getOwnPropertyDescriptor(
												Object.getPrototypeOf(instances.get(active)),
												key,
											)?.get !== "function",
									),
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
					</>
				) : (
					<div>No store selected</div>
				)}
			</div>
		</>
	);
}

interface DevtoolsPerformanceProps {
	store: DevtoolsStore;
}

function DevtoolsPerformance({ store }: DevtoolsPerformanceProps) {
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
	const { addAction, addInstance } = devtoolsStore.actions;

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

		const storeName = getExomeName(instance);

		if (ignoreListStores.indexOf(storeName) > -1) {
			return;
		}

		if (ignoreListActions.indexOf(`${storeName}.${name}`) > -1) {
			return;
		}

		const start = performance.now();
		depth += 1;

		const action: Action = {
			id: String(Math.random()),
			name,
			instance,
			payload,
			now: start,
			depth,
			// time: performance.now() - start,
			trace: new Error().stack?.split("at ")[6] || "",
		};

		addAction(action);

		return () => {
			action.time = performance.now() - start;
			depth -= 1;

			update(devtoolsStore);
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
