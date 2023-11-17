import { useState } from "preact/hooks";

import { StoreValueExplore } from "../value-explorer/value-explorer";
import styles from "../../devtools.module.css";

interface GetterValueProps {
	source: Record<string, any>;
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
			className={styles.getterButton}
		>
			show value
		</button>
	);
}
