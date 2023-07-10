import { useCallback, useEffect, useState } from 'react';
import createDriftActions from '../actions/driftActions';
import { useDriftStore } from '../stores';

/**
 * Returns the common Drift actions object.
 */
function useCommonDriftActions(): ReturnType<typeof createDriftActions> {
	const [getStore, setStore] = useDriftStore((s) => [s.get, s.set]);

	const getActions = useCallback(() => {
		return createDriftActions(getStore, setStore);
	}, [getStore, setStore]);

	const [actions, setActions] = useState(getActions());

	useEffect(() => {
		setActions(getActions());
	}, [getActions]);

	return actions;
}

export default useCommonDriftActions;
