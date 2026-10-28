import type { PerformanceReport } from "./performance";
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
	error?: string;
	response?: any;
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

	// Statistics describe completed actions in the retained history window.
	private rebuildCounts() {
		this.count = new Map();
		for (const action of this.actions) {
			if (action.time === undefined) continue;
			const key = `${action.instance}.${action.name}`;
			if (!this.count.has(key)) this.count.set(key, []);
			this.count.get(key)!.push(action.time);
		}
	}

	public addAction(action: Action) {
		const existing = this.actions.findIndex((item) => item.id === action.id);
		if (existing >= 0) this.actions[existing] = structuredClone(action);
		else this.actions.push(structuredClone(action));
		const limit = Number.isFinite(this.maxAge)
			? Math.max(0, Math.floor(this.maxAge))
			: 20;
		this.actions.splice(0, Math.max(0, this.actions.length - limit));
		this.rebuildCounts();
	}

	public addInstance(name: string, state: Record<string, any>) {
		this.instances.set(name, structuredClone(state));
	}

	public replaceSnapshot(
		states: [string, Record<string, any>][],
		actions: Action[],
	) {
		this.instances = new Map(structuredClone(states));
		this.actions = [];
		for (const action of actions) this.addAction(action);
		this.rebuildCounts();
	}

	public updateAction(action: Action) {
		const existing = this.actions.find((item) => item.id === action.id);
		if (existing) Object.assign(existing, structuredClone(action));
		// Live state arrives through state messages; an old async completion must
		// not overwrite a newer state snapshot.
		this.rebuildCounts();
	}

	public updateInstance(
		name: string,
		state: Record<string, any>,
		newName?: string,
	) {
		if (newName) {
			this.instances.delete(name);
			this.instances.set(newName, structuredClone(state));
			return;
		}

		this.instances.set(name, structuredClone(state));
	}
}

export class DevtoolsEventStore extends Exome {
	public sync() {}
}

export class DevtoolsStore extends Exome {
	public events = new DevtoolsEventStore();
	public performanceReport: PerformanceReport | null = null;

	public setPerformanceReport(report: PerformanceReport | null) {
		this.performanceReport = report;
	}
	public actions: DevtoolsActionsStore;

	constructor(
		public name: string,
		public maxAge: number,
		public details: { version: string },
	) {
		super();

		this.actions = new DevtoolsActionsStore(maxAge);
	}
}

export const devtoolsContext = createContext<DevtoolsStore>(null as any);
