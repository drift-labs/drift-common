import { PublicKey } from '@solana/web3.js';
import { useEffect, useRef } from 'react';
import { useDriftClientIsReady } from './useDriftClientIsReady';
import { useCommonDriftStore } from '../stores';
import { useCommonDriftActions } from './useCommonDriftActions';

export const useEmulation = () => {
	const actions = useCommonDriftActions();
	const driftClientIsReady = useDriftClientIsReady();
	const setCommonStore = useCommonDriftStore((s) => s.set);

	let urlAuthorityParam = '';
	if (typeof window !== 'undefined') {
		const searchParams = new URLSearchParams(window.location.search);
		urlAuthorityParam = searchParams.get('authority') ?? '';
	}

	const alreadyUsedRouteParams = useRef(false);

	// Handle query params from router
	useEffect(() => {
		if (!driftClientIsReady) return;

		if (urlAuthorityParam) {
			alreadyUsedRouteParams.current = true;

			// Must be trying to emulate an account
			//// Sometimes users accidentally type random things into the address bar which aren't a public key - avoid sending error about this and do nothing
			try {
				const authority = new PublicKey(urlAuthorityParam);
				setCommonStore((s) => {
					s.authority = authority;
					s.authorityString = `authority=${authority.toString()}`;
				});
				actions.emulateAccount({ authority });
			} catch (e) {
				console.log('no authority: ' + urlAuthorityParam);
			}
		} else {
			setCommonStore((s) => {
				s.authorityString = '';
			});
		}
	}, [urlAuthorityParam, driftClientIsReady]);

	return null;
};
