import { useContext } from "preact/hooks";
import { useStore } from "exome/preact";

import { devtoolsContext } from "../store";
import styles from "../devtools.module.css";

export function RouteDevtoolsDetails() {
	const store = useContext(devtoolsContext);
	const { instances, count } = useStore(store.actions);

	return (
		<div className={styles.body}>
			<div
				style={{
					flex: 1,
					width: "100%",
					display: "flex",
					justifyContent: "center",
					flexDirection: "column",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<p>Devtools version: 0.1.0</p>
					<p>Exome version: {store.details.version}</p>
					<hr />
					<p>Instances: {instances.size}</p>
					<p>
						Actions: {count.size} (
						{[...count.values()].reduce(
							(acc, timings) => acc + timings.length,
							0,
						)}
						x)
					</p>
				</div>
			</div>
		</div>
	);
}
