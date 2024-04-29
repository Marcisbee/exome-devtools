import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { JSXInternal } from "preact/src/jsx";

const tempSizes: Record<string, number> = {};

export function useResize(
	defaultSize: number,
	direction: "n" | "e" | "s" | "w",
	saveKey?: string,
) {
	const savedSize: number | undefined = tempSizes[saveKey!];
	const ref = useRef<HTMLDivElement>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [size, setSize] = useState(savedSize || defaultSize);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		if (!isEditMode) {
			return;
		}

		const currentHeight =
			ref.current!.getBoundingClientRect()[
				direction === "n" || direction === "s" ? "height" : "width"
			];
		setSize(currentHeight);

		function saveNewSize(newSize: number) {
			if (saveKey) {
				tempSizes[saveKey] = newSize;
			}

			return newSize;
		}

		function moveHandler(event: MouseEvent) {
			if (direction === "n") {
				setSize((size) => saveNewSize(size - event.movementY));
				return;
			}

			if (direction === "s") {
				setSize((size) => saveNewSize(size + event.movementY));
				return;
			}

			if (direction === "e") {
				setSize((size) => saveNewSize(size + event.movementX));
				return;
			}

			if (direction === "w") {
				setSize((size) => saveNewSize(size - event.movementX));
				return;
			}
		}
		window.addEventListener("mousemove", moveHandler);

		function mouseUpHandler() {
			setIsEditMode(false);
		}
		window.addEventListener("mouseup", mouseUpHandler, { once: true });
		window.addEventListener("mouseleave", mouseUpHandler);

		return () => {
			window.removeEventListener("mousemove", moveHandler);
			window.removeEventListener("mouseup", mouseUpHandler);
			window.removeEventListener("mouseleave", mouseUpHandler);
		};
	}, [isEditMode]);

	const onMouseDown = useCallback(
		(e: JSXInternal.TargetedMouseEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();

			setIsEditMode(true);
		},
		[setIsEditMode],
	);

	return [ref, onMouseDown, size] as const;
}
