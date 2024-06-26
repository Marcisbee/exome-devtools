import { useStore } from "exome/preact";
import { useContext, useLayoutEffect, useMemo, useRef } from "preact/hooks";

import { onAction } from "exome";
import {
	ExploreExomeObject,
	ExploreObject,
	safeStringify,
} from "../components/value-explorer/value-explorer2";
import styles from "../devtools.module.css";
import { RouterOutlet, routerContext } from "../devtools/router";
import { DevtoolsActionsStore, devtoolsContext } from "../store";
import { getDiff, getShallowExomeJson } from "../utils/get-diff";
import { getTimingColor } from "../utils/get-timing-color";
import { useQueryFilter } from "../utils/use-query-filter";
import { useResize } from "../utils/use-resize";

const routes = {
	$actionId: DevtoolsActionsContent,
	"*": DevtoolsActionsContent,
};

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
							placeholder="Filter.."
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

function DiffObject({ before, after }: { before: any; after: any }) {
	const diff = getDiff(before, after || {});

	return (
		<pre className={styles.preCode}>
			{"{\n"}
			{!!diff.added?.length && (
				<>
					{diff.added.map(([path, a]) => (
						<span
							style={{
								backgroundColor: "rgba(139,195,74,0.25)",
								color: "#1b420b",
							}}
						>
							+ {path.join(".")}: {safeStringify(a)},{"\n"}
						</span>
					))}
				</>
			)}
			{!!diff.removed?.length && (
				<>
					{diff.removed.map(([path, a]) => (
						<span
							style={{
								color: "#940707",
								backgroundColor: "rgba(244,67,54,0.1)",
							}}
						>
							- {path.join(".")}: {safeStringify(a)},{"\n"}
						</span>
					))}
				</>
			)}
			{!!diff.edited?.length && (
				<>
					{diff.edited.map(([path, a, b]) => (
						<>
							{" "}
							{path.join(".")}:{" "}
							<span
								style={{
									color: "#940707",
									backgroundColor: "rgba(244,67,54,0.1)",
								}}
							>
								{safeStringify(a)}
							</span>{" "}
							{"=>"}{" "}
							<span
								style={{
									backgroundColor: "rgba(139,195,74,0.25)",
									color: "#1b420b",
								}}
							>
								{safeStringify(b)}
							</span>
							,{"\n"}
						</>
					))}
				</>
			)}
			{"}"}
		</pre>
	);
}

function DevtoolsActionsContent() {
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

				if (lastAction.id !== params.actionId) {
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
				<pre className={styles.preCode}>
					<ExploreObject value={action.payload} forceOpen={true} />
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
				{!action.after ? (
					<pre className={styles.preCode}>
						<i>Action is still pending...</i>
					</pre>
				) : (
					<DiffObject before={stateBefore} after={stateAfter} />
				)}
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
				Before:
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
				After:
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
				Error:
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
						<i>Nothing was thrown</i>
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
