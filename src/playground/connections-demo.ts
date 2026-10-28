import type { DevtoolsExtensionInterface } from "../protocol";

// Development-only fixtures delivered through the same connection API as apps.
export function startConnectionDemo() {
	const extension = (window as unknown as {
		__EXOME_DEVTOOLS_EXTENSION__: DevtoolsExtensionInterface;
	}).__EXOME_DEVTOOLS_EXTENSION__;
	for (const [name, count, action] of [
		["Shop application", 3, "addItem"],
		["Admin application", 200, "refreshInventory"],
	] as const) {
		const connection = extension.connect({
			name, maxAge: 20, details: { version: "2.6.0" },
		});
		const sync = () => connection.send({
			event: "update", type: "all",
			payload: {
				states: [["Counter-1", { count, application: name }]],
				actions: [{
					id: "1", instance: "Counter-1", name: action,
					depth: 1, now: 0, time: 2, payload: [], trace: "",
					before: { count: count - 1 }, after: { count },
				}],
			},
		});
		connection.subscribe(sync);
		sync();
	}
}
