import { getExomeId as targetGetExomeId } from "exome-target";
import { Exome } from "exome";
import { createContext } from "preact";

export interface Action {
	id: string;
	name: string;
	payload: any[];
	instance: Exome;
	depth: number;
	now: number;
	time?: number;
	trace: string;
	before: Record<string, any>;
	after?: Record<string, any>;
}

export class DevtoolsActionsStore extends Exome {
	public actions: Action[] = [];
	public instances = new Map<string, Exome>();
	public count = new Map<string, number[]>();

	constructor(public maxAge: number) {
		super();
	}

	public addAction(action: Action) {
		this.actions.push(action);

		const actionId = `${targetGetExomeId(action.instance)}.${action.name}`;
		if (!this.count.has(actionId)) {
			this.count.set(actionId, []);
		}

		if (this.actions.length > this.maxAge) {
			this.actions.shift();
		}
	}

	public addInstance(instance: Exome) {
		this.instances.set(targetGetExomeId(instance), instance);
	}
}

export class DevtoolsStore extends Exome {
	public actions: DevtoolsActionsStore;

	constructor(public maxAge: number) {
		super();

		this.actions = new DevtoolsActionsStore(maxAge);
	}
}

export const devtoolsContext = createContext<DevtoolsStore>(null as any);
