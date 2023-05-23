import { Exome } from "exome";
import { useState } from "preact/hooks";

import { StoreValueExplore } from "../value-explorer/value-explorer";

interface GetterValueProps {
	source: Exome;
	field: string;
}

export function GetterValue({ source, field }: GetterValueProps) {
	const [isOpen, setIsOpen] = useState(false);

	if (isOpen) {
		return <StoreValueExplore instance={source} source={source} name={field} />;
	}

	return (
		<button
			type="button"
			onClick={() => {
				setIsOpen(true);
			}}
			style={{ fontSize: 10, margin: "-5px 0" }}
		>
			show value
		</button>
	);
}
