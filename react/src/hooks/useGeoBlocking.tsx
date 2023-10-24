import { useEffect } from 'react';
import { useCommonDriftStore } from '../stores';
import { useDevSwitchIsOn } from './useDevSwitchIsOn';
import useIsMainnet from './useIsMainnet';
import { useWalletContext } from './useWalletContext';

const LOCATION_BLACKLIST = [
	// < Not able to do these at the moment >
	// {name: "Crimea" ,code: "#NA"},
	// {name: "Donetsk" ,code: "#NA"},
	// {name: "Luhansk" ,code: "#NA"},
	{ name: 'Afghanistan', code: 'AF' },
	{ name: 'Albania', code: 'AL' },
	{ name: 'Barbados', code: 'BB' },
	{ name: 'Belarus', code: 'BY' },
	{ name: 'Bosnia and Herzegovina', code: 'BA' },
	{ name: 'Burkina Faso', code: 'BF' },
	{ name: 'Burma', code: 'BU' },
	{ name: 'Cambodia', code: 'KH' },
	{ name: 'Canada', code: 'CA' },
	{ name: 'Cayman Islands', code: 'KY' },
	{ name: 'Central African Republic', code: 'CF' },
	{ name: 'Congo', code: 'CG' },
	{ name: 'Cuba', code: 'CU' },
	{ name: 'Gibraltar', code: 'GI' },
	{ name: 'Haiti', code: 'HT' },
	{ name: 'Iran', code: 'IR' },
	{ name: 'Iraq', code: 'IQ' },
	{ name: 'Jamaica', code: 'JM' },
	{ name: 'Jordan', code: 'JO' },
	{ name: 'Lebanon', code: 'LB' },
	{ name: 'Libya', code: 'KY' },
	{ name: 'Mali', code: 'ML' },
	{ name: 'Malta', code: 'MT' },
	{ name: 'Montenegro', code: 'ME' },
	{ name: 'Morocco', code: 'MA' },
	{ name: 'Mozambique', code: 'MZ' },
	{ name: 'Myanmar', code: 'MM' },
	{ name: 'Nicaragua', code: 'NI' },
	{ name: 'North Korea', code: 'KP' },
	{ name: 'Pakistan', code: 'PK' },
	{ name: 'Panama', code: 'PA' },
	{ name: 'Philippines', code: 'PH' },
	{ name: 'Russia', code: 'RU' },
	{ name: 'Serbia', code: 'RS' },
	{ name: 'Senegal', code: 'SN' },
	{ name: 'South Sudan', code: 'SS' },
	{ name: 'Somalia', code: 'SO' },
	{ name: 'Syria', code: 'SY' },
	{ name: 'Türkiye', code: 'TR' },
	{ name: 'United States', code: 'US' },
	{ name: 'United Kingdom', code: 'GB' },
	{ name: 'Venezuela', code: 'VE' },
	{ name: 'Uganda', code: 'UG' },
	{ name: 'Ukrainian', code: 'UA' },
	{ name: 'United Arab Emirates', code: 'AE' },
	{ name: 'Yemen', code: 'YE' },
	{ name: 'Zimbabwe', code: 'ZW' },
];

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

	const countryIsBlocked = !!LOCATION_BLACKLIST.find(
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
			walletContext?.disconnect();
		}
	}, [isGeoBlocked, walletContext?.connected]);

	return;
};
