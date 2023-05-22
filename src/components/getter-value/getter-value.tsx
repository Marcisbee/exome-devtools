import { Exome } from "exome";
import { useState } from "preact/hooks";

interface GetterValueProps {
	source: Exome;
	field: string;
}

export function GetterValue({ source, field }: GetterValueProps) {
	const [value, setValue] = useState();
	const [isOpen, setIsOpen] = useState(false);

	if (isOpen) {
		return <span>{JSON.stringify(value, null, " ")}</span>;
	}

	return (
		<button
			type="button"
			onClick={() => {
				setValue((source as any)[field]);
				setIsOpen(true);
			}}
			style={{ fontSize: 10, margin: '-5px 0' }}
		>
			show value
		</button>
	);
}
