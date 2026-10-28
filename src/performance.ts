import type { Action, DevtoolsStore } from "./store";

export const timingNotes =
	"Elapsed action time in milliseconds, including async waits and nested actions. Not CPU time or render time. Overlapping durations must not be added to estimate wall time. Only the retained history is included; pending actions have no duration.";
export interface PerformanceSample {
	id: string;
	instance: string;
	name: string;
	startMs: number;
	durationMs: number | null;
	depth: number;
	failed: boolean;
	trace: string;
}
export interface PerformanceReport {
	format: "exome-performance";
	version: 1;
	capturedAt: string;
	connection: { name: string; exomeVersion: string; historyLimit: number };
	timing: string;
	samples: PerformanceSample[];
}
export function capturePerformance(store: DevtoolsStore): PerformanceReport {
	return {
		format: "exome-performance",
		version: 1,
		capturedAt: new Date().toISOString(),
		connection: {
			name: store.name,
			exomeVersion: store.details.version,
			historyLimit: store.maxAge,
		},
		timing: timingNotes,
		samples: store.actions.actions.map((action: Action) => ({
			id: action.id,
			instance: action.instance,
			name: action.name,
			startMs: action.now,
			durationMs: action.time ?? null,
			depth: action.depth,
			failed: action.error !== undefined,
			trace: action.trace,
		})),
	};
}
export function summarizePerformance(samples: PerformanceSample[]) {
	const groups = new Map<
		string,
		{ instance: string; name: string; samples: PerformanceSample[] }
	>();
	for (const sample of samples) {
		const key = JSON.stringify([sample.instance, sample.name]);
		if (!groups.has(key))
			groups.set(key, {
				instance: sample.instance,
				name: sample.name,
				samples: [],
			});
		groups.get(key)!.samples.push(sample);
	}
	return [...groups.values()]
		.map((group) => {
			const durations = group.samples
				.flatMap((s) => (s.durationMs === null ? [] : [s.durationMs]))
				.sort((a, b) => a - b);
			const totalMs = durations.reduce((a, b) => a + b, 0);
			return {
				...group,
				calls: group.samples.length,
				completed: durations.length,
				pending: group.samples.length - durations.length,
				failures: group.samples.filter((s) => s.failed).length,
				totalMs,
				meanMs: durations.length ? totalMs / durations.length : null,
				p95Ms: durations.length
					? durations[Math.ceil(durations.length * 0.95) - 1]
					: null,
				maxMs: durations.length ? durations[durations.length - 1] : null,
			};
		})
		.sort(
			(a, b) =>
				b.totalMs - a.totalMs ||
				b.calls - a.calls ||
				a.instance.localeCompare(b.instance) ||
				a.name.localeCompare(b.name),
		);
}

// Reports are an external file format. Validate before replacing a viewed report.
export function parsePerformance(text: string): PerformanceReport {
	if (text.length > 10_000_000)
		throw new Error("Report exceeds the 10 MB limit.");
	const report = JSON.parse(text);
	const object = (v: any) => v && typeof v === "object" && !Array.isArray(v);
	const string = (v: any) => typeof v === "string";
	const nonnegative = (v: any) =>
		typeof v === "number" && Number.isFinite(v) && v >= 0;
	if (
		!object(report) ||
		report.format !== "exome-performance" ||
		report.version !== 1
	)
		throw new Error("Expected an exome-performance version 1 report.");
	if (
		!string(report.capturedAt) ||
		!Number.isFinite(Date.parse(report.capturedAt)) ||
		!object(report.connection) ||
		!string(report.connection.name) ||
		!string(report.connection.exomeVersion) ||
		!nonnegative(report.connection.historyLimit) ||
		!Array.isArray(report.samples) ||
		report.samples.length > 100_000
	)
		throw new Error("Invalid report metadata or samples.");
	const ids = new Set<string>();
	for (const s of report.samples) {
		if (
			!object(s) ||
			!string(s.id) ||
			ids.has(s.id) ||
			!string(s.instance) ||
			!string(s.name) ||
			!nonnegative(s.startMs) ||
			!(s.durationMs === null || nonnegative(s.durationMs)) ||
			!Number.isInteger(s.depth) ||
			s.depth < 0 ||
			typeof s.failed !== "boolean" ||
			!string(s.trace)
		)
			throw new Error(
				"Invalid action sample (IDs must be unique and timings non-negative).",
			);
		ids.add(s.id);
	}
	return {
		format: "exome-performance",
		version: 1,
		capturedAt: report.capturedAt,
		connection: {
			name: report.connection.name,
			exomeVersion: report.connection.exomeVersion,
			historyLimit: report.connection.historyLimit,
		},
		timing: timingNotes,
		samples: report.samples.map((s: PerformanceSample) => ({
			id: s.id,
			instance: s.instance,
			name: s.name,
			startMs: s.startMs,
			durationMs: s.durationMs,
			depth: s.depth,
			failed: s.failed,
			trace: s.trace,
		})),
	};
}
export function serializePerformance(report: PerformanceReport) {
	return JSON.stringify(
		{
			...report,
			summary: summarizePerformance(report.samples).map(
				({ samples, ...summary }) => summary,
			),
		},
		null,
		2,
	);
}
