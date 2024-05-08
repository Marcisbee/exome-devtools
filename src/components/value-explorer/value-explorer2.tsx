import { useStore } from "exome/preact";
import { useContext, useState } from "preact/hooks";

import { routerContext } from "../../devtools/router";
import { devtoolsContext } from "../../store";
import { cc } from "../../utils/cc";
import { Icon } from "../icon/icon";

import styles from "./value-explorer.module.css";
import { Diff } from "../../utils/get-diff";

const IS_HEX_COLOR = /^#(?:[0-9A-Fa-f]{3}){1,2}\b$/;
const IS_HSL_COLOR =
	/^hsl\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*\)$/;
const IS_RGB_COLOR =
	/^rgb\(\s*(-?\d+|-?\d*\.\d+(?=%))(%?)\s*,\s*(-?\d+|-?\d*\.\d+(?=%))(\2)\s*,\s*(-?\d+|-?\d*\.\d+(?=%))(\2)\s*\)$/;
const IS_RGBA_COLOR =
	/^rgba\(\s*(-?\d+|-?\d*\.\d+(?=%))(%?)\s*,\s*(-?\d+|-?\d*\.\d+(?=%))(\2)\s*,\s*(-?\d+|-?\d*\.\d+(?=%))(\2)\s*,\s*(-?\d+|-?\d*.\d+)\s*\)$/;

export function ExploreValue({ value, diff, path = [] }: { value: any, diff?: Diff, path?: string[] }) {
	if (value === undefined) {
		return <i className={styles.inspectNull}>undefined</i>;
	}

	if (value === null) {
		return <i className={styles.inspectNull}>null</i>;
	}

	if (typeof value === "object") {
		return <ExploreObject value={value} diff={diff} path={path} />;
	}

	const output = JSON.stringify(value);

	if (typeof value === "string") {
		if (
			IS_HEX_COLOR.test(value) ||
			IS_HSL_COLOR.test(value) ||
			IS_RGB_COLOR.test(value) ||
			IS_RGBA_COLOR.test(value)
		) {
			return (
				<span className={styles.inspectColor}>
					<i
						className={styles.inspectColorExtra}
						style={{ background: value }}
					/>
					{value}
				</span>
			);
		}

		return <span className={styles.inspectString}>{output}</span>;
	}

	if (typeof value === "boolean") {
		return <span className={styles.inspectBoolean}>{output}</span>;
	}

	if (typeof value === "number") {
		return <span className={styles.inspectNumber}>{output}</span>;
	}

	if (typeof value === "function") {
		return <span className={styles.inspectFunction}>{value.toString()}</span>;
	}

	return <span className={styles.inspectUnknown}>{output}</span>;
}

function ExploreLabel({ label }: { label: string }) {
	return <span className={styles.inspectLabel}>{safeLabel(label)}</span>;
}

export function ExploreLabelAndValue({
	label,
	value,
	path = [],
}: { label: string; value: any; path?: string[] }) {
	return (
		<div className={styles.wrap}>
			<ExploreLabel label={label} />: <ExploreValue value={value} path={path} />
		</div>
	);
}

function areArraysEqual(a: string[], b: string[], len: boolean = true) {
  if (len && a.length !== b.length) return false;

  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
};

