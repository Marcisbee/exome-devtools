import { getExomeId } from "exome";
import { useStore } from "exome/preact";
import { useContext, useMemo } from "preact/hooks";

import { devtoolsContext } from "../store";
import { RouterOutlet, routerContext } from "../devtools/router";
import { getExomeName } from "../utils/get-exome-name";
import { exploreExomeInstance } from "../utils/explore-exome-instance";
import styles from "../devtools.module.css";

export function RouteDevtoolsState() {
	const store = useContext(devtoolsContext);
	const { router } = useContext(routerContext);
	const { url, navigate } = useStore(router);
	const { instances } = useStore(store.actions);
	const routes = useMemo(
		() => ({
			$storeId: DevtoolsStateContent,
			"*": DevtoolsStateContent,
		}),
		[],
	);

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
								navigate(storeUrl);
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

	const instanceDetails = params?.storeId
		? exploreExomeInstance(instances.get(params.storeId)!)
		: undefined;

	return (
		<div className={styles.actionsRight}>
			{params?.storeId && instanceDetails ? (
				<>
					<h3>{params.storeId}</h3>

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
											(instances.get(params.storeId) as any)[name],
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
									`${getExomeId(instances.get(params.storeId)!)}.${name}`,
								);
								const fnString = Object.getOwnPropertyDescriptor(
									Object.getPrototypeOf(instances.get(params.storeId)!),
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
	);
}
