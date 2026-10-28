import { renderUI } from "exome-devtools";
import "exome-devtools/devtools.css";
import { onMessage, sendMessage } from "webext-bridge/devtools";
import type {
	DevtoolsExtensionConnectionInterface,
	DevtoolsExtensionInterface,
} from "../../src/protocol";

const connections = new Map<
	string,
	{
		documentId: string;
		frameId: number;
		connection: DevtoolsExtensionConnectionInterface;
		unsubscribe: () => void;
	}
>();
function remove(key: string) {
	const entry = connections.get(key);
	if (!entry) return;
	entry.unsubscribe();
	entry.connection.disconnect();
	connections.delete(key);
}
function discover() {
	// Also reaches frames that connected before DevTools was opened.
	chrome.scripting
		.executeScript({
			target: { tabId: chrome.devtools.inspectedWindow.tabId, allFrames: true },
			world: "MAIN",
			func: () =>
				window.postMessage(
					{ source: "exome-devtools-extension-in", data: { type: "discover" } },
					"*",
				),
		})
		.catch(() => {
			/* Restricted browser pages cannot be inspected. */
		});
}
const mounted = new WeakSet<Document>();
chrome.devtools.panels.create(
	"🔶 Exome",
	"assets/logo32.png",
	"panel.html",
	(panel) => {
		panel.onShown.addListener((panelWindow) => {
			if (!mounted.has(panelWindow.document)) {
				renderUI(panelWindow.document.getElementById("root")!);
				mounted.add(panelWindow.document);
			}
			discover();
		});
	},
);

onMessage<any>("exome-forward-payload", (event) => {
	const { type, id, documentId, data } = event.data || {};
	const frameId = event.sender.frameId ?? 0;
	if (typeof id !== "string" || typeof documentId !== "string") return;
	const key = `${frameId}:${documentId}:${id}`;
	const destination = {
		context: "content-script" as const,
		tabId: chrome.devtools.inspectedWindow.tabId,
		frameId,
	};
	const sync = () =>
		sendMessage(
			"exome-backward-payload",
			{ id, documentId, data: { type: "sync" } },
			destination,
		).catch(() => {});
	if (type === "connect") {
		if (!data || typeof data.name !== "string" || !data.details) return;
		// A frame navigation replaces all connections from its previous document.
		for (const [otherKey, entry] of connections) {
			if (entry.frameId === frameId && entry.documentId !== documentId)
				remove(otherKey);
		}
		if (connections.has(key)) {
			void sync();
			return;
		}
		const connection = (
			(window as any).__EXOME_DEVTOOLS_EXTENSION__ as DevtoolsExtensionInterface
		).connect(data);
		const unsubscribe = connection.subscribe(() => {
			void sync();
		});
		connections.set(key, { frameId, documentId, connection, unsubscribe });
	} else if (type === "disconnect") {
		remove(key);
	} else if (type === "send" && data && typeof data === "object") {
		connections.get(key)?.connection.send(data);
	}
});
chrome.devtools.network.onNavigated.addListener(() => {
	for (const key of connections.keys()) remove(key);
	discover();
});
window.addEventListener("unload", () => {
	for (const key of connections.keys()) remove(key);
});
discover();
