import { Exome } from "exome";
import { createContext } from "preact";

export interface Action {
	id: string;
	name: string;
	payload: any[];
	instance: string;
	depth: number;
	now: number;
	time?: number;
	trace: string;
	before: Record<string, any>;
	after?: Record<string, any>;
}

export class DevtoolsActionsStore extends Exome {
	public actions: Action[] = [];
	public instances = new Map<string, Record<string, any>>();
	public count = new Map<string, number[]>();

	constructor(public maxAge: number) {
		super();
	}

	public addAction(action: Action) {
		this.actions.push(action);

		const actionId = `${action.instance}.${action.name}`;
		if (!this.count.has(actionId)) {
			this.count.set(actionId, []);
		}

		if (this.actions.length > this.maxAge) {
			this.actions.shift();
		}
	}

	public addInstance(name: string, state: Record<string, any>) {
		this.instances.set(name, state);
	}

	public updateAction(action: Action) {
		const existingAction = this.actions.find(({ id }) => action.id === id);

		if (!existingAction) {
			// Nothing to update
			return;
		}

		const actionId = `${action.instance}.${action.name}`;
		this.count.get(actionId)!.push(action.time!);

		Object.assign(existingAction, action);
		this.instances.set(action.instance, action.after!);
	}

	public updateInstance(name: string, state: Record<string, any>) {
		this.instances.set(name, state);
	}
}

export class DevtoolsStore extends Exome {
	public actions: DevtoolsActionsStore;

	constructor(public name: string, public maxAge: number) {
		super();

		this.actions = new DevtoolsActionsStore(maxAge);
	}
}

export const devtoolsContext = createContext<DevtoolsStore>(null as any);
