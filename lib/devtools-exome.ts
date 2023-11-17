import { Exome, Middleware, getExomeId } from "exome";

export interface DevtoolsExtensionInterface {
	connect(config: {
		name: string;
		maxAge?: number;
	}): DevtoolsExtensionConnectionInterface;
}

export interface DevtoolsExtensionConnectionInterface {
	disconnect(): void;

	send(data: { event: "update"; type: "action"; payload: Action }): void;
	send(data: { event: "update"; type: "state"; payload: [string, any] }): void;

	send(data: { event: "send"; type: "actions"; payload: Action[] }): void;
	send(data: { event: "send"; type: "action"; payload: Action }): void;
	send(data: { event: "send"; type: "states"; payload: [string, any][] }): void;
	send(data: { event: "send"; type: "state"; payload: [string, any] }): void;

	subscribe(cb: (data: { type: "actions" }) => Action[]): () => void;
	subscribe(cb: (data: { type: "action" }) => Action): () => void;
	subscribe(cb: (data: { type: "states" }) => [string, any][]): () => void;
	subscribe(
		cb: (data: { type: "state" }) => [string, Record<string, any>],
	): () => void;
}

export interface ExomeDevtoolsConfig {
	name: string;
	maxAge?: number;
	ignoreListActions?: string[];
	ignoreListStores?: string[];
}

const fullStore = new Map<string, Map<string, Exome>>();
const fullActions: Action[] = [];

const descriptor = Object.getOwnPropertyDescriptor;

function deepCloneStore(value: any, depth: string[] = []): any {
	if (value == null || typeof value !== "object") {
		return value;
	}

	if (value instanceof Exome && getExomeId(value)) {
		const id = getExomeId(value);

		// Stop circular Exome
		if (depth.indexOf(id) > -1) {
			return {
				$$exome_id: id,
			};
		}

		const data = deepCloneStore({ ...value }, depth.concat(id));

		return {
			$$exome_id: id,
			...data,
		};
	}

	if (
		value.constructor !== Array &&
		value.constructor !== Object &&
		value.constructor !== Date
	) {
		return {
			$$exome_class: value.constructor.name,
		};
	}

	const output: Record<string, unknown> = value.constructor() || {};

	const proto = Object.getPrototypeOf(value);
	const methodNames = Object.getOwnPropertyNames(proto);

	for (const methodName of methodNames) {
		// output[key] = deepCloneStore(value[key], depth);
		if (methodName === "constructor") {
			continue;
		}

		const isGetter = typeof descriptor(proto, methodName)?.get === "function";

		if (isGetter) {
			// output.getters.push(methodName);
			continue;
		}

		output.$$action = methodName;
	}

	for (const key of Object.keys(value)) {
		output[key] = deepCloneStore(value[key], depth);
	}

	console.log(output);

	return output;
}

const getFullStore = () => {
	const output: Record<string, Exome[]> = {};

	for (const [key, map] of fullStore.entries()) {
		output[key] = Array.from(map.values());
	}

	// Improve serializer with `__serializedType__` once https://github.com/zalmoxisus/redux-devtools-extension/issues/737 is resolved
	return deepCloneStore(output);
};

