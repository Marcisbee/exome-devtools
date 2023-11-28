import { useContext } from "preact/hooks";
import { useStore } from "exome/preact";

import { devtoolsContext } from "../store";
import styles from "../devtools.module.css";
// @ts-ignore
import { version } from "../../package.json";

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
					<p>Devtools version: v{version}</p>
					<p>Exome version: v{store.details.version}</p>
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
