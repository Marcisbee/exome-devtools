import { getExomeId as targetGetExomeId } from "exome-target";
import { Exome } from "exome";
import { useStore } from "exome/preact";
import { useContext, useMemo } from "preact/hooks";

import { DevtoolsActionsStore, devtoolsContext } from "../store";
import { RouterOutlet, routerContext } from "../devtools/router";
import { targetGetExomeName } from "../utils/get-exome-name";
import { exploreExomeInstance } from "../utils/explore-exome-instance";
import { GetterValue } from "../components/getter-value/getter-value";
import { useQueryFilter } from "../utils/use-query-filter";
import styles from "../devtools.module.css";
import {
	ExplorerLabel,
	StoreValueExplore,
} from "../components/value-explorer/value-explorer";
import { useResize } from "../utils/use-resize";
import { getTimingColor } from "../utils/get-timing-color";

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
				<h3 style={{ color: "#f5841b" }}>
					{targetGetExomeName(instance)}
					<small>-{targetGetExomeId(instance).split("-").pop()}</small>
				</h3>
			</div>

			<pre className={styles.storeExploreBlock}>
				<span style={{ display: "block", marginBottom: 10, color: "#ccc" }}>
					state
				</span>

				{instanceDetails.state.map((name) => (
					<div
						style={{
							paddingLeft: 10,
						}}
					>
						<ExplorerLabel label={name} />:{" "}
						<StoreValueExplore
							instance={instance}
							source={instance}
							name={name}
						/>
					</div>
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
						<GetterValue
							key={`getter::${name}::${Math.random()}`}
							source={instance}
							field={name}
						/>
					</div>
				))}
			</pre>

			<pre className={styles.storeExploreBlock}>
				<span style={{ display: "block", marginBottom: 10, color: "#ccc" }}>
					actions
				</span>

				{instanceDetails.actions.map((name) => {
					const actionCount = count.get(
						`${targetGetExomeId(instance)}.${name}`,
					);
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
	const maxWidth = useMemo(() => window.innerWidth / 2, []);
	const [refResizeTarget, onMouseDown, width] = useResize(
		250,
		"e",
		"side-panel",
	);

	const unfilteredInstances = [...instances.entries()];
	const [query, setQuery, filteredInstances] = useQueryFilter(
		unfilteredInstances,
		([key]) => key,
	);
	const groups = filteredInstances.reduce((acc, [, value]) => {
		const name = targetGetExomeName(value);

		acc[name] ??= [];
		acc[name].push(value);

		return acc;
	}, {} as Record<string, any[]>);

	return (
		<div className={styles.body}>
			<div
				className={styles.actionsLeftWrapper}
				ref={refResizeTarget}
				style={{
					width: Math.min(maxWidth, Math.max(200, width)),
				}}
			>
				<div className={styles.resizerRight} onMouseDown={onMouseDown} />

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

					{Object.entries(groups).map(([, values]) => {
						return (
							<div>
								<hr />
								<div>
									{values.map((value) => {
										const key = targetGetExomeId(value);

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
												{/* <small style={{ opacity: 0.4 }}>
													{key.split("-").pop()}
													<br />
												</small> */}
												<span>{targetGetExomeName(value)}</span>
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
			<StoreExplore instance={instance} count={count} />
		</div>
	);
}
