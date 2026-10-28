import { useState } from "preact/hooks";
import type { PerformanceSample } from "../performance";
import styles from "./profiler.module.css";

const formatMs = (n: number) =>
	`${n.toLocaleString(undefined, { maximumFractionDigits: 3 })} ms`;

// Depth is supplied by the middleware, not a reliable parent relationship.
// Concurrent calls at the same depth get separate rows so neither is hidden.
function lanesFor(samples: PerformanceSample[]) {
	const lanes: { depth: number; end: number; samples: PerformanceSample[] }[] =
		[];
	for (const sample of [...samples].sort((a, b) => a.startMs - b.startMs)) {
		let lane = lanes.find(
			(l) => l.depth === sample.depth && l.end < sample.startMs,
		);
		if (!lane) {
			lane = { depth: sample.depth, end: -Infinity, samples: [] };
			lanes.push(lane);
		}
		lane.samples.push(sample);
		lane.end = sample.startMs + (sample.durationMs ?? 0);
	}
	return lanes.sort((a, b) => a.depth - b.depth);
}

export function PerformanceTimeline({
	samples,
	onInspect,
}: { samples: PerformanceSample[]; onInspect?: (id: string) => void }) {
	const [zoom, setZoom] = useState(1);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = samples.find((s) => s.id === selectedId);
	const start = samples.reduce((n, s) => Math.min(n, s.startMs), Infinity);
	const end = samples.reduce(
		(n, s) => Math.max(n, s.startMs + (s.durationMs ?? 0)),
		-Infinity,
	);
	const span = Math.max(1, end - start);
	const lanes = lanesFor(samples);
	const colors = ["#f5cc78", "#9dd3ee", "#b9dca1", "#d3b9ed", "#f0b9b3"];
	const stores = [...new Set(samples.map((s) => s.instance))];
	return (
		<section className={styles.timelineSection} aria-label="Action timeline">
			<div className={styles.controls}>
				<strong>Timeline</strong>
				<label>
					Zoom{" "}
					<input
						type="range"
						aria-label="Timeline zoom"
						min="1"
						max="20"
						step="1"
						value={zoom}
						onInput={(e) => setZoom(Number(e.currentTarget.value))}
					/>
				</label>
				<span>{zoom}×</span>
				<button type="button" onClick={() => setZoom(1)}>
					Fit timeline
				</button>
				<span className={styles.note}>Scroll horizontally to pan</span>
			</div>
			{!samples.length ? (
				<p>No actions to display.</p>
			) : (
				<>
					<div
						className={styles.timelineScroll}
						role="region"
						aria-label="Scrollable action timeline"
						tabIndex={0}
					>
						<div
							className={styles.timelineCanvas}
							style={{ width: `${zoom * 100}%` }}
						>
							<div className={styles.ruler}>
								{Array.from({ length: 5 }, (_, i) => (
									<span key={i} style={{ left: `${i * 25}%` }}>
										{formatMs((span * i) / 4)}
									</span>
								))}
							</div>
							{lanes.map((lane, index) => (
								<div className={styles.lane} key={index}>
									<span className={styles.depth}>Depth {lane.depth}</span>
									{lane.samples.map((s) => (
										<button
											type="button"
											key={s.id}
											className={styles.timelineBar}
											aria-label={`${s.instance}.${s.name}, ${s.durationMs === null ? "pending" : formatMs(s.durationMs)}, start ${formatMs(s.startMs - start)}, depth ${s.depth}${s.failed ? ", failed" : ""}`}
											aria-pressed={s.id === selectedId}
											title={`${s.instance}.${s.name} · ${s.durationMs === null ? "pending" : formatMs(s.durationMs)}`}
											data-pending={s.durationMs === null}
											style={{
												left: `min(${((s.startMs - start) / span) * 100}%, calc(100% - 4px))`,
												width: `${((s.durationMs ?? 0) / span) * 100}%`,
												backgroundColor:
													colors[stores.indexOf(s.instance) % colors.length],
												borderColor: s.failed ? "#b42318" : undefined,
											}}
											onClick={() => setSelectedId(s.id)}
										>
											{s.failed ? "! " : ""}
											{s.name}
										</button>
									))}
								</div>
							))}
						</div>
					</div>
					<p className={styles.timelineCaption}>
						Relative to first retained action · {formatMs(end - start)} span ·
						Bars show elapsed time, including async waits. Pending and
						zero-duration calls are markers. Rows separate depth and overlapping
						calls.
					</p>
					{selected ? (
						<div
							className={styles.selection}
							role="region"
							aria-label="Selected timeline action"
						>
							<strong>
								{selected.instance}.{selected.name}
							</strong>
							<dl className={styles.stats}>
								<div>
									<dt>Start</dt>
									<dd>{formatMs(selected.startMs - start)}</dd>
								</div>
								<div>
									<dt>Duration</dt>
									<dd>
										{selected.durationMs === null
											? "Pending"
											: formatMs(selected.durationMs)}
									</dd>
								</div>
								<div>
									<dt>Depth</dt>
									<dd>{selected.depth}</dd>
								</div>
								<div>
									<dt>Status</dt>
									<dd>
										{selected.failed
											? "Failed"
											: selected.durationMs === null
												? "Pending"
												: "Completed"}
									</dd>
								</div>
							</dl>
							{onInspect && (
								<div className={styles.controls}>
									<button type="button" onClick={() => onInspect(selected.id)}>
										Open action details
									</button>
								</div>
							)}
							{selected.trace && <pre>{selected.trace}</pre>}
						</div>
					) : (
						<p className={styles.note}>
							Select a bar to inspect its timing and call trace.
						</p>
					)}
				</>
			)}
		</section>
	);
}
