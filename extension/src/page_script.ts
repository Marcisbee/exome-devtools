import type { DevtoolsExtensionInterface } from "../../src/protocol";

if (document.contentType === "text/html") {
	const documentId = crypto.randomUUID();
	let nextId = 0;
	const connections = new Map<
		string,
		{ config: unknown; subscribers: Set<(event: any) => void> }
	>();
	function post(type: string, id: string, data: unknown) {
		window.postMessage(
			{
				source: "exome-devtools-extension-out",
				data: { type, id, documentId, data },
			},
			"*",
		);
	}
	window.addEventListener("message", (event) => {
		if (
			event.source !== window ||
			event.data?.source !== "exome-devtools-extension-in"
		)
			return;
		const message = event.data.data;
		if (message?.type === "discover") {
			for (const [id, connection] of connections)
				post("connect", id, connection.config);
			return;
		}
		if (message?.documentId !== documentId) return;
		const connection = connections.get(message.id);
		if (!connection || message.data?.type !== "sync") return;
		for (const cb of connection.subscribers) cb(message.data);
	});

	(window as any).__EXOME_DEVTOOLS_EXTENSION__ = {
		connect(config) {
			const id = String(++nextId);
			const connection = {
				config,
				subscribers: new Set<(event: any) => void>(),
			};
			connections.set(id, connection);
			post("connect", id, config);
			return {
				disconnect() {
					if (!connections.delete(id)) return;
					connection.subscribers.clear();
					post("disconnect", id, null);
				},
				send(data) {
					if (connections.has(id)) post("send", id, data);
				},
				subscribe(cb) {
					if (!connections.has(id)) return () => {};
					connection.subscribers.add(cb);
					return () => {
						connection.subscribers.delete(cb);
					};
				},
			};
		},
	} satisfies DevtoolsExtensionInterface;
}
