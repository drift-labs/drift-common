import { useCallback, useEffect, useState } from 'react';
import createDriftActions from '../actions/driftActions';
import { useCommonDriftStore } from '../stores';

/**
 * Returns the common Drift actions object.
 */
export function useCommonDriftActions(): ReturnType<typeof createDriftActions> {
	const [getStore, setStore] = useCommonDriftStore((s) => [s.get, s.set]);

	const getActions = useCallback(() => {
		return createDriftActions(getStore, setStore);
	}, [getStore, setStore]);

	const [actions, setActions] = useState(getActions());

	useEffect(() => {
		setActions(getActions());
	}, [getActions]);

	return actions;
}
