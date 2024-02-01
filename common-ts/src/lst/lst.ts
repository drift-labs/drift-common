import {
	fetchAndParsePricesCsv,
	getPriceRangeFromPeriod,
	calcYield,
	DATA_SOURCE,
	PERIOD,
} from '@glitchful-dev/sol-apy-sdk';

/**
 * Fetches the yield for a given LST and period. Fetches results from a CSV stored in github in the @glitchful-dev/sol-apy-sdk repo.
 *
 * See:
 * https://github.com/glitchful-dev/sol-stake-pool-apy/blob/master/packages/sol-apy-sdk/index.ts
 *
 * @param lst
 * @param periodDays
 * @returns
 */
export const getLstYield = async (
	lst: 'jitosol' | 'bsol' | 'msol',
	periodDays: 7 | 14 | 30 | 90 | 365
) => {
	let dataSource: string;

	switch (lst) {
		case 'bsol':
			dataSource = DATA_SOURCE.SOLBLAZE_CSV;
			break;
		case 'jitosol':
			dataSource = DATA_SOURCE.JITO_CSV;
			break;
		case 'msol':
			dataSource = DATA_SOURCE.MARINADE_CSV;
			break;
		default: {
			const exhaustiveCheck: never = lst;
			throw new Error(exhaustiveCheck);
		}
	}

	let period: PERIOD;

	switch (periodDays) {
		case 7:
			period = PERIOD.DAYS_7;
			break;
		case 14:
			period = PERIOD.DAYS_14;
			break;
		case 30:
			period = PERIOD.DAYS_30;
			break;
		case 90:
			period = PERIOD.DAYS_90;
			break;
		case 365:
			period = PERIOD.DAYS_365;
			break;
		default: {
			const exhaustiveCheck: never = periodDays;
			throw new Error(exhaustiveCheck);
		}
	}

	const prices = await fetchAndParsePricesCsv(dataSource);
	const priceRange = getPriceRangeFromPeriod(prices, period);

	const result = calcYield(priceRange);

	return {
		apr: result?.apr,
		apy: result?.apy,
	};
};
