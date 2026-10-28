import { useState } from "preact/hooks";
import type { Diff } from "../../utils/get-diff";
import { ExploreValue } from "./value-explorer2";
import styles from "./diff-explorer.module.css";

type Change = {
	kind: "added" | "removed" | "edited";
	before?: any;
	after?: any;
};
type Node = { children: Map<string, Node>; change?: Change; array?: boolean };

export function DiffExplorer({
	diff,
	before,
	after,
}: { diff: Diff; before: any; after: any }) {
	const root: Node = { children: new Map() };
	function insert(path: string[], change: Change) {
		// Serialized references and special values are display values, not object fields.
		let a = before;
		let b = after;
		for (let index = 0; index < path.length; index++) {
			if (
				[a, b].some(
					(value) =>
						value &&
						typeof value === "object" &&
						("$$exome_id" in value ||
							"$$exome_bigint" in value ||
							"$$exome_circular" in value),
				)
			) {
				path = path.slice(0, index);
				change = { kind: "edited", before: a, after: b };
				break;
			}
			a = a?.[path[index]];
			b = b?.[path[index]];
		}
		let node = root;
		a = before;
		b = after;
		for (const key of path) {
			a = a?.[key];
			b = b?.[key];
			if (!node.children.has(key))
				node.children.set(key, { children: new Map() });
			node = node.children.get(key)!;
			node.array = Array.isArray(b ?? a);
		}
		node.change = change;
	}
	for (const [path, after] of diff.added)
		insert(path, { kind: "added", after });
	for (const [path, before] of diff.removed)
		insert(path, { kind: "removed", before });
	for (const [path, before, after] of diff.edited)
		insert(path, { kind: "edited", before, after });
	return (
		<div aria-label="Action changes" className={styles.root}>
			<DiffNode node={root} />
		</div>
	);
}

function DiffNode({ node, label }: { node: Node; label?: string }) {
	const [expanded, setExpanded] = useState(false);
	const change = node.change;
	const prefix =
		label === undefined ? null : (
			<>
				<span className={styles.label}>
					{/^[\w$]+$/.test(label) ? label : JSON.stringify(label)}
				</span>
				:{" "}
			</>
		);
	if (change?.kind === "edited") {
		return (
			<div className={styles.editRow}>
				{prefix}
				<div
					className={`${styles.inlineValue} ${styles.removed}`}
					title="Before"
				>
					<ExploreValue value={change.before} />
				</div>
				{" => "}
				<div className={`${styles.inlineValue} ${styles.added}`} title="After">
					<ExploreValue value={change.after} />
				</div>
			</div>
		);
	}
	if (change) {
		return (
			<>
				{change.kind !== "added" && (
					<div className={`${styles.row} ${styles.removed}`}>
						<span className={styles.marker} aria-label="Before">
							−
						</span>
						<div className={styles.value}>
							{prefix}
							<ExploreValue value={change.before} />
						</div>
					</div>
				)}
				{change.kind !== "removed" && (
					<div className={`${styles.row} ${styles.added}`}>
						<span className={styles.marker} aria-label="After">
							+
						</span>
						<div className={styles.value}>
							{prefix}
							<ExploreValue value={change.after} />
						</div>
					</div>
				)}
			</>
		);
	}
	const kinds = new Set<string>();
	function collect(current: Node) {
		if (current.change) kinds.add(current.change.kind);
		for (const child of current.children.values()) collect(child);
	}
	collect(node);
	const kind = kinds.size === 1 ? [...kinds][0] : "edited";
	const open = label === undefined || expanded;
	const start = node.array ? "[" : "{";
	const end = node.array ? "]" : "}";
	if (!node.children.size) return <i>No changes</i>;
	return (
		<div className={styles.branch}>
			{label !== undefined ? (
				<button
					type="button"
					className={styles.toggle}
					aria-label={`${label}: ${kind === "edited" ? "changed" : kind}`}
					aria-expanded={expanded}
					onClick={() => setExpanded(!expanded)}
				>
					<span
						className={`${styles.marker} ${styles[kind]}`}
						aria-hidden="true"
					>
						{kind === "added" ? "+" : kind === "removed" ? "−" : "±"}
					</span>
					<span className={styles.chevron} aria-hidden="true">
						{expanded ? "▾" : "▸"}
					</span>
					{prefix}
					<span className={styles.bracket}>
						{start}
						{open ? "" : `…${end}`}
					</span>
				</button>
			) : (
				<div className={styles.bracket}>{start}</div>
			)}
			{open && (
				<>
					<div className={styles.children}>
						{[...node.children].map(([key, child]) => (
							<DiffNode key={key} label={key} node={child} />
						))}
					</div>
					<div className={styles.bracket}>{end}</div>
				</>
			)}
		</div>
	);
}
