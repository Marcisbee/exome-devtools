import { useContext } from "preact/hooks";
import { useStore } from "exome/preact";

import { devtoolsContext } from "../store";
import styles from "./details.module.css";
// @ts-ignore
import { version } from "../../package.json";

export function RouteDevtoolsDetails() {
	const store = useContext(devtoolsContext);
	const { name, details } = useStore(store);
	const { instances, count } = useStore(store.actions);
	const completed = [...count.values()].reduce(
		(total, timings) => total + timings.length,
		0,
	);

	return (
		<section className={styles.page} aria-label="Connection overview">
			<div className={styles.overview}>
				<header className={styles.header}>
					<div className={styles.eyebrow}>
						EXOME DEVTOOLS <span>/ DETAILS</span>
					</div>
					<div className={styles.intro}>
						<div>
							<h1>Your application, at a glance.</h1>
							<p>A little perspective on the state behind your interface.</p>
						</div>
						<svg
							className={styles.orbit}
							viewBox="0 0 160 120"
							fill="none"
							aria-hidden="true"
						>
							<ellipse
								cx="80"
								cy="60"
								rx="66"
								ry="25"
								transform="rotate(-35 80 60)"
							/>
							<ellipse
								cx="80"
								cy="60"
								rx="66"
								ry="25"
								transform="rotate(35 80 60)"
							/>
							<circle cx="80" cy="60" r="10" />
							<circle cx="132" cy="27" r="4" />
							<circle cx="28" cy="27" r="4" />
						</svg>
					</div>
					<div className={styles.connection}>
						<span className={styles.dot} aria-hidden="true" />
						<span className={styles.connectionLabel}>Connection</span>
						<strong>{name}</strong>
					</div>
				</header>

				<dl className={styles.metrics}>
					<div className={styles.metric}>
						<dt>
							<span aria-hidden="true">01</span> Store instances
						</dt>
						<dd>{instances.size.toLocaleString()}</dd>
						<p>State available to explore.</p>
					</div>
					<div className={styles.metric}>
						<dt>
							<span aria-hidden="true">02</span> Completed actions
						</dt>
						<dd>{completed.toLocaleString()}</dd>
						<p>Executions in retained history.</p>
					</div>
					<div className={styles.metric}>
						<dt>
							<span aria-hidden="true">03</span> Distinct actions
						</dt>
						<dd>{count.size.toLocaleString()}</dd>
						<p>Instance and method pairs.</p>
					</div>
				</dl>

				<div className={styles.note}>
					<span className={styles.noteMark} aria-hidden="true">
						↳
					</span>
					<p>
						{completed === 0
							? "Run an action in your application to start exploring its history."
							: "Follow a change in Actions, or explore your current stores in State."}
						<span>
							Action totals reflect retained completed history, not lifetime
							activity.
						</span>
					</p>
				</div>

				<footer className={styles.footer}>
					<span>
						Devtools <strong>v{version}</strong>
					</span>
					<span>
						Exome{" "}
						<strong>
							{details.version ? `v${details.version}` : "Unknown"}
						</strong>
					</span>
				</footer>
			</div>
		</section>
	);
}
