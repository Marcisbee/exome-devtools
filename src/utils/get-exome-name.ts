import { Exome, getExomeId } from "exome";

export function getExomeName(instance: Exome) {
	return getExomeId(instance).replace(/-[a-z0-9]+$/gi, "");
}
