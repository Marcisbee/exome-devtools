import { useContext } from "preact/hooks";
import { useStore } from "exome/preact";

import { devtoolsContext } from "../store";
import styles from "./details.module.css";
// @ts-ignore
import { version } from "../../package.json";

export function RouteDevtoolsDetails() {
	const store = useContext(devtoolsContext);
	const { details } = useStore(store);
	const { instances, count } = useStore(store.actions);
	const completed = [...count.values()].reduce(
		(total, timings) => total + timings.length,
		0,
	);

	return (
		<section className={styles.page} aria-label="Connection overview">
			<div className={styles.overview}>
				<h3>Details</h3>
				<dl className={styles.metrics}>
					<div>
						<dt>Store instances</dt>
						<dd>{instances.size.toLocaleString()}</dd>
					</div>
					<div>
						<dt>
							Completed actions <small>retained</small>
						</dt>
						<dd>{completed.toLocaleString()}</dd>
					</div>
					<div>
						<dt>
							Distinct actions <small>retained</small>
						</dt>
						<dd>{count.size.toLocaleString()}</dd>
					</div>
				</dl>
				<dl className={styles.versions}>
					<div>
						<dt>Devtools version</dt>
						<dd>v{version}</dd>
					</div>
					<div>
						<dt>Exome version</dt>
						<dd>{details.version ? `v${details.version}` : "Unknown"}</dd>
					</div>
				</dl>
			</div>
		</section>
	);
}
