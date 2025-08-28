import {
	BN,
	calculateLongShortFundingRateAndLiveTwaps,
	DriftClient,
} from '@drift-labs/sdk';
import { MarkPriceCache } from '../../../Drift';
import { MarketId } from '../../../../types';
import { getFundingRate } from '../../../utils/funding';
import { API_URLS, API_ENDPOINTS } from '../../../constants/apiUrls';

export const getMarketPredictedFunding = (
	driftClient: DriftClient,
	marketIndex: number
): {
	longFundingRate: number;
	shortFundingRate: number;
} => {
	const perpMarketAccount = driftClient.getPerpMarketAccount(marketIndex);
	const rawMmOraclePriceData =
		driftClient.getMMOracleDataForPerpMarket(marketIndex);
	const rawOraclePriceData =
		driftClient.getOracleDataForPerpMarket(marketIndex);

	const markPriceCache = new MarkPriceCache();
	const marketId = MarketId.createPerpMarket(marketIndex);

	const markPrice = markPriceCache.getMarkPrice(marketId.key);
	const nowBN = new BN(Date.now());

	const [_markTwapLive, oracleTwapLive, longFundingRate, shortFundingRate] =
		calculateLongShortFundingRateAndLiveTwaps(
			perpMarketAccount,
			rawMmOraclePriceData,
			rawOraclePriceData,
			markPrice,
			nowBN
		);

	return {
		longFundingRate: getFundingRate(longFundingRate, oracleTwapLive),
		shortFundingRate: getFundingRate(shortFundingRate, oracleTwapLive),
	};
};

interface FundingRateApiResponse {
	slot: number;
	fundingRate: string;
	oraclePriceTwap: string;
}

export const getMarketHistoricalFunding = async (
	marketSymbol: string = 'SOL-PERP'
): Promise<Array<{ slot: number; fundingRatePct: number }>> => {
	// TODO: if we're hitting the data api a lot we should set up a client file for it.. not sure if necessary
	const url = `${API_URLS.DATA_API}${API_ENDPOINTS.FUNDING_RATES}?marketName=${marketSymbol}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		const rates: FundingRateApiResponse[] = data.fundingRates || [];

		return rates.map((rate) => {
			const fundingRateBN = new BN(rate.fundingRate);
			const oracleTwapBN = new BN(rate.oraclePriceTwap);
			const fundingRatePct = getFundingRate(fundingRateBN, oracleTwapBN);

			return {
				slot: rate.slot,
				fundingRatePct,
			};
		});
	} catch (error) {
		console.error('Error fetching funding rates:', error);
		return [];
	}
};
