import {
	BASE_PRECISION_EXP,
	BigNum,
	calculateBorrowRate,
	calculateDepositRate,
	DriftClient,
	MarketType,
	PRICE_PRECISION_EXP,
	SPOT_MARKET_RATE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { ENUM_UTILS } from '../enum';

/**
 * Returns the quote amount of the current open interest for a market, using the current oracle price
 * @param marketIndex
 * @param marketType
 * @param driftClient
 * @returns
 */
export const getCurrentOpenInterestForMarket = (
	marketIndex: number,
	marketType: MarketType,
	driftClient: DriftClient
) => {
	if (ENUM_UTILS.match(marketType, MarketType.PERP)) {
		const market = driftClient.getPerpMarketAccount(marketIndex);
		const OI = BigNum.from(
			market.amm.baseAssetAmountLong.add(market.amm.baseAssetAmountShort.abs()),
			BASE_PRECISION_EXP
		);

		const priceData = driftClient.getOraclePriceDataAndSlot(
			market.amm.oracle,
			market.amm.oracleSource
		);

		const price = BigNum.from(priceData.data.price, PRICE_PRECISION_EXP);

		const quoteOIforMarket = price.toNum() * OI.toNum();

		return quoteOIforMarket;
	} else {
		throw new Error('Invalid market type for Open Interest calculation');
	}
};

/**
 * Gets the deposit APR for a spot market, in percent
 * @param marketIndex
 * @param marketType
 * @param driftClient
 * @returns
 */
export const getDepositAprForMarket = (
	marketIndex: number,
	marketType: MarketType,
	driftClient: DriftClient
) => {
	if (ENUM_UTILS.match(marketType, MarketType.SPOT)) {
		const marketAccount = driftClient.getSpotMarketAccount(marketIndex);

		const depositApr = BigNum.from(
			calculateDepositRate(marketAccount),
			SPOT_MARKET_RATE_PRECISION_EXP
		);

		const depositAprPct = depositApr.toNum() * 100;

		return depositAprPct;
	} else {
		throw new Error('Invalid market type for Deposit APR calculation');
	}
};

/**
 * Get's the borrow APR for a spot market, in percent
 * @param marketIndex
 * @param marketType
 * @param driftClient
 * @returns
 */
export const getBorrowAprForMarket = (
	marketIndex: number,
	marketType: MarketType,
	driftClient: DriftClient
) => {
	if (ENUM_UTILS.match(marketType, MarketType.SPOT)) {
		const marketAccount = driftClient.getSpotMarketAccount(marketIndex);

		const depositApr = BigNum.from(
			calculateBorrowRate(marketAccount),
			SPOT_MARKET_RATE_PRECISION_EXP
		);

		const depositAprPct = depositApr.toNum() * 100;

		return depositAprPct;
	} else {
		throw new Error('Invalid market type for Borrow APR calculation');
	}
};
