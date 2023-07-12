import posthog from 'posthog-js';
import { useEffect } from 'react';
import { useWalletContext } from './useWalletContext';

/**
 * Initializes the PostHog user with the current wallet public key.
 */
export const useInitPostHogUser = () => {
	const walletContext = useWalletContext();
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
