import { useStore } from "exome/preact";
import { useContext, useState } from "preact/hooks";
import { devtoolsContext } from "../store";
import { routerContext } from "../devtools/router";
import {
	capturePerformance,
	parsePerformance,
	serializePerformance,
	summarizePerformance,
	timingNotes,
} from "../performance";
import styles from "./profiler.module.css";
import { PerformanceTimeline } from "./performance-timeline";

const ms = (value: number | null) =>
	value === null
		? "—"
		: `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} ms`;

export function RouteDevtoolsProfiler() {
	const store = useContext(devtoolsContext);
	const { performanceReport, setPerformanceReport } = useStore(store);
	useStore(store.actions);
	const { router } = useContext(routerContext);
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState("totalMs");
	const [error, setError] = useState("");
	const report = performanceReport || capturePerformance(store);
	const groups = summarizePerformance(report.samples);
	const filtered = groups
		.filter((g) =>
			`${g.instance} ${g.name}`.toLowerCase().includes(query.toLowerCase()),
		)
		.sort(
			(a, b) => (b[sort as "totalMs"] ?? -1) - (a[sort as "totalMs"] ?? -1),
		);
	const completed = report.samples.filter((s) => s.durationMs !== null).length;
	function save() {
		const url = URL.createObjectURL(
			new Blob([serializePerformance(report)], { type: "application/json" }),
		);
		const a = document.createElement("a");
		a.href = url;
		a.download = "exome-performance.json";
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
	return (
		<section className={styles.page} aria-label="Store performance">
			<header className={styles.header}>
				<div>
					<h2>Store performance</h2>
					<p>
						{performanceReport ? "Saved snapshot" : "Live retained history"} ·{" "}
						{report.connection.name}
					</p>
				</div>
				<div className={styles.controls}>
					<button
						type="button"
						onClick={() => {
							setPerformanceReport(
								performanceReport ? null : capturePerformance(store),
							);
							setError("");
						}}
					>
						{performanceReport ? "Return to live" : "Freeze snapshot"}
					</button>
					<button type="button" onClick={save}>
						Save JSON
					</button>
					<label className={styles.import}>
						Restore JSON
						<input
							aria-label="Restore JSON"
							type="file"
							accept=".json,application/json"
							onChange={async (e) => {
								const input = e.currentTarget;
								const file = input.files?.[0];
								if (!file) return;
								try {
									if (file.size > 10_000_000)
										throw new Error("Report exceeds the 10 MB limit.");
									setPerformanceReport(parsePerformance(await file.text()));
									setError("");
								} catch (e) {
									setError(
										e instanceof Error
											? e.message
											: "Unable to restore report.",
									);
								} finally {
									input.value = "";
								}
							}}
						/>
					</label>
				</div>
			</header>
			{error && (
				<p role="alert" className={styles.error}>
					{error}
				</p>
			)}
			<PerformanceTimeline
				samples={report.samples}
				onInspect={
					performanceReport
						? undefined
						: (id) => router.navigate(`actions/${id}`, "actions")
				}
			/>
			<dl className={styles.metrics}>
				<div>
					<dt>Completed</dt>
					<dd>{completed}</dd>
				</div>
				<div>
					<dt>Pending</dt>
					<dd>{report.samples.length - completed}</dd>
				</div>
				<div>
					<dt>Store instances</dt>
					<dd>{new Set(report.samples.map((s) => s.instance)).size}</dd>
				</div>
				<div>
					<dt>Failures</dt>
					<dd>{report.samples.filter((s) => s.failed).length}</dd>
				</div>
			</dl>
			<div className={styles.controls}>
				<input
					type="search"
					aria-label="Filter performance"
					placeholder="Filter store or action…"
					value={query}
					onInput={(e) => setQuery(e.currentTarget.value)}
				/>
				<label>
					Sort by{" "}
					<select
						value={sort}
						onChange={(e) => setSort(e.currentTarget.value)}
						aria-label="Sort performance"
					>
						<option value="totalMs">Total elapsed</option>
						<option value="maxMs">Slowest call</option>
						<option value="p95Ms">P95</option>
						<option value="calls">Call count</option>
						<option value="failures">Failures</option>
					</select>
				</label>
			</div>
			{!report.samples.length ? (
				<p>
					No actions captured. Interact with your application or restore a saved
					report.
				</p>
			) : (
				<>
					{!filtered.length && <p>No matching actions.</p>}
					<div className={styles.groups}>
						{filtered.map((g) => (
							<details
								key={JSON.stringify([g.instance, g.name])}
								className={styles.group}
							>
								<summary>
									<span className={styles.name}>
										{g.instance}
										<strong>{g.name}</strong>
									</span>
									<span>
										{g.calls} calls · {ms(g.totalMs)} total
									</span>
								</summary>
								<dl className={styles.stats}>
									{[
										["Completed", g.completed],
										["Pending", g.pending],
										["Failures", g.failures],
										["Mean", ms(g.meanMs)],
										["P95", ms(g.p95Ms)],
										["Max", ms(g.maxMs)],
									].map(([label, value]) => (
										<div key={label}>
											<dt>{label}</dt>
											<dd>{value}</dd>
										</div>
									))}
								</dl>
								<ol className={styles.samples}>
									{[...g.samples]
										.sort((a, b) => (b.durationMs ?? -1) - (a.durationMs ?? -1))
										.map((s) => (
											<li key={s.id}>
												<div>
													<strong>
														{s.durationMs === null
															? "Pending"
															: ms(s.durationMs)}
													</strong>{" "}
													· start {ms(s.startMs)} · depth {s.depth}
													{s.failed && " · Failed"}
												</div>
												<div className={styles.note}>Action {s.id}</div>
												{!performanceReport && (
													<button
														type="button"
														onClick={() =>
															router.navigate(`actions/${s.id}`, "actions")
														}
													>
														Inspect action
													</button>
												)}
												{s.trace && (
													<details>
														<summary>Call trace</summary>
														<pre>{s.trace}</pre>
													</details>
												)}
											</li>
										))}
								</ol>
							</details>
						))}
					</div>
				</>
			)}
			<details className={styles.note}>
				<summary>About these timings</summary>
				<p>{timingNotes}</p>
				<p className={styles.note}>
					History limit: {report.connection.historyLimit} actions · Exome{" "}
					{report.connection.exomeVersion}
					{performanceReport &&
						` · Captured ${new Date(report.capturedAt).toLocaleString()}`}
				</p>
				<p className={styles.note}>
					Start with high total elapsed time for repeated work, high P95 for
					slow calls, and failures for error paths. Inspect the trace and use a
					browser CPU profile to distinguish computation from async waits. P95
					uses nearest rank and is sensitive to small samples.
				</p>
				<p>
					Zoom and scroll horizontally to pan. Times are relative to the first
					retained action. Pending and zero-duration calls are markers; rows
					separate depth and overlapping calls.
				</p>
			</details>
		</section>
	);
}
