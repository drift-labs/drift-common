import { useEffect } from 'react';
import { useDriftStore } from '../stores';
import useDevSwitchIsOn from './useDevSwitchIsOn';
import useIsMainnet from './useIsMainnet';

const LOCATION_BLACKLIST = [
	{ code: 'AG', name: 'Antigua and Barbuda' },
	{ code: 'DZ', name: 'Algeria' },
	{ code: 'BD', name: 'Bangladesh' },
	{ code: 'BO', name: 'Bolivia' },
	{ code: 'BY', name: 'Belarus' },
	{ code: 'BI', name: 'Burundi' },
	{ code: 'MM', name: 'Burma (Myanmar)' },
	{ code: 'CI', name: "Cote D'Ivoire (Ivory Coast)" },
	{ code: 'CU', name: 'Cuba' },
	{ code: 'CD', name: 'Democratic Republic of Congo' },
	{ code: 'EC', name: 'Ecuador' },
	{ code: 'IR', name: 'Iran' },
	{ code: 'IQ', name: 'Iraq' },
	{ code: 'LR', name: 'Liberia' },
	{ code: 'LY', name: 'Libya' },
	{ code: 'ML', name: 'Mali' },
	{ code: 'MA', name: 'Morocco' },
	{ code: 'NP', name: 'Nepal' },
	{ code: 'KP', name: 'North Korea' },
	{ code: 'SO', name: 'Somalia' },
	{ code: 'SD', name: 'Sudan' },
	{ code: 'SY', name: 'Syria' },
	{ code: 'VE', name: 'Venezuela' },
	{ code: 'YE', name: 'Yemen' },
	{ code: 'ZW', name: 'Zimbabwe' },
	{ code: 'US', name: 'United States' },
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

	const countryIsBlocked =
		LOCATION_BLACKLIST.find((country) => country.code === country_code) && true;

	return countryIsBlocked;
};

/**
 * Checks and sets the geoblock status of the user in the store.
 *
 * Dev mode, `process.env.NEXT_PUBLIC_ONLY_GEOBLOCK_MAINNET === true` and `process.env.NEXT_PUBLIC_IGNORE_GEOBLOCK === true` will override the geoblock.
 */
const useGeolocation = () => {
	const setStore = useDriftStore((s) => s.set);
	const devswitchIsOn = useDevSwitchIsOn();
	const isMainnet = useIsMainnet();

	const onlyGeoBlockMainnet =
		process.env.NEXT_PUBLIC_ONLY_GEOBLOCK_MAINNET === 'true';

	const ignoreGeoBlock =
		process.env.NEXT_PUBLIC_IGNORE_GEOBLOCK === 'true' || devswitchIsOn;

	useEffect(() => {
		if (devswitchIsOn === undefined) return;

		if ((onlyGeoBlockMainnet && !isMainnet) || ignoreGeoBlock) {
			setStore((s) => {
				s.isGeoblocked = false;
			});
			return;
		}

		checkIfCountryIsBlocked().then((countryIsBlocked) => {
			if (countryIsBlocked) {
				setStore((s) => {
					s.isGeoblocked = countryIsBlocked;
				});
			}
		});
	}, [onlyGeoBlockMainnet, ignoreGeoBlock, isMainnet]);

	return;
};

export default useGeolocation;
