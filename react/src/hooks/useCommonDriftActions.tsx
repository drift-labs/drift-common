import createDriftActions from '../actions/driftActions';
import { useCommonDriftStore } from '../stores';

/**
 * Returns the common Drift actions object.
 */
export function useCommonDriftActions(): ReturnType<typeof createDriftActions> {
	const actions = useCommonDriftStore((s) => s.actions);

	return actions;
}
