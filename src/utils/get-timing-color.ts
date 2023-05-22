import { hexToColor, lerpMultipleColors } from "./color-lerp";

const timingColor = lerpMultipleColors({
	0: 0x8bc34a,
	1: 0xf44336,
});

export function getTimingColor(time?: number) {
	if (time == null) {
		return;
	}

	return hexToColor(timingColor(Math.min(1, time / 100)));
}
