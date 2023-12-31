import { useCommonDriftStore } from '../stores';

/**
 * Checks if the drift client is subscribed and ready to use.
 */
export const useDriftClientIsReady = () => {
	const driftClientIsReady = useCommonDriftStore((s) => {
		return (
			s.driftClient.client &&
			s.driftClient.client.isSubscribed &&
			s.driftClient.isSubscribed
		);
	});

	return driftClientIsReady;
};
