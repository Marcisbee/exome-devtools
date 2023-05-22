import { type Exome, getExomeId } from "exome";
import { useStore } from "exome/preact";
import { useContext } from "preact/hooks";

import { DevtoolsActionsStore, devtoolsContext } from "../store";
import { RouterOutlet, routerContext } from "../devtools/router";
import { getExomeName } from "../utils/get-exome-name";
import { exploreExomeInstance } from "../utils/explore-exome-instance";
import { GetterValue } from "../components/getter-value/getter-value";
import styles from "../devtools.module.css";

const routes = {
	$storeId: DevtoolsStateContent,
	"*": DevtoolsStateContent,
};

interface StoreExploreProps {
	instance: Exome;
	count: DevtoolsActionsStore["count"];
}

function StoreExplore({ instance, count }: StoreExploreProps) {
	const instanceDetails = exploreExomeInstance(instance);

	return (
		<div>
			<div style={{ marginBottom: 10 }}>
				<input placeholder="Filter" type="text" style={{ float: "right" }} />
				<h3 style={{ color: "#fb8c00" }}>{getExomeName(instance)}</h3>
			</div>

			<pre
				style={{
					padding: 10,
					backgroundColor: "#fff",
					fontSize: 12,
					width: "100%",
					borderTop: "1px solid #ccc",
				}}
			>
				<span style={{ display: "block", marginBottom: 10, color: "#ccc" }}>
					state
				</span>

				{instanceDetails.state.map((name) => (
					<div
						style={{
							paddingLeft: 20,
							marginBottom: 8,
						}}
					>
						<span style={{ color: "#673ab7" }}>{name}</span>:{" "}
						<span style={{ color: "#222" }}>
							{JSON.stringify((instance as any)[name], null, 2)}
						</span>
					</div>
				))}

				{instanceDetails.getters.map((name) => (
					<div
						style={{
							paddingLeft: 20,
							marginBottom: 8,
						}}
					>
						<span style={{ color: "#673ab7" }}>
							{name}{" "}
							<i style={{ fontWeight: "normal", opacity: 0.5, fontSize: 10 }}>
								(getter)
							</i>
						</span>
						:{" "}
						<span style={{ color: "#222" }}>
							<GetterValue
								key={`getter::${name}::${Math.random()}`}
								source={instance}
								field={name}
							/>
						</span>
					</div>
				))}
			</pre>

			<pre
				style={{
					padding: 10,
					backgroundColor: "#fff",
					fontSize: 12,
					width: "100%",
					borderTop: "1px solid #ccc",
				}}
			>
				<span style={{ display: "block", marginBottom: 10, color: "#ccc" }}>
					actions
				</span>

				{instanceDetails.actions.map((name) => {
					const actionCount = count.get(`${getExomeId(instance)}.${name}`);
					const fnString = Object.getOwnPropertyDescriptor(
						Object.getPrototypeOf(instance),
						name,
					)?.value.toString();

					return (
						<div
							style={{
								paddingLeft: 20,
								marginBottom: 8,
							}}
						>
							<span title={fnString} style={{ color: "#673ab7" }}>
								{name}(){" "}
							</span>

							{actionCount?.length ? (
								<span>
									<span
										style={{
											display: "inline-block",
											padding: "0 5px",
											backgroundColor: "#f0f0f0",
										}}
									>
										{actionCount.length}x
									</span>
									<span
										style={{
											display: "inline-block",
											borderLeft: "2px solid #fff",
											padding: "0 5px",
											backgroundColor: "#f5f5f5",
										}}
									>{`~${(
										actionCount.reduce((a, b) => a + b, 0) / actionCount.length
									).toFixed(1)}ms`}</span>
								</span>
							) : (
								<span
									style={{
										display: "inline-block",
										padding: "0 5px",
										backgroundColor: "#f0f0f0",
									}}
								>
									0x
								</span>
							)}
						</div>
					);
				})}

				{instanceDetails.silentActions.map((name) => (
					<div
						style={{
							paddingLeft: 20,
							marginBottom: 8,
						}}
					>
						<span style={{ color: "#673ab7" }}>
							{name}(){" "}
							<i style={{ fontWeight: "normal", opacity: 0.5, fontSize: 10 }}>
								(silent)
							</i>
						</span>
					</div>
				))}
			</pre>

			{/* <pre
				style={{
					padding: 10,
					backgroundColor: "#fff",
					fontSize: 12,
					width: "100%",
					borderTop: "1px solid #ccc",
				}}
			>

				<div style={{ marginTop: 10 }}>
					<span>{"}"}</span>
				</div>
			</pre> */}
		</div>
	);
}

export function RouteDevtoolsState() {
	const store = useContext(devtoolsContext);
	const { router } = useContext(routerContext);
	const { url, navigate } = useStore(router);
	const { instances } = useStore(store.actions);

	return (
		<div className={styles.body}>
			<div className={styles.actionsLeft}>
				{[...instances.entries()].map(([key, value]) => {
					const storeUrl = `state/${key}`;

					return (
						<button
							key={`state-${key}`}
							type="button"
							className={[
								styles.actionButton,
								url === storeUrl && styles.action,
							]
								.filter(Boolean)
								.join(" ")}
							onClick={() => {
								navigate(storeUrl, "state");
							}}
						>
							<small style={{ opacity: 0.4 }}>
								{key.split("-").pop()}
								<br />
							</small>
							<span>{getExomeName(value)}</span>
						</button>
					);
				})}
			</div>

			<RouterOutlet routes={routes} />
		</div>
	);
}

export function DevtoolsStateContent() {
	const store = useContext(devtoolsContext);
	const { params } = useContext(routerContext);
	const { instances, count } = useStore(store.actions);
	const instance = instances.get(params?.storeId)!;

	if (!instance || !params?.storeId) {
		return <div className={styles.actionsRight}>No store selected</div>;
	}

	return (
		<div className={styles.actionsRight}>
			<StoreExplore instance={instance} count={count} />
		</div>
	);
}
