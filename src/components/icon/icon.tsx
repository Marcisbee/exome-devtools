import type { JSXInternal } from "preact/src/jsx";
import { cc } from "../../utils/cc";

import "./icons.css";

export interface IconProps
	extends JSXInternal.DetailedHTMLProps<
		JSXInternal.HTMLAttributes<HTMLElement>,
		HTMLElement
	> {
	type: "arrow-down" | "arrow-right";
}

export function Icon({ type, className, ...props }: IconProps) {
	return <i {...props} className={cc([`icon-${type}`, className as string])} />;
}
