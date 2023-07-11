import posthog from 'posthog-js';
import { useEffect } from 'react';
import { useCommonDriftStore } from '../stores';

/**
 * Initializes the PostHog user with the current wallet public key.
 */
const useInitPostHogUser = () => {
	const walletContext = useCommonDriftStore((s) => s.currentlyConnectedWalletContext);
	const publicKey = walletContext?.publicKey;

	useEffect(() => {
		if (!publicKey) {
			try {
				posthog.reset();
			} catch {
				// ignore
			}
		} else {
			posthog.identify(publicKey.toBase58());
		}
	}, [publicKey, posthog]);
};

export default useInitPostHogUser;
