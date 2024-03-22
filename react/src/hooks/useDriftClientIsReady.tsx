import { useCommonDriftStore } from '../stores';

/**
 * Checks if the drift client is subscribed and ready to use.
 */
export const useDriftClientIsReady = () => {
	const driftClientIsReady = useCommonDriftStore((s) => {
		return s.checkIsDriftClientReady();
	});

	return driftClientIsReady;
};
