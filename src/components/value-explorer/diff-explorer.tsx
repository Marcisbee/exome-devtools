import { useState } from "preact/hooks";
import type { Diff } from "../../utils/get-diff";
import { ExploreValue } from "./value-explorer2";
import styles from "./diff-explorer.module.css";

type Change = {
	kind: "added" | "removed" | "edited";
	before?: any;
	after?: any;
};
type Node = { children: Map<string, Node>; change?: Change };

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
		for (const key of path) {
			if (!node.children.has(key))
				node.children.set(key, { children: new Map() });
			node = node.children.get(key)!;
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
		<div aria-label="Action changes">
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
				<span className={styles.label}>{JSON.stringify(label)}</span>:{" "}
			</>
		);
	if (change) {
		return (
			<div className={styles.change}>
				{prefix}
				{change.kind !== "added" && (
					<div className={styles.removed}>
						<span>− Before: </span>
						<ExploreValue value={change.before} />
					</div>
				)}
				{change.kind !== "removed" && (
					<div className={styles.added}>
						<span>+ After: </span>
						<ExploreValue value={change.after} />
					</div>
				)}
			</div>
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
	return (
		<div className={styles.branch}>
			{label !== undefined && (
				<button
					type="button"
					className={styles[kind]}
					aria-expanded={expanded}
					onClick={() => setExpanded(!expanded)}
				>
					{expanded ? "▾ " : "▸ "}
					{prefix}
					{kind === "added"
						? "+ Added"
						: kind === "removed"
							? "− Removed"
							: "± Changed"}
				</button>
			)}
			{open && (
				<div className={label === undefined ? undefined : styles.children}>
					{node.children.size ? (
						[...node.children].map(([key, child]) => (
							<DiffNode key={key} label={key} node={child} />
						))
					) : (
						<i>No changes</i>
					)}
				</div>
			)}
		</div>
	);
}
