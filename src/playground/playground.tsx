import { CounterComponent } from "./counter";
import { JokeComponent } from "./joke";

export function Playground() {
	return (
		<div>
			<div>
				{"<CounterComponent>"}
				<CounterComponent />
			</div>

			<br />

			<div>
				{"<JokeComponent>"}
				<JokeComponent />
			</div>
		</div>
	);
}
