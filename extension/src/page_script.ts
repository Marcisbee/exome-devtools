if (document.contentType === "text/html") {
	function postMessage(type: string, data: any) {
		return window.postMessage(
			{
				source: "exome-devtools-extension-out",
				data: {
					type,
					data,
				},
			},
			"*",
		);
	}

	const subscribers: ((event: any) => any)[] = [];

	window.addEventListener("message", async (event) => {
		// Only accept messages from the same frame
		if (event.source !== window) {
			return;
		}

		const message = event.data;

		// Only accept messages that we know are ours
		if (
			typeof message !== "object" ||
			message === null ||
			message.source !== "exome-devtools-extension-in"
		) {
			return;
		}

		for (const cb of subscribers) {
			cb(event.data.data);
		}
	});

	(window as any).__EXOME_DEVTOOLS_EXTENSION__ = {
		connect(config) {
			// @TODO create id
			postMessage("connect", config);

			return {
				disconnect() {
					postMessage("disconnect", config);
				},
				send(data) {
					postMessage("send", data);
				},
				subscribe(cb) {
					subscribers.push(cb);
					return () => {
						subscribers.splice(subscribers.indexOf(cb), 1);
					};
				},
			};
		},
	} satisfies DevtoolsExtensionInterface;
}

export interface DevtoolsExtensionInterface {
	connect(config: {
		name: string;
		maxAge?: number;
	}): DevtoolsExtensionConnectionInterface;
}

export interface DevtoolsExtensionConnectionInterface {
	disconnect(): void;

	send(data: {
		event: "update";
		type: "all";
		payload: { actions: Action[]; states: [string, any][] };
	}): void;
	send(data: { event: "update"; type: "action"; payload: Action }): void;
	send(data: {
		event: "update";
		type: "state";
		payload: [string, any] | [string, any, string];
	}): void;

	send(data: { event: "send"; type: "actions"; payload: Action[] }): void;
	send(data: { event: "send"; type: "action"; payload: Action }): void;
	send(data: { event: "send"; type: "states"; payload: [string, any][] }): void;
	send(data: { event: "send"; type: "state"; payload: [string, any] }): void;

	subscribe(cb: (data: { type: "sync" }) => void): () => void;
}

interface Action {
	id: string;
	name: string;
	payload: any[];
	instance: string;
	depth: number;
	now: number;
	time?: number;
	trace: string;
	before: Record<string, any>;
	after?: Record<string, any>;
}
