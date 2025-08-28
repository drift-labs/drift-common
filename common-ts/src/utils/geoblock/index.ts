import { GEOBLOCK_LIST } from '../../constants';

/**
 * Returns true if the user is geo-blocked.
 */
export const checkGeoBlock = async () => {
	const result = await fetch(`https://geolocation.drift-labs.workers.dev/`, {
		cache: 'no-cache',
	});

	if (!result.ok) {
		return;
	}

	const country_code = await result.text();

	const countryIsBlocked = !!GEOBLOCK_LIST.find(
		(country) => country.code === country_code
	);

	return countryIsBlocked;
};
