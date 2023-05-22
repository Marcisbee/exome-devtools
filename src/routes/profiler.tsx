import { useStore } from "exome/preact";
import { useContext } from "preact/hooks";

import { devtoolsContext } from "../store";
import styles from "../devtools.module.css";
import { routerContext } from "../devtools/router";

export function RouteDevtoolsProfiler() {
	const { router } = useContext(routerContext);
	const store = useContext(devtoolsContext);
	const { actions } = useStore(store.actions);

	let nn = 0;

	return (
		<div className={styles.body}>
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
					{actions.map(({ id, time, name, now, depth }, index) => {
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
								onClick={() => {
									router.navigate(`actions/${id}`);
								}}
							>
								{name}
							</span>
						);
					})}
				</div>
			</div>
		</div>
	);
}
