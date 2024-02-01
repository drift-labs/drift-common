import { BN, DepositRecord, LAMPORTS_PRECISION, User, ZERO, isVariant } from '@drift-labs/sdk';
import {
	fetchAndParsePricesCsv,
	getPriceRangeFromPeriod,
	calcYield,
	DATA_SOURCE,
	PERIOD,
	PriceRecord,
} from '@glitchful-dev/sol-apy-sdk';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const parsedPricesResultCache = new Map<string, PriceRecord[]>();

/**
 * Utility method to fetch cached prices if previously fetched
 * @param dataSource 
 * @returns 
 */
const getPrices = async (dataSource: string) => {
	if (parsedPricesResultCache.has(dataSource)) {
		return parsedPricesResultCache.get(dataSource);
	} else {
		const prices = await fetchAndParsePricesCsv(dataSource);
		parsedPricesResultCache.set(dataSource, prices);

		return prices;
	}
};

type LST = 'jitosol' | 'bsol' | 'msol';

const getDatasourceForLst = (lst: LST) => {
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

	return dataSource;
};

/**
 * Maps timestamps to milliseconds
 * @param timestamp 
 */
const toMsecs = (timestamp: number) => {
	if (timestamp.toString().length === 13) {
		return timestamp;
	}
	// Make the number 13 digits long by adding zeros if necessary
	const timestampStr = timestamp.toString();
	const timestampStrPadded = timestampStr.padEnd(13, '0');
	return parseInt(timestampStrPadded);
};

/**
 * Maps timestamps to seconds
 * @param timestamp 
 */
const _toSecs = (timestamp: number) => {
	if (timestamp.toString().length === 10) {
		return timestamp;
	}
	// Make the number 10 digits long by removing zeros if necessary
	const timestampStr = timestamp.toString();
	const timestampStrTrimmed = timestampStr.slice(0, 10);
	return parseInt(timestampStrTrimmed);
};

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
	lst: LST,
	periodDays: 7 | 14 | 30 | 90 | 365
) => {
	const dataSource = getDatasourceForLst(lst);

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

	const prices = await getPrices(dataSource);
	const priceRange = getPriceRangeFromPeriod(prices, period);

	const result = calcYield(priceRange);

	return {
		apr: result?.apr * 100,
		apy: result?.apy * 100,
	};
};

/**
 * Fetches the current (latest) price for a given LST, measured in SOL.
 * @param lst 
 * @returns 
 */
export const getLstSolPrice = async (lst: LST) => {
	const dataSource = getDatasourceForLst(lst);

	return (await getPrices(dataSource))?.[0]?.price;
};

/**
 * Creates a "price map" for the lst based on target timestamps. Where there is no exact timestamp match for the target timestamps and the recorded prices, it uses the most recent price measurement for the target timestamp.
 * @param lst 
 * @param timestamps 
 * @returns 
 */
export const getLstPriceMap = async (lst: LST, timestamps: number[]) => {
	
	const targetTimestampSet = new Set<number>(timestamps);
	const descSortedPrices = (await getPrices(getDatasourceForLst(lst))).sort((a, b) => b.timestamp - a.timestamp);
	const priceMap = new Map<number, number>();

	// Need to match and add prices to the price map
	targetTimestampSet.forEach((targetTimestamp) => {
		// The matching price is the first price that is less than or equal to the target timestamp when going through the price entries in descending order .. aka the most recent price measurement for the target timestamp
		const match = descSortedPrices.find((price) => price.timestamp <= targetTimestamp);
		if (match) {
			priceMap.set(targetTimestamp, match.price);
		}
	});	

	return priceMap;
};

/**
 * Returns a timestamp in seconds, for the start of the day in UTC format .. strips the hours, minutes and seconds
 * @param timestamp 
 */
const getNormalisedTimestamp = (timestamp: number) => {
	const date = new Date(Math.round(toMsecs(timestamp)));
	date.setUTCHours(0, 0, 0, 0);
	return date.getTime() / 1000;
};

export async function calculateSolEarned({
	marketIndex,
	user,
	depositRecords,
}: {
	marketIndex: number;
	user: User;
	depositRecords: DepositRecord[];
}): Promise<BN> {
	const normalisedTimestamps: number[] = [
		Date.now(),
		...depositRecords
			.filter((r) => r.marketIndex === marketIndex)
			.map((r) => ((r.ts.toNumber()))),
	].map(getNormalisedTimestamp);

	const lst : LST = marketIndex === 2 ? 'msol' : marketIndex === 6 ? 'jitosol' : 'bsol';

	const lstRatios = await getLstPriceMap(lst, normalisedTimestamps);

	let solEarned = ZERO;
	for (const record of depositRecords) {
		if (record.marketIndex === 1) {
			if (isVariant(record.direction, 'deposit')) {
				solEarned = solEarned.sub(record.amount);
			} else {
				solEarned = solEarned.add(record.amount);
			}
		} else if (
			record.marketIndex === 2 ||
			record.marketIndex === 6 ||
			record.marketIndex === 8
		) {
			const normalisedTimestamp = getNormalisedTimestamp(record.ts.toNumber());
			const lstRatio = lstRatios.get(normalisedTimestamp);
			const lstRatioBN = new BN(lstRatio * LAMPORTS_PER_SOL);

			const solAmount = record.amount.mul(lstRatioBN).div(LAMPORTS_PRECISION);
			if (isVariant(record.direction, 'deposit')) {
				solEarned = solEarned.sub(solAmount);
			} else {
				solEarned = solEarned.add(solAmount);
			}
		}
	}

	const currentLstTokenAmount = await user.getTokenAmount(marketIndex);
	const currentLstRatio = await getLstSolPrice(lst);
	const currentLstRatioBN = new BN(currentLstRatio * LAMPORTS_PER_SOL);

	solEarned = solEarned.add(
		currentLstTokenAmount.mul(currentLstRatioBN).div(LAMPORTS_PRECISION)
	);

	const currentSOLTokenAmount = await user.getTokenAmount(1);
	solEarned = solEarned.add(currentSOLTokenAmount);

	return solEarned;
}