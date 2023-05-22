import type { Exome } from "exome";

const descriptor = Object.getOwnPropertyDescriptor;

export function exploreExomeInstance(instance: Exome) {
	const output: {
		state: string[];
		getters: string[];
		silentActions: string[];
		actions: string[];
	} = {
		state: [],
		getters: [],
		silentActions: [],
		actions: [],
	};

	const proto = Object.getPrototypeOf(instance);
	const methodNames = Object.getOwnPropertyNames(proto);
	const propertyNames = Object.getOwnPropertyNames(instance).filter(
		(key) => methodNames.indexOf(key) === -1,
	);

	for (const methodName of methodNames) {
		if (methodName === "constructor") {
			continue;
		}

		const isGetter = typeof descriptor(proto, methodName)?.get === "function";
		// console.log(methodName, descriptor(proto, methodName));
		// console.dir(proto[methodName]);

		if (isGetter) {
			output.getters.push(methodName);
			continue;
		}

		output.actions.push(methodName);
	}

	for (const propertyName of propertyNames) {
		const isMethod =
			typeof descriptor(instance, propertyName)?.value === "function";

		if (isMethod) {
			output.silentActions.push(propertyName);
			continue;
		}

		output.state.push(propertyName);
	}

	return output;
}
