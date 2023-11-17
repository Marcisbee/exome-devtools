export const PROPERTY_TYPE_GETTER = "$$exome_gt";
export const PROPERTY_TYPE_ACTION = "$$exome_ac";
export const PROPERTY_TYPE_SILENT = "$$exome_sl";

export function exploreExomeInstance(instance: Record<string, any>) {
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

	for (const propertyName of propertyNames) {
		const [type, name] = propertyName.split(":");

		if (type === PROPERTY_TYPE_GETTER) {
			output.getters.push(name);
			continue;
		}

		if (type === PROPERTY_TYPE_ACTION) {
			output.actions.push(name);
			continue;
		}

		if (type === PROPERTY_TYPE_SILENT) {
			output.silentActions.push(name);
			continue;
		}

		output.state.push(propertyName);
	}

	return output;
}
