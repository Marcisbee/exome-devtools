import { render } from "preact";
import { addMiddleware } from "exome";

import { inlineDevtools } from "./devtools";
import { Playground } from "./playground/playground";
import "./index.css";

addMiddleware(
	inlineDevtools({
		name: "Exome Devtools Playground",
		maxAge: 60,
	}),
);

const container = document.getElementById("root") as HTMLElement;

render(<Playground />, container);
