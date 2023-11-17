import {
	Exome as targetExome,
	getExomeId as targetGetExomeId,
	update as targetUpdate,
} from "exome-target";
import { update } from "exome";
import { useStore } from "exome/preact";
import { useContext } from "preact/hooks";

import styles from "../../devtools.module.css";
import { routerContext } from "../../devtools/router";

function ExplorerValue({ value }: { value: any }) {
	if (value === undefined) {
		return <i style={{ color: "#808080" }}>undefined</i>;
	}

	if (value === null) {
		return <i style={{ color: "#808080" }}>null</i>;
	}

	const output = JSON.stringify(value);

	if (typeof value === "string") {
		return <span style={{ color: "#c41a16" }}>{output}</span>;
	}

	if (typeof value === "boolean") {
		return <span style={{ color: "#1c00cf" }}>{output}</span>;
	}

	return <span style={{ color: "#1c00cf" }}>{output}</span>;
}

export function StoreValueExplore({ instance, source, name }: any) {
	const { router } = useContext(routerContext);
	const { navigate } = useStore(router);

	const value = source[name];

	if (value == null || typeof value !== "object") {
		return (
			<>
				<ExplorerValue value={value} />
				<button
					type="button"
					className={styles.storeValueEditButton}
					onClick={() => {
						const newValue = prompt(`Update "${name}"?`, JSON.stringify(value));

						if (newValue == null) {
							return;
						}

						source[name] = JSON.parse(newValue);
						// @TODO
						targetUpdate(instance);
						update(router);
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
					</svg>
				</button>
			</>
		);
	}

	if (value instanceof targetExome) {
		const nameAndId = targetGetExomeId(value);
		const [name, id] = nameAndId.split("-");

		return (
			// biome-ignore lint/a11y/useValidAnchor: <explanation>
			<a
				href="javascript:void(0);"
				onClick={() => {
					navigate(`state/${nameAndId}`);
				}}
				className={styles.instanceLink}
			>
				{name}
				<span>-{id}</span>
			</a>
		);
	}

	const keys = Object.keys(value);

	if (Array.isArray(value)) {
		return (
			<>
				<span
					className={styles.tempText}
					data-text={`Array(${value.length})`}
				/>
				{" ["}
				{keys.map((name) => (
					<div style={{ paddingLeft: 10 }}>
						<ExplorerLabel label={name} />:{" "}
						<StoreValueExplore instance={instance} source={value} name={name} />
					</div>
				))}
				{"]"}
			</>
		);
	}

	if (value.constructor.name === "Object") {
		return (
			<>
				{"{"}
				{keys.map((name) => (
					<div style={{ paddingLeft: 10 }}>
						<ExplorerLabel label={name} />:{" "}
						<StoreValueExplore instance={instance} source={value} name={name} />
					</div>
				))}
				{"}"}
			</>
		);
	}

	return (
		<>
			<span style={{ opacity: 0.5 }}>
				{value.constructor.name}
				{" {...}"}
			</span>
		</>
	);
}

export function ExplorerLabel({ label }: { label: string }) {
	return <span style={{ color: "#881391" }}>{label}</span>;
}
