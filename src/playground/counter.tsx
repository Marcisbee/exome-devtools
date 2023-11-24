import { Exome } from "exome";
import { useStore } from "exome/preact";
import { useEffect, useMemo } from "preact/hooks";

export class CounterStore extends Exome {
	public count = 0;
	public get double() {
		return this.count * 2;
	}

	public increment(by = 1) {
		this.count += by;
	}

	public decrement(by = 1) {
		this.count -= by;
	}

	public reset() {
		this.count = 0;
	}

	public silentIncrement = () => {
		this.count += 1;
	};
}

export function CounterComponent() {
	const { count, double, increment, decrement, silentIncrement, reset } =
		useStore(useMemo(() => new CounterStore(), []));

	useEffect(() => {
		// Let's start with initial actions

		increment();
		increment(10);
		decrement(2);
	}, []);

	return (
		<div>
			<span>count: {count}</span>
			<br />
			<span>double: {double}</span>
			<br />
			<button type="button" onClick={() => increment(1)}>
				+1
			</button>
			<button type="button" onClick={() => increment(5)}>
				+5
			</button>
			<button type="button" onClick={() => decrement(1)}>
				-1
			</button>
			<button type="button" onClick={() => decrement(5)}>
				-5
			</button>
			<button type="button" onClick={reset}>
				reset
			</button>
			<br />
			<button type="button" onClick={silentIncrement}>
				+1 (silent)
			</button>
		</div>
	);
}
