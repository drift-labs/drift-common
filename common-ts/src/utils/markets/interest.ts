import {
	BASE_PRECISION_EXP,
	BigNum,
	calculateBorrowRate,
	calculateDepositRate,
	VelocityClient,
	MarketType,
	PRICE_PRECISION_EXP,
	SPOT_MARKET_RATE_PRECISION_EXP,
} from '@velocity-exchange/sdk';
import { ENUM_UTILS } from '../enum';

/**
 * Returns the quote amount of the current open interest for a market, using the current oracle price
 * @param marketIndex
 * @param marketType
 * @param velocityClient
 * @returns
 */
export const getCurrentOpenInterestForMarket = (
	marketIndex: number,
	marketType: MarketType,
	velocityClient: VelocityClient
) => {
	if (ENUM_UTILS.match(marketType, MarketType.PERP)) {
		const market = velocityClient.getPerpMarketAccount(marketIndex);
		const OI = BigNum.from(
			market.baseAssetAmountLong.add(market.baseAssetAmountShort.abs()),
			BASE_PRECISION_EXP
		);

		const priceData = velocityClient.getOraclePriceDataAndSlot(
			market.oracle,
			market.oracleSource
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
 * @param velocityClient
 * @returns
 */
export const getDepositAprForMarket = (
	marketIndex: number,
	marketType: MarketType,
	velocityClient: VelocityClient
) => {
	if (ENUM_UTILS.match(marketType, MarketType.SPOT)) {
		const marketAccount = velocityClient.getSpotMarketAccount(marketIndex);

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
 * @param velocityClient
 * @returns
 */
export const getBorrowAprForMarket = (
	marketIndex: number,
	marketType: MarketType,
	velocityClient: VelocityClient
) => {
	if (ENUM_UTILS.match(marketType, MarketType.SPOT)) {
		const marketAccount = velocityClient.getSpotMarketAccount(marketIndex);

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
