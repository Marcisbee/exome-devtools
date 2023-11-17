import { Exome, getExomeId } from "exome";

const descriptor = Object.getOwnPropertyDescriptor;

export function targetExomeToJson(instance: Exome) {
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
			// output.getters.push(methodName);
			continue;
		}

		data.$$action = methodName;
	}

	for (const propertyName of propertyNames) {
		const value = descriptor(instance, propertyName)?.value;
		const isMethod = typeof value === "function";

		if (isMethod) {
			data.$$silent = propertyName;
			continue;
		}

		data[propertyName] = targetExomeToJsonDepth(value);
	}

	return data;

	// return JSON.parse(
	// 	JSON.stringify(
	// 		instance,
	// 		(key, value) => {
	// 			if (value == null || typeof value !== "object") {
	// 				return value;
	// 			}

	// 			if (value instanceof Exome && key !== "") {
	// 				return {
	// 					$$exome_id: getExomeId(value),
	// 				};
	// 			}

	// 			if (
	// 				value.constructor.name !== "Array" &&
	// 				value.constructor.name !== "Object" &&
	// 				value.constructor.name !== "Date" &&
	// 				key !== ""
	// 			) {
	// 				return {
	// 					$$exome_class: value.constructor.name,
	// 				};
	// 			}

	// 			return value;
	// 		},
	// 		2,
	// 	),
	// );
}

export function targetExomeToJsonDepth(instance: any) {
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
