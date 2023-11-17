import { render } from "preact";
import { addMiddleware } from "exome";

import { exomeDevtools } from "../lib/devtools-exome";

// import { inlineDevtools } from "./devtools";
import { Playground } from "./playground/playground";
import "./index.css";

import { renderUI } from "./devtools";

// Render devtools UI
renderUI(document.getElementById("devtools")!);

addMiddleware(
	exomeDevtools({
		name: "Exome Devtools Playground",
		maxAge: 60,
		ignoreListStores: [
			"ConnectionsStore",
			"DevtoolsActionsStore",
			"DevtoolsStore",
			"RouterStore",
			"HistoryStore",
		],
	}),
);

const container = document.getElementById("root") as HTMLElement;

render(<Playground />, container);
