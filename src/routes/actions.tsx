import { useStore } from "exome/preact";
import {
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "preact/hooks";

import { onAction } from "exome";
import {
	ExploreExomeObject,
	ExploreObject,
	historicalContext,
} from "../components/value-explorer/value-explorer2";
import { DiffExplorer } from "../components/value-explorer/diff-explorer";
import styles from "../devtools.module.css";
import { RouterOutlet, routerContext } from "../devtools/router";
import { DevtoolsActionsStore, devtoolsContext } from "../store";
import { cc } from "../utils/cc";
import { getDiff, getShallowExomeJson } from "../utils/get-diff";
import { getTimingColor } from "../utils/get-timing-color";
import { useQueryFilter } from "../utils/use-query-filter";
import { useResize } from "../utils/use-resize";

const routes = {
	$actionId: HistoricalActionContent,
	"*": HistoricalActionContent,
};

function HistoricalActionContent() {
	return (
		<historicalContext.Provider value={true}>
			<DevtoolsActionsContent />
		</historicalContext.Provider>
	);
}

export function RouteDevtoolsActions() {
	const ref = useRef<HTMLDivElement>(null);
	const { router } = useContext(routerContext);
	const { url, navigate } = useStore(router);
	const devtoolsStore = useContext(devtoolsContext);
	const { actions: unfilteredActions } = useStore(devtoolsStore.actions);
	// const maxWidth = useMemo(() => window.innerWidth / 2, []);
	// const [refResizeTarget, onMouseDown, width] = useResize(
	// 	250,
	// 	"e",
	// 	"side-panel",
	// );

	const [query, setQuery, filteredActions] = useQueryFilter(
		unfilteredActions,
		(action) => action.name,
		(action) => action.after ?? action.before,
	);

	useLayoutEffect(() => {
		ref.current?.lastElementChild?.scrollIntoView({
			behavior: "auto",
			block: "start",
		});
	}, [unfilteredActions[unfilteredActions.length - 1]]);

	return (
		<div className={styles.body}>
			<div
				className={styles.actionsLeftWrapper}
				// ref={refResizeTarget}
				style={{
					// width: Math.min(maxWidth, Math.max(200, width)),
					width: 250,
				}}
			>
				{/* <div className={styles.resizerRight} onMouseDown={onMouseDown} /> */}

				<div className={styles.actionsLeft}>
					<div className={styles.filterInput}>
						<input
							type="search"
							placeholder="Filter actions or action,field=value"
							aria-label="Filter actions"
							onInput={(e) => {
								setQuery((e.target as HTMLInputElement)!.value.toLowerCase());
							}}
						/>

						{unfilteredActions.length !== filteredActions.length && (
							<div className={styles.hiddenResults}>
								<small>
									{unfilteredActions.length - filteredActions.length} hidden
									results for query "{query}"
								</small>
							</div>
						)}
					</div>

					<div ref={ref}>
						{filteredActions.map(
							({ id, depth, instance, name, time, error }) => {
								const actionUrl = `actions/${id}`;
								const instanceName = instance.replace(/-[a-z0-9]+$/gi, "");

								return (
									<button
										key={id}
										type="button"
										className={[
											styles.actionButton,
											url === actionUrl && styles.action,
										]
											.filter(Boolean)
											.join(" ")}
										onClick={() => {
											navigate(actionUrl, "actions");
										}}
									>
										<small style={{ opacity: 0.4 }}>
											{instanceName}
											<br />
										</small>
										{!!error && <i className={styles.actionListErrorMark}>!</i>}
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
							},
						)}
					</div>
				</div>
			</div>

			<RouterOutlet routes={routes} />
		</div>
	);
}

function DevtoolsActionsContent() {
	const [stateTab, setStateTab] = useState<"diff" | "before" | "after">("diff");
	const store = useContext(devtoolsContext);
	const { router, params } = useContext(routerContext);
	const { actions } = useStore(store.actions);
	const action = actions.find(({ id }) => params?.actionId === id);

	useLayoutEffect(() => {
		if (!params?.actionId) {
			return;
		}

		return onAction(
			DevtoolsActionsStore,
			"addAction",
			(instance, _, [newAction]) => {
				if (!params?.actionId) {
					return;
				}

				if (instance !== store.actions) {
					return;
				}

				if (!newAction) {
					return;
				}

				const lastAction = instance.actions[instance.actions.length - 1];

				if (lastAction?.id !== params.actionId) {
					return;
				}

				router.navigate(`actions/${newAction.id}`, "actions");
			},
			"before",
		);
	}, [params?.actionId]);

	if (!action) {
		return <div className={styles.actionsRight}>No Action Selected</div>;
	}

	const instanceName = action.instance.replace(/-[a-z0-9]+$/gi, "");

	const stateBefore = getShallowExomeJson(action.before);
	const stateAfter = getShallowExomeJson(action.after!);
	const sateDiff = getDiff(stateBefore, stateAfter || {});

	return (
		<div className={styles.actionsRight}>
			<h3>
				<span>
					{/* biome-ignore lint/a11y/useValidAnchor: <explanation> */}
					<a
						href="javascript:void(0);"
						onClick={() => {
							router.navigate(`state/${action.instance}`, "state");
						}}
					>
						{instanceName}
						<small>-{action.instance.split("-").pop()}</small>
					</a>
					.
				</span>
				<strong>{action.name}</strong>
			</h3>

			<br />

			<div>
				<span className={styles.textWithIcon}>
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
							<path d="M10 2h4m-2 12l3-3" />
							<circle cx="12" cy="14" r="8" />
						</g>
					</svg>
					Timing:{" "}
				</span>

				<span
					style={{
						color: getTimingColor(action.time),
					}}
				>
					{action.time === undefined ? (
						"Waiting..."
					) : (
						<>
							{action.time.toFixed(1)}
							<small>ms</small>
						</>
					)}
				</span>
			</div>

			<br />

			<div>
				<span className={styles.textWithIcon}>
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
							<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
							<circle cx="17" cy="18" r="2" />
							<circle cx="7" cy="18" r="2" />
						</g>
					</svg>
					Payload
				</span>
				<pre className={styles.preCode}>
					<ExploreObject value={action.payload} forceOpen={true} />
				</pre>
			</div>

			<br />

			<div>
				<div>
					<button
						type="button"
						className={cc([
							styles.textWithIcon,
							stateTab === "diff" && styles.active,
						])}
						onClick={() => setStateTab("diff")}
					>
						<span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="1em"
								height="1em"
								viewBox="0 0 24 24"
							>
								<path
									fill="none"
									stroke="currentColor"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Zm-6 8h6m-3 3V7M9 17h6"
								/>
							</svg>
							Diff
							{action.after
								? ` (${
										sateDiff.added.length +
										sateDiff.removed.length +
										sateDiff.edited.length
									})`
								: ""}
						</span>
					</button>

					<button
						type="button"
						className={cc([
							styles.textWithIcon,
							stateTab === "before" && styles.active,
						])}
						onClick={() => setStateTab("before")}
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
									<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
									<path d="M14 2v4a2 2 0 0 0 2 2h4" />
								</g>
							</svg>
							Before
						</span>
					</button>

					<button
						type="button"
						className={cc([
							styles.textWithIcon,
							stateTab === "after" && styles.active,
						])}
						onClick={() => setStateTab("after")}
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
									<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
									<path d="M14 2v4a2 2 0 0 0 2 2h4M3 15l2 2l4-4" />
								</g>
							</svg>
							After
						</span>
					</button>
				</div>

				<div
					className={cc([
						styles.stateTabContent,
						stateTab === "diff" && styles.show,
					])}
				>
					{!action.after ? (
						<pre className={styles.preCode}>
							<i>Action is still pending...</i>
						</pre>
					) : (
						<pre className={styles.preCode}>
							<DiffExplorer
								key={action.id}
								diff={sateDiff}
								before={stateBefore}
								after={stateAfter}
							/>
						</pre>
					)}
				</div>

				<div
					className={cc([
						styles.stateTabContent,
						stateTab === "before" && styles.show,
					])}
				>
					<pre className={styles.preCode}>
						<ExploreExomeObject
							id={action.instance}
							value={action.before}
							forceOpen={true}
						/>
					</pre>
				</div>

				<div
					className={cc([
						styles.stateTabContent,
						stateTab === "after" && styles.show,
					])}
				>
					<pre className={styles.preCode}>
						{!action.after ? (
							<i>Action is still pending...</i>
						) : (
							<ExploreExomeObject
								id={action.instance}
								value={action.after!}
								forceOpen={true}
							/>
						)}
					</pre>
				</div>
			</div>

			{/* <br />

			<div>
				<span className={styles.textWithIcon}>
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
							<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
							<path d="M14 2v4a2 2 0 0 0 2 2h4" />
						</g>
					</svg>
					Before
				</span>
				<pre className={styles.preCode}>
					<ExploreExomeObject
						id={action.instance}
						value={action.before}
						forceOpen={true}
					/>
				</pre>
			</div>

			<br />

			<div>
				<span className={styles.textWithIcon}>
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
							<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
							<path d="M14 2v4a2 2 0 0 0 2 2h4M3 15l2 2l4-4" />
						</g>
					</svg>
					After
				</span>
				<pre className={styles.preCode}>
					{!action.after ? (
						<i>Action is still pending...</i>
					) : (
						<ExploreExomeObject
							id={action.instance}
							value={action.after!}
							forceOpen={true}
						/>
					)}
				</pre>
			</div> */}

			<br />

			<div>
				<span className={styles.textWithIcon}>
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
							<circle cx="5" cy="6" r="3" />
							<path d="M5 9v12" />
							<circle cx="19" cy="18" r="3" />
							<path d="m15 9l-3-3l3-3" />
							<path d="M12 6h5a2 2 0 0 1 2 2v7" />
						</g>
					</svg>
					Return
				</span>
				{action.response !== undefined ? (
					<pre className={styles.preCode}>
						<ExploreExomeObject
							id={action.instance}
							value={action.response!}
							forceOpen={true}
						/>
					</pre>
				) : (
					<pre className={styles.preCode}>
						<i>Action did not return</i>
					</pre>
				)}
			</div>

			<br />

			<div>
				<span className={styles.textWithIcon}>
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
							<circle cx="6" cy="6" r="3" />
							<path d="M6 9v12M21 3l-6 6m6 0l-6-6m3 8.5V15" />
							<circle cx="18" cy="18" r="3" />
						</g>
					</svg>
					Throw
				</span>
				{action.error ? (
					<pre
						className={styles.preCode}
						style={{
							backgroundColor: "#FFEBEE",
							borderColor: "#FFCDD2",
							color: "#B71C1C",
						}}
					>
						{String(action.error)}
					</pre>
				) : (
					<pre className={styles.preCode}>
						<i>Action did not throw</i>
					</pre>
				)}
			</div>

			{/* <br />

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
			</div> */}
		</div>
	);
}
