import { Exome, getExomeId } from "exome";
import { useState } from "preact/hooks";

interface GetterValueProps {
	source: Exome;
	field: string;
}

export function GetterValue({ source, field }: GetterValueProps) {
	const [value, setValue] = useState();
	const [isOpen, setIsOpen] = useState(false);

	if (isOpen) {
		return (
			<span>
				{JSON.stringify(
					value,
					(_key, value) => {
						if (value == null || typeof value !== "object") {
							return value;
						}

						if (value instanceof Exome) {
							return {
								$$exome_id: getExomeId(value),
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

						return value;
					},
					" ",
				)}
			</span>
		);
	}

	return (
		<button
			type="button"
			onClick={() => {
				setValue((source as any)[field]);
				setIsOpen(true);
			}}
			style={{ fontSize: 10, margin: "-5px 0" }}
		>
			show value
		</button>
	);
}
