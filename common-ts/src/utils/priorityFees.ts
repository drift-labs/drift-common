import { MarketId } from 'src/types';

const FEE_ENDPOINT = 'https://dlob.drift.trade/batchPriorityFees';

/**
 * Helius fee buckets are as follows:
 *
 * none: 0th percentile
 * low: 25th percentile
 * medium: 50th percentile
 * high: 75th percentile
 * veryHigh: 95th percentile
 * unsafeMax: 100th percentile
 * default: 50th percentile
 */
export const getHeliusPriorityFeeEstimate = async (
	marketIds: MarketId[],
	priorityFeeLevel:
		| 'min'
		| 'low'
		| 'medium'
		| 'high'
		| 'veryHigh'
		| 'unsafeMax' = 'high'
): Promise<number[]> => {
	try {
		if (!marketIds?.length) {
			return [];
		}

		const queryParamsMap = {
			marketType: marketIds.map((market) => market.marketTypeStr).join(','),
			marketIndex: marketIds.map((market) => market.marketIndex).join(','),
		};
		const queryParams = Object.entries(queryParamsMap)
			.filter(([_key, param]) => param !== undefined)
			.map(([key, param]) => {
				return `${key}=${param}`;
			});
		const queryParamsString = `${queryParams.join('&')}`;

		const response = await fetch(`${FEE_ENDPOINT}?${queryParamsString}`, {
			headers: { 'Content-Type': 'application/json' },
		});

		const result = (await response.json()) as {
			min: number;
			low: number;
			medium: number;
			high: number;
			veryHigh: number;
			unsafeMax: number;
		}[];

		if (!response.ok) {
			return undefined;
		}

		const feeLevelValues = result.map((result) => result?.[priorityFeeLevel]);

		return feeLevelValues;
	} catch (e) {
		return undefined;
	}
};
