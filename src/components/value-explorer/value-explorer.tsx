import { Exome, getExomeId } from "exome";
import { useStore } from "exome/preact";
import { useContext } from "preact/hooks";

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
		return <ExplorerValue value={value} />;
	}

	if (value instanceof Exome) {
		const id = getExomeId(value);

		return (
			// rome-ignore lint/a11y/useValidAnchor: <explanation>
			<a
				href="javascript:void(0);"
				onClick={() => {
					navigate(`state/${id}`);
				}}
				style={{ color: "#222", textDecoration: "underline" }}
			>
				{id}
			</a>
		);
	}

	const keys = Object.keys(value);

	if (Array.isArray(value)) {
		return (
			<>
				<span style={{ opacity: 0.5 }}>{`Array(${value.length})`}</span>
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
