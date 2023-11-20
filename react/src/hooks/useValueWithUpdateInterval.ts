import { useState } from 'react';
import { useIntervalWithInitialCallback } from './useIntervalWithInitialCallback';

export const useValueWithUpdateInterval = <T>(
	valueGetter: () => T,
	interval: number
) => {
	const [returnVal, setReturnVal] = useState(valueGetter());

	useIntervalWithInitialCallback(() => {
		setReturnVal(valueGetter());
	}, interval);

	return [returnVal, setReturnVal] as [T, (val: T) => void];
};
