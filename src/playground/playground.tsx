import { CounterComponent } from "./counter";

export function Playground() {
	return (
		<div>
			<div>
				{"<CounterComponent>"}
				<CounterComponent />
			</div>
		</div>
	);
}
