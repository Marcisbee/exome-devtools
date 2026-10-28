import { Exome } from "exome";
export class Counter extends Exome {
	count = 100;
	increment() {
		this.count++;
	}
}
export const createStore = () => new Counter();
