import { useRef, useEffect } from 'react';

/**
 * A hook that fires the callback on mount and then at a given interval afterwards.
 */
export const useIntervalWithInitialCallback = (
	callback: () => void,
	delayMs: number
) => {
	const savedCallback = useRef<() => void>();

	// Remember the latest callback.
	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		function tick() {
			savedCallback.current && savedCallback.current();
		}

		tick();

		if (delayMs !== null) {
			const id = setInterval(tick, delayMs);
			return () => {
				clearInterval(id);
			};
		}
	}, [delayMs]);
};