export function ExploreObject({
	value,
	diff,
	forceOpen = false,
	path = [],
}: {
	value: Record<string, any> | any[];
	diff?: Diff;
	forceOpen?: boolean;
	path?: string[];
}) {
	const [isExpanded, setIsExpanded] = useState(forceOpen);
	const {
		actions: { instances },
	} = useContext(devtoolsContext);

	const keys = Object.keys(value);

	function labelPlusValue(name: string) {
		const newPath = path.concat(name);
		if (diff) {
			const edited = diff.edited.find(([a]) => areArraysEqual(newPath, a));

			if (edited) {
				return (
					<>
						<div className={cc([
							styles.wrap,
							styles.wrapDiffRemoved,
						])}>
							<ExploreLabel label={name} />:{" "}
							<ExploreValue value={edited[1]} path={newPath} />
						</div>
						<div className={cc([
							styles.wrap,
							styles.wrapDiffAdded,
						])}>
							<ExploreLabel label={name} />:{" "}
							<ExploreValue value={edited[2]} path={newPath} />
						</div>
					</>
				);
			}

			const removed = diff.removed.find(([a]) => areArraysEqual(newPath, a));

			if (removed) {
				return (
					<div className={cc([
						styles.wrap,
						styles.wrapDiffRemoved,
					])}>
						<ExploreLabel label={name} />:{" "}
						<ExploreValue value={removed[1]} path={newPath} />
					</div>
				);
			}

			const added = diff.added.find(([a]) => areArraysEqual(newPath, a));

			if (added) {
				return (
					<div className={cc([
						styles.wrap,
						styles.wrapDiffAdded,
					])}>
						<ExploreLabel label={name} />:{" "}
						<ExploreValue value={value[name]} path={newPath} />
					</div>
				);
			}

			const shallowEdited = diff.edited.find(([a]) => areArraysEqual(newPath, a, false));
			const shallowAdded = diff.added.find(([a]) => areArraysEqual(newPath, a, false));
			const shallowRemoved = diff.removed.find(([a]) => areArraysEqual(newPath, a, false));

			if (shallowEdited || shallowAdded || shallowRemoved) {
				return (
					<div className={cc([
						styles.wrap,
						(!!shallowEdited || (!!added && !!removed)) && styles.wrapDiffEdited,
						!shallowEdited && !!added && styles.wrapDiffAdded,
						!shallowEdited && !!removed && styles.wrapDiffRemoved,
					])}>
						<ExploreLabel label={name} />:{" "}
						<ExploreValue value={value[name]} diff={diff} path={newPath} />
					</div>
				);
			}

			return null;
		}

		return (
			<div className={styles.wrap}>
				<ExploreLabel label={name} />:{" "}
				<ExploreValue value={value[name]} diff={diff} path={newPath} />
			</div>
		);
	}

	if (Array.isArray(value)) {
		return (
			<>
				{!forceOpen ? (
					<span
						className={cc([
							styles.expandHandle,
							isExpanded && styles.expanded,
							!keys.length && styles.notExpendable,
						])}
						onClick={
							keys.length ? () => setIsExpanded((exp) => !exp) : undefined
						}
					>
						{isExpanded ? (
							<Icon type="arrow-down" />
						) : (
							<Icon type="arrow-right" />
						)}

						{isExpanded
							? `Array(${value.length}) [`
							: `Array(${value.length}) ${safeStringify(value)}`}
					</span>
				) : (
					"["
				)}

				{isExpanded && (
					<>
						{keys.map(labelPlusValue)}
						{"]"}
					</>
				)}
			</>
		);
	}

	if (value.$$exome_id) {
		const instance = instances.get(value.$$exome_id);

		if (instance) {
			return (
				<ExploreExomeObject
					id={value.$$exome_id}
					value={instance}
					forceOpen={forceOpen}
					path={path}
				/>
			);
		}
	}

	let name = `${value.constructor.name} `;

	if (name === "Object ") {
		name = "";
	}

	if (value.$$exome_class) {
		name = `${value.$$exome_class} `;
		keys.splice(0, 1);
	}

	return (
		<>
			{!forceOpen ? (
				<span
					className={cc([
						styles.expandHandle,
						isExpanded && styles.expanded,
						!keys.length && styles.notExpendable,
					])}
					onClick={keys.length ? () => setIsExpanded((exp) => !exp) : undefined}
				>
					{isExpanded ? (
						<Icon type="arrow-down" />
					) : (
						<Icon type="arrow-right" />
					)}

					{isExpanded ? `${name}{` : safeStringify(value)}
				</span>
			) : (
				"{"
			)}

			{isExpanded && (
				<>
					{keys.map(labelPlusValue)}
					{"}"}
				</>
			)}
		</>
	);
}

export function ExploreExomeObject({
	id,
	value,
	forceOpen = false,
	path = [],
}: {
	id: string;
	value: Record<string, any>;
	forceOpen?: boolean;
	path?: string[];
}) {
	const [isExpanded, setIsExpanded] = useState(forceOpen);
	const { router } = useContext(routerContext);
	const { navigate } = useStore(router);

	const keys = Object.keys(value).filter(
		(key) => key.indexOf("$$exome_") !== 0,
	);

	return (
		<>
			{!forceOpen ? (
				<span
					className={cc([
						styles.expandHandle,
						isExpanded && styles.expanded,
						!keys.length && styles.notExpendable,
					])}
					onClick={keys.length ? () => setIsExpanded((exp) => !exp) : undefined}
				>
					{isExpanded ? (
						<Icon type="arrow-down" />
					) : (
						<Icon type="arrow-right" />
					)}

					{isExpanded ? (
						<>
							<a
								href="javascript:void(0);"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									e.stopImmediatePropagation();
									navigate(`state/${id}`);
								}}
								style={{ position: "relative", zIndex: 2 }}
							>
								{id}
							</a>{" "}
							{"{"}
						</>
					) : (
						safeStringify({ $$exome_id: id })
					)}
				</span>
			) : (
				"{"
			)}

			{isExpanded && (
				<>
					{keys.map((name) => (
						<div className={styles.wrap}>
							<ExploreLabel label={name} />:{" "}
							<ExploreValue value={value[name]} path={path.concat(name)} />
						</div>
					))}
					{"}"}
				</>
			)}
		</>
	);
}

export function OutputExplorer({ value }: { value: any }) {
	return (
		<div className={styles.wrap}>
			<ExploreValue value={value} />
		</div>
	);
}

function safeLabel(value: string) {
	if (/ /.test(value)) {
		return JSON.stringify(value);
	}

	return value;
}

export function safeStringify(value: any, depth = 0): string {
	if (Array.isArray(value)) {
		if (depth > 0) {
			return "[...]";
		}

		return (
			"[" +
			Object.values(value)
				.map((value) => safeStringify(value, depth + 1))
				.join(", ") +
			"]"
		);
	}

	if (typeof value === "object" && value) {
		if (value instanceof Date) {
			return "Date { " + value.toISOString() + " }";
		}

		if (value.$$exome_class) {
			return `${value.$$exome_class} {...}`;
		}

		if (value.$$exome_id) {
			return `${value.$$exome_id.split("-")[0]} {...}`;
		}

		let name = `${value.constructor.name} `;

		if (name === "Object ") {
			name = "";
		}

		if (depth > 0) {
			return `${name}{...}`;
		}

		return (
			`${name}{` +
			Object.entries(value)
				.map(
					([key, value]) =>
						`${safeLabel(key)}: ${safeStringify(value, depth + 1)}`,
				)
				.join(", ") +
			"}"
		);
	}

	if (value === undefined) {
		return "undefined";
	}

	if (depth === 0 && typeof value === "string") {
		return JSON.stringify(value).slice(1, -1);
	}

	if (typeof value === "function") {
		return value.toString();
	}

	return JSON.stringify(value);
}
