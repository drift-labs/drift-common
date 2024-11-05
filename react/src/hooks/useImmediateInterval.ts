import { useRef, useEffect } from 'react';

/**
 * Immediately invoking the callback function upon mounting, and executes the callback at a specified interval afterwards.
 *
 * @param callback - The function to be executed at the specified interval.
 * @param delayMs - The delay in milliseconds between each execution of the callback function.
 * @param runOnCallbackChange - Determines whether the callback should be executed immediately when it changes.
 */
export function useImmediateInterval(
	callback: () => void,
	delayMs: number,
	runOnCallbackChange = false
) {
	const savedCallback: React.MutableRefObject<(() => void) | null> =
		useRef<() => void>(null);

	// Remember the latest callback.
	useEffect(() => {
		savedCallback.current = callback;
		runOnCallbackChange && savedCallback.current?.();
	}, [callback, runOnCallbackChange]);

	// Set up the interval.
	useEffect(() => {
		function tick() {
			savedCallback.current && savedCallback.current();
		}

		tick();

		if (delayMs) {
			const id = setInterval(tick, delayMs);
			return () => {
				clearInterval(id);
			};
		}
	}, [delayMs]);
}
