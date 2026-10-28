import { render } from "preact";
import { addMiddleware } from "exome";

import { unstableExomeDevtools } from "exome/devtools";

import { startConnectionDemo } from "./playground/connections-demo";
import { Playground } from "./playground/playground";
import "./index.css";

import { renderUI } from "./devtools";

// Render devtools UI
renderUI(document.getElementById("devtools")!);

const live = new URLSearchParams(location.search).has("playground");
document.body.classList.toggle("live-playground", live);
render(
	<header className="preview-bar">
		<span>{live ? "Live middleware playground" : "Connection demo · Sample data"}</span>
		<a href={live ? "?" : "?playground"}>
			{live ? "Connection demo" : "Live playground"}
		</a>
	</header>,
	document.getElementById("root")!,
);

if (live) {
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

	const container = document.getElementById("playground") as HTMLElement;

	render(<Playground />, container);
} else {
	startConnectionDemo();
}
