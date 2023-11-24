import { onMessage, sendMessage } from "webext-bridge/content-script";

window.addEventListener(
	"message",
	async (event) => {
		// Only accept messages from the same frame
		if (event.source !== window) {
			return;
		}

		const message = event.data;

		// Only accept messages that we know are ours
		if (
			typeof message !== "object" ||
			message === null ||
			message.source !== "exome-devtools-extension-out"
		) {
			return;
		}

		await sendMessage("exome-forward-payload", message.data, "devtools");
	},
	{ passive: true },
);

onMessage("exome-backward-payload", (data) => {
	window.postMessage(
		{
			source: "exome-devtools-extension-in",
			data: data.data,
		},
		"*",
	);
});
