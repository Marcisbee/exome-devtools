import { useStore } from "exome/preact";
import { useContext } from "preact/hooks";

import { routerContext } from "../../devtools/router";

import styles from "./history-button.module.css";

export function HistoryButtonBack() {
	const { router } = useContext(routerContext);
	const { canGoBack, back } = useStore(router.history);

	return (
		<button
			type="button"
			onClick={back}
			disabled={!canGoBack}
			className={styles.historyButton}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fillRule="evenodd"
					d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
					clipRule="evenodd"
				/>
			</svg>
		</button>
	);
}

export function HistoryButtonNext() {
	const { router } = useContext(routerContext);
	const { canGoNext, next } = useStore(router.history);

	return (
		<button
			type="button"
			onClick={next}
			disabled={!canGoNext}
			className={styles.historyButton}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fillRule="evenodd"
					d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
					clipRule="evenodd"
				/>
			</svg>
		</button>
	);
}
