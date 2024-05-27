import { useEffect } from 'react';
import { useCommonDriftStore } from '../stores';
import { useDevSwitchIsOn } from './useDevSwitchIsOn';
import useIsMainnet from './useIsMainnet';
import { useWalletContext } from './useWalletContext';
import { GEOBLOCK_LIST } from '@drift/common';

export const checkIfCountryIsBlocked = async () => {
	if (process.env.NEXT_PUBLIC_IGNORE_GEOBLOCK === 'true') {
		return false;
	}

	const result = await fetch(`https://geolocation.drift-labs.workers.dev/`, {
		cache: 'no-cache',
	});

	if (!result.ok) {
		// handle error
		return;
	}

	const country_code = await result.text();

	const countryIsBlocked = !!GEOBLOCK_LIST.find(
		(country) => country.code === country_code
	);

	return countryIsBlocked;
};

/**
 * Checks and sets the geo-block status of the user in the store.
 *
 * Dev mode, `process.env.NEXT_PUBLIC_ONLY_GEOBLOCK_MAINNET === true` and `process.env.NEXT_PUBLIC_IGNORE_GEOBLOCK === true` will override the geoblock.
 *
 * You may provide a `callback` to be called when the user is confirmed to be geo-blocked.
 */
export const useGeoBlocking = (callback?: () => void) => {
	const setStore = useCommonDriftStore((s) => s.set);
	const isGeoBlocked = useCommonDriftStore((s) => s.isGeoBlocked);
	const { devSwitchIsOn } = useDevSwitchIsOn();
	const isMainnet = useIsMainnet();
	const walletContext = useWalletContext();

	const onlyGeoBlockMainnet =
		process.env.NEXT_PUBLIC_ONLY_GEOBLOCK_MAINNET === 'true';

	const ignoreGeoBlock =
		process.env.NEXT_PUBLIC_IGNORE_GEOBLOCK === 'true' || devSwitchIsOn;

	useEffect(() => {
		if ((onlyGeoBlockMainnet && !isMainnet) || ignoreGeoBlock) {
			setStore((s) => {
				s.isGeoBlocked = false;
			});
			return;
		}

		checkIfCountryIsBlocked().then((countryIsBlocked) => {
			if (countryIsBlocked) {
				setStore((s) => {
					s.isGeoBlocked = countryIsBlocked;
				});
			}
		});
	}, [onlyGeoBlockMainnet, ignoreGeoBlock, isMainnet]);

	useEffect(() => {
		if (isGeoBlocked && walletContext?.connected) {
			callback && callback();

			// timeout is to minimize race condition that wallet is not fully connected yet before we attempt to disconnect
			setTimeout(() => {
				walletContext?.disconnect();
			}, 3000);
		}
	}, [isGeoBlocked, walletContext?.connected]);

	return;
};
