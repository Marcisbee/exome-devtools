import { Exome } from "exome";
import { useStore } from "exome/preact";
import { useMemo, useState } from "preact/hooks";

function useAsyncAction<T extends (...args: any[]) => Promise<any>>(action: T) {
	const [isLoading, setIsLoading] = useState(false);

	return [
		(async (...args: Parameters<T>) => {
			setIsLoading(true);
			try {
				const output = await action(...args);
				setIsLoading(false);

				return output;
			} finally {
				setIsLoading(false);
			}
		}) as T,
		isLoading,
	] as const;
}

export class PoopStore extends Exome {
	public test = {
		foo: [1, 2, null, undefined, NaN, 0.5, true, false, "asd", {}],
	};

	public dom = window.document;

	public test2() {}
	public get test3() {}
	public test4 = () => {};
}

export class JokeStore extends Exome {
	public poop = new PoopStore();

	public joke?: {
		icon_url: string;
		id: string;
		url: string;
		value: string;
	};

	public get jokeText() {
		return this.joke?.value;
	}

	public async getJoke() {
		this.joke = await fetch("https://api.chucknorris.io/jokes/random").then(
			(response) => response.json(),
		);
		this.poop = new PoopStore();
	}

	public async getError() {
		throw new Error("Async error");
	}

	public clear() {
		this.joke = undefined;
	}
}

export function JokeComponent() {
	const {
		joke,
		jokeText,
		getJoke: getJokeAsync,
		getError,
		clear,
	} = useStore(useMemo(() => new JokeStore(), []));
	const [getJoke, isGettingJoke] = useAsyncAction(getJokeAsync);

	return (
		<div>
			<p>{joke ? jokeText : <i>No joke</i>}</p>
			<br />
			<button type="button" onClick={getJoke} disabled={isGettingJoke}>
				get joke
			</button>
			<button type="button" onClick={clear}>
				clear
			</button>
			<button type="button" onClick={getError}>
				get error
			</button>
		</div>
	);
}
