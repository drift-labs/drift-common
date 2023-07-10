import { useDriftStore } from '../stores';

/**
 * Checks if the drift client is subscribed and ready to use.
 */
const useDriftClientIsReady = () => {
	const driftClientIsReady = useDriftStore((s) => {
		return (
			s.driftClient.client &&
			s.driftClient.client.isSubscribed &&
			s.driftClient.isSubscribed
		);
	});

	return driftClientIsReady;
};

export default useDriftClientIsReady;
