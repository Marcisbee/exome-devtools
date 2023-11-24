import { renderUI } from "exome-devtools";
import "exome-devtools/devtools.css";
import { onMessage, sendMessage } from "webext-bridge/devtools";

chrome.devtools.panels.create("🔶 Exome", "icon.png", "panel.html", (panel) => {
	// code invoked on panel creation
	panel.onShown.addListener((extPanelWindow) => {
		renderUI(extPanelWindow.document.getElementById("root")!);
	});
});

let connection: any;
// let tabId;

onMessage<{ type: string; data: any }>(
	"exome-forward-payload",
	async (event) => {
		if (event.data.type === "connect") {
			if (connection) {
				connection.disconnect();
			}

			// tabId = chrome.devtools.inspectedWindow.tabId

			connection = window.__EXOME_DEVTOOLS_EXTENSION__.connect(event.data.data);

			chrome.devtools.inspectedWindow.eval(
				`console.log("Exome Devtools Connected!");`,
			);

			connection.subscribe((event) => {
				sendMessage("exome-backward-payload", event, "content-script");
			});

			return;
		}

		if (!connection) {
			return;
		}

		if (event.data.type === "disconnect") {
			connection.disconnect();
			connection = undefined;
			return;
		}

		if (event.data.type === "send") {
			connection.send(event.data.data);
			return;
		}
	},
);
