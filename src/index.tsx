import { render } from "preact";
import { addMiddleware } from "exome";

import { unstableExomeDevtools } from "exome/devtools";

// import { inlineDevtools } from "./devtools";
import { Playground } from "./playground/playground";
import "./index.css";

import { renderUI } from "./devtools";

// Render devtools UI
renderUI(document.getElementById("devtools")!);

addMiddleware(
	unstableExomeDevtools({
		name: "Exome Devtools Playground",
		maxAge: 60,
		ignoreListStores: [
			"ConnectionsStore",
			"DevtoolsActionsStore",
			"DevtoolsStore",
			"DevtoolsEventStore",
			"RouterStore",
			"HistoryStore",
		],
	}),
);

const container = document.getElementById("root") as HTMLElement;

render(<Playground />, container);
