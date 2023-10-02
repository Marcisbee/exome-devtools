import { getExomeId as targetGetExomeId } from "exome-target";
import { Exome, getExomeId } from "exome";

export function getExomeName(instance: Exome) {
	return getExomeId(instance).replace(/-[a-z0-9]+$/gi, "");
}

export function targetGetExomeName(instance: Exome) {
	return targetGetExomeId(instance).replace(/-[a-z0-9]+$/gi, "");
}
