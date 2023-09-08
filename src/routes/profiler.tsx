import { useStore } from "exome/preact";
import { useContext, useState } from "preact/hooks";

import { devtoolsContext } from "../store";
import styles from "../devtools.module.css";
import { routerContext } from "../devtools/router";

import profilerStyles from "./profiler.module.css";
import { cc } from "../utils/cc";

function ProfilerScaleInput() {
	const [scale, setScale] = useState(1);

	return (
		<>
			<style style={{ display: "block" }}>
				{`:root {--profiler-scale: ${scale};}`}
			</style>
			<input
				type="range"
				value={scale}
				onInput={(e) => setScale(e.target!.value)}
				min={0.1}
				max={3}
				step={0.1}
			/>
		</>
	);
}

export function RouteDevtoolsProfiler() {
	const { router } = useContext(routerContext);
	const store = useContext(devtoolsContext);
	const { actions } = useStore(store.actions);

	let nn = 0;

	return (
		<div className={styles.body}>
			<div style={{ flex: 1, width: "100%" }}>
				<div>
					<ProfilerScaleInput />
				</div>

				<div>Not fully implemented</div>
				<div className={profilerStyles.row}>
					{actions.map(({ id, time, name, now, depth }, index) => {
						const diff = index ? now - nn : 0;

						if (index) {
							nn = now;
						}

						if (depth > 1) {
							return null;
						}

						return (
							<span
								className={cc([
									profilerStyles.action,
									time == null && profilerStyles.increase,
								])}
								style={{
									width: `calc(${time}px * var(--profiler-scale, 1))`,
									left: `calc(${diff}px * var(--profiler-scale, 1))`,
								}}
								onClick={() => {
									router.navigate(`actions/${id}`, "actions");
								}}
								title={name}
							/>
						);
					})}
				</div>
				<div className={profilerStyles.row}>
					{actions.map(({ id, time, name, now, depth }) => {
						if (depth !== 2) {
							return null;
						}

						return (
							<span
								className={profilerStyles.action}
								style={{
									width: Math.max(Math.floor(time!) / 3, 10),
									left: now / 10,
								}}
								onClick={() => {
									router.navigate(`actions/${id}`, "actions");
								}}
							>
								{name}
							</span>
						);
					})}
				</div>
			</div>
		</div>
	);
}