export const exomeDevtools = ({
	name = "Exome",
	maxAge = 20,
	ignoreListActions = [],
	ignoreListStores = [],
}: ExomeDevtoolsConfig): Middleware => {
	const devtoolName: string = "__EXOME_DEVTOOLS_EXTENSION__";
	let extension: DevtoolsExtensionInterface | undefined;
	try {
		extension =
			(window as any)[devtoolName] || (window.top as any)[devtoolName];
	} catch (e) {}

	if (!extension) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				"Please install Exome devtools extension\n" +
					"https://github.com/Marcisbee/exome-devtools",
			);
		}
		return () => {};
	}

	let depth = 0;

	const connection = extension.connect({ name, maxAge });

	// connection.subscribe((message) => {
	// 	if (message.type === "DISPATCH" && message.state) {
	// 		// We'll just use json parse reviver function to update instances
	// 		JSON.parse(message.state, (_, value) => {
	// 			if (
	// 				typeof value === "object" &&
	// 				value !== null &&
	// 				"$$exome_id" in value
	// 			) {
	// 				const { $$exome_id, ...restValue } = value;
	// 				const [name] = $$exome_id.split("-");
	// 				const instance = fullStore.get(name)?.get($$exome_id);

	// 				Object.assign(instance!, restValue);

	// 				return instance;
	// 			}

	// 			return value;
	// 		});

	// 		updateAll();
	// 	}
	// });

	window.addEventListener("unload", connection.disconnect, { once: true });

	// Return requested data by
	connection.subscribe(({ type }) => {
		console.log("request", type);
		// if (type === "states") {
		// 	return ["Poo-123"];
		// }
	});

	return (instance, name, payload) => {
		const storeId = getExomeId(instance);
		const storeName = storeId.replace(/-[a-z0-9]+$/gi, "");

		if (ignoreListStores.indexOf(storeName) > -1) {
			return;
		}

		if (!fullStore.has(storeName)) {
			fullStore.set(storeName, new Map());
		}

		if (name === "NEW") {
			fullStore.get(storeName)?.set(storeId, instance);
			connection.send({
				event: "send",
				type: "state",
				payload: [storeId, exomeToJson(instance)],
			});
			return;
		}

		if (name === "LOAD_STATE") {
			connection.send({
				event: "update",
				type: "state",
				payload: [storeId, exomeToJson(instance)],
			});
			return;
		}

		const actionId = `${storeId}.${name}`;

		if (ignoreListActions.indexOf(`${storeName}.${name}`) > -1) {
			return;
		}

		const before = exomeToJson(instance);
		const id = String(Math.random());
		const trace = new Error().stack?.split(/\n/g)[6] || "";

		const start = performance.now();
		depth += 1;

		const action: Action = {
			id,
			name,
			instance: storeId,
			payload,
			now: start,
			depth,
			// time: performance.now() - start,
			trace,

			before,
		};

		addAction(action);
		connection.send({
			event: "send",
			type: "action",
			payload: action,
		});

		return () => {
			action.time = performance.now() - start;
			action.after = exomeToJson(instance);
			// count.get(actionId)!.push(action.time);

			depth -= 1;

			// update(devtoolsStore.actions);

			connection.send({
				event: "update",
				type: "action",
				payload: action,
			});

			// devtoolsStore.addAction({
			//   id: String(Math.random()),
			//   name,
			//   instance,
			//   payload,
			//   now: start,
			//   time: performance.now() - start,
			// });

			// let parsedPayload: any[] = [];

			// try {
			// 	parsedPayload = JSON.parse(JSON.stringify(payload));
			// } catch (e) {}

			// connection.send("", { type, payload: parsedPayload });
		};
	};

	function addAction(action: Action) {
		fullActions.push(action);

		if (fullActions.length > maxAge) {
			fullActions.splice(maxAge, fullActions.length - maxAge);
		}
	}
};

function exomeToJson(instance: Exome) {
	const proto = Object.getPrototypeOf(instance);
	const methodNames = Object.getOwnPropertyNames(proto);
	const propertyNames = Object.getOwnPropertyNames(instance).filter(
		(key) => methodNames.indexOf(key) === -1,
	);

	const data: Record<string, any> = {};

	for (const methodName of methodNames) {
		if (methodName === "constructor") {
			continue;
		}

		const isGetter = typeof descriptor(proto, methodName)?.get === "function";

		if (isGetter) {
			data[`$$exome_gt:${methodName}`] = (() => {
				try {
					return (instance as any)[methodName];
				} catch (e) {
					return String(e);
				}
			})();
			continue;
		}

		data[`$$exome_ac:${methodName}`] = String(proto[methodName]);
	}

	for (const propertyName of propertyNames) {
		const value = descriptor(instance, propertyName)?.value;
		const isMethod = typeof value === "function";

		if (isMethod) {
			data[`$$exome_sl:${propertyName}`] = propertyName;
			continue;
		}

		data[propertyName] = exomeToJsonDepth(value);
	}

	return data;
}

function exomeToJsonDepth(instance: any) {
	if (instance === undefined) {
		return instance;
	}

	return JSON.parse(
		JSON.stringify(
			instance,
			(key, value) => {
				if (value == null || typeof value !== "object") {
					return value;
				}

				if (value instanceof Exome && key !== "") {
					return {
						$$exome_id: getExomeId(value),
					};
				}

				if (
					value.constructor.name !== "Array" &&
					value.constructor.name !== "Object" &&
					value.constructor.name !== "Date" &&
					key !== ""
				) {
					return {
						$$exome_class: value.constructor.name,
					};
				}

				return value;
			},
			2,
		),
	);
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