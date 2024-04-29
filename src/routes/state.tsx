import { useStore } from "exome/preact";
import { useContext, useMemo } from "preact/hooks";

import { GetterValue } from "../components/getter-value/getter-value";
import {
	ExplorerLabel,
	StoreValueExplore,
} from "../components/value-explorer/value-explorer";
import {
	ExploreLabelAndValue,
	ExploreValue,
	OutputExplorer,
} from "../components/value-explorer/value-explorer2";
import styles from "../devtools.module.css";
import { RouterOutlet, routerContext } from "../devtools/router";
import { DevtoolsActionsStore, devtoolsContext } from "../store";
import {
	PROPERTY_TYPE_GETTER,
	exploreExomeInstance,
} from "../utils/explore-exome-instance";
import { getTimingColor } from "../utils/get-timing-color";
import { useQueryFilter } from "../utils/use-query-filter";
import { useResize } from "../utils/use-resize";

const routes = {
	$storeId: DevtoolsStateContent,
	"*": DevtoolsStateContent,
};

interface StoreExploreProps {
	id: string;
	instance: Record<string, any>;
	count: DevtoolsActionsStore["count"];
}

function StoreExplore({ id, instance, count }: StoreExploreProps) {
	const instanceDetails = exploreExomeInstance(instance);
	const name = id.replace(/-[a-z0-9]+$/gi, "");

	return (
		<div>
			<div style={{ marginBottom: 10 }}>
				{/* <input placeholder="Filter" type="text" style={{ float: "right" }} /> */}
				<h3 style={{ color: "#f5841b" }}>
					{name}
					<small>-{id.split("-").pop()}</small>
				</h3>
			</div>

			<pre className={styles.storeExploreBlock}>
				<span style={{ display: "block", marginBottom: 10, color: "#ccc" }}>
					state
				</span>

				{instanceDetails.state.map((name) => (
					<ExploreLabelAndValue label={name} value={instance[name]} />
					// <div
					// 	style={{
					// 		paddingLeft: 10,
					// 	}}
					// >
					// 	<ExplorerLabel label={name} />:{" "}

					// 	<span style={{ position: "relative", paddingLeft: 10 }}>

					// 	<ExploreValue
					// 		value={instance[name]}
					// 	/>
					// 	</span>
					// </div>
				))}

				{instanceDetails.getters.map((name) => (
					<div
						style={{
							paddingLeft: 10,
						}}
					>
						<ExplorerLabel label={name} />:{" "}
						<i
							style={{ fontWeight: "normal", fontSize: 10 }}
							className={styles.tempText}
							data-text="(getter)"
						/>{" "}
						<StoreValueExplore
							instance={instance}
							source={instance}
							name={`${PROPERTY_TYPE_GETTER}:${name}`}
						/>
					</div>
				))}
			</pre>

			<pre className={styles.storeExploreBlock}>
				<span style={{ display: "block", marginBottom: 10, color: "#ccc" }}>
					actions
				</span>

				{instanceDetails.actions.map((name) => {
					const actionCount = count.get(`${id}.${name}`);
					const fnString = Object.getOwnPropertyDescriptor(
						Object.getPrototypeOf(instance),
						name,
					)?.value.toString();
					const averageTime = actionCount
						? actionCount.reduce((a, b) => a + b, 0) / actionCount.length
						: 0;

					return (
						<div
							style={{
								paddingLeft: 10,
							}}
						>
							<span title={fnString}>
								<ExplorerLabel label={`${name}()`} />{" "}
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
											color: "#fff",
											backgroundColor: getTimingColor(averageTime),
										}}
									>{`~${averageTime.toFixed(1)}ms`}</span>
								</span>
							) : (
								<span
									style={{
										display: "inline-block",
										padding: "0 5px",
										color: "#ccc",
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
							paddingLeft: 10,
						}}
					>
						<span style={{ color: "#881391" }}>
							<ExplorerLabel label={`${name}()`} />{" "}
							<i style={{ fontWeight: "normal", opacity: 0.5, fontSize: 10 }}>
								(silent)
							</i>
						</span>
					</div>
				))}
			</pre>
		</div>
	);
}

export function RouteDevtoolsState() {
	const store = useContext(devtoolsContext);
	const { router } = useContext(routerContext);
	const { url, navigate } = useStore(router);
	const { instances } = useStore(store.actions);
	// const maxWidth = useMemo(() => window.innerWidth / 2, []);
	// const [refResizeTarget, onMouseDown, width] = useResize(
	// 	250,
	// 	"e",
	// 	"side-panel",
	// );

	const unfilteredInstances = [...instances.entries()].sort(([a], [b]) =>
		a > b ? 1 : -1,
	);
	const [query, setQuery, filteredInstances] = useQueryFilter(
		unfilteredInstances,
		([key]) => key,
	);
	const groups = filteredInstances.reduce(
		(acc, [id, value]) => {
			const name = id.replace(/-[a-z0-9]+$/gi, "");

			acc[name] ??= [];
			acc[name].push([id, value]);

			return acc;
		},
		{} as Record<string, [string, any][]>,
	);

	return (
		<div className={styles.body}>
			<div
				className={styles.actionsLeftWrapper}
				// ref={refResizeTarget}
				style={{
					width: 250,
					// width: Math.min(maxWidth, Math.max(200, width)),
				}}
			>
				{/* <div className={styles.resizerRight} onMouseDown={onMouseDown} /> */}

				<div className={styles.actionsLeft}>
					<div className={styles.filterInput}>
						<input
							type="search"
							placeholder="Filter.."
							onInput={(e) => {
								setQuery((e.target as HTMLInputElement)!.value.toLowerCase());
							}}
						/>

						{unfilteredInstances.length !== filteredInstances.length && (
							<div className={styles.hiddenResults}>
								<small>
									{unfilteredInstances.length - filteredInstances.length} hidden
									results for query "{query}"
								</small>
							</div>
						)}
					</div>

					{Object.entries(groups).map(([name, values]) => {
						return (
							<div>
								<hr />
								<div>
									{values.map(([key]) => {
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
												<span>{name}</span>
											</button>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
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
			<StoreExplore id={params.storeId} instance={instance} count={count} />
		</div>
	);
}
