import { Exome } from "exome";
import { useStore } from "exome/preact";
import { useMemo, useState } from "preact/hooks";

function useAsyncAction<T extends (...args: any[]) => Promise<any>>(action: T) {
	const [isLoading, setIsLoading] = useState(false);

	return [
		(async (...args: Parameters<T>) => {
			setIsLoading(true);
			const output = await action(...args);
			setIsLoading(false);

			return output;
		}) as T,
		isLoading,
	] as const;
}

export class JokeStore extends Exome {
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
		</div>
	);
}
