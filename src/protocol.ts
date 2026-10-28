import type { Action } from "./store";

export interface DevtoolsExtensionInterface {
	connect(config: {
		name: string;
		maxAge?: number;
		details: {
			version: string;
		};
	}): DevtoolsExtensionConnectionInterface;
}

export interface DevtoolsExtensionConnectionInterface {
	disconnect(): void;

	send(data: { event: "remove"; type: "state"; payload: string }): void;

	send(data: {
		event: "update";
		type: "all";
		payload: { actions: Action[]; states: [string, any][] };
	}): void;
	send(data: { event: "update"; type: "action"; payload: Action }): void;
	send(data: {
		event: "update";
		type: "state";
		payload: [string, any] | [string, any, string];
	}): void;

	send(data: { event: "send"; type: "actions"; payload: Action[] }): void;
	send(data: { event: "send"; type: "action"; payload: Action }): void;
	send(data: { event: "send"; type: "states"; payload: [string, any][] }): void;
	send(data: { event: "send"; type: "state"; payload: [string, any] }): void;

	subscribe(cb: (data: { type: "sync" }) => void): () => void;
}

export interface ExomeDevtoolsConfig {
	name: string;
	maxAge?: number;
	ignoreListActions?: string[];
	ignoreListStores?: string[];
}
