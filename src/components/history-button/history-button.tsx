import { useStore } from "exome/preact";
import { useContext } from "preact/hooks";

import { routerContext } from "../../devtools/router";

export function HistoryButtonBack() {
	const { router } = useContext(routerContext);
	const { canGoBack, back } = useStore(router.history);

	return (
		<button
			type="button"
			onClick={back}
			disabled={!canGoBack}
			style={{ color: !canGoBack ? "silver" : undefined }}
		>
			back
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
			style={{ color: !canGoNext ? "silver" : undefined }}
		>
			next
		</button>
	);
}
