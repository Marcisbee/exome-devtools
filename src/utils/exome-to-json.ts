import { Exome, getExomeId } from "exome";

export function exomeToJson(instance: Exome) {
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
