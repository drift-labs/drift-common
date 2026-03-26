import {
	AMM_RESERVE_PRECISION,
	BN,
	BigNum,
	DriftClient,
	MAX_LEVERAGE_ORDER_SIZE,
	ONE,
	PRICE_PRECISION,
	PerpMarketAccount,
	SpotMarketAccount,
	ZERO,
} from '@drift-labs/sdk';
import { MarketId } from '../../types';

const getMarketTickSize = (
	driftClient: DriftClient,
	marketId: MarketId
): BN => {
	const marketAccount = marketId.isPerp
		? driftClient.getPerpMarketAccount(marketId.marketIndex)
		: driftClient.getSpotMarketAccount(marketId.marketIndex);
	if (!marketAccount) return ZERO;

	if (marketId.isPerp) {
		return (marketAccount as PerpMarketAccount).amm.orderTickSize;
	} else {
		return (marketAccount as SpotMarketAccount).orderTickSize;
	}
};

const getMarketTickSizeDecimals = (
	driftClient: DriftClient,
	marketId: MarketId
) => {
	const tickSize = getMarketTickSize(driftClient, marketId);

	const decimalPlaces = Math.max(
		0,
		Math.floor(
			Math.log10(
				PRICE_PRECISION.div(tickSize.eq(ZERO) ? ONE : tickSize).toNumber()
			)
		)
	);

	return decimalPlaces;
};

const getMarketStepSize = (driftClient: DriftClient, marketId: MarketId) => {
	const marketAccount = marketId.isPerp
		? driftClient.getPerpMarketAccount(marketId.marketIndex)
		: driftClient.getSpotMarketAccount(marketId.marketIndex);
	if (!marketAccount) return ZERO;

	if (marketId.isPerp) {
		return (marketAccount as PerpMarketAccount).amm.orderStepSize;
	} else {
		return (marketAccount as SpotMarketAccount).orderStepSize;
	}
};

const getMarketStepSizeDecimals = (
	driftClient: DriftClient,
	marketId: MarketId
) => {
	const stepSize = getMarketStepSize(driftClient, marketId);

	const decimalPlaces = Math.max(
		0,
		Math.floor(
			Math.log10(
				AMM_RESERVE_PRECISION.div(stepSize.eq(ZERO) ? ONE : stepSize).toNumber()
			)
		)
	);

	return decimalPlaces;
};

/**
 * Checks if a given order amount represents an entire position order
 * by comparing it with MAX_LEVERAGE_ORDER_SIZE
 * @param orderAmount - The BigNum order amount to check
 * @returns true if the order is for the entire position, false otherwise
 */
export const isEntirePositionOrder = (orderAmount: BigNum): boolean => {
	const maxLeverageSize = new BigNum(
		MAX_LEVERAGE_ORDER_SIZE,
		orderAmount.precision
	);

	const isMaxLeverage = Math.abs(maxLeverageSize.sub(orderAmount).toNum()) < 1;

	// Some order paths produce a truncated u64::MAX instead of MAX_LEVERAGE_ORDER_SIZE
	const ALTERNATIVE_MAX_ORDER_SIZE = '18446744072000000000';
	const alternativeMaxSize = new BigNum(
		ALTERNATIVE_MAX_ORDER_SIZE,
		orderAmount.precision
	);
	const isAlternativeMax =
		Math.abs(alternativeMaxSize.sub(orderAmount).toNum()) < 1;

	return isMaxLeverage || isAlternativeMax;
};

/**
 * Gets the MAX_LEVERAGE_ORDER_SIZE as a BigNum with the same precision as the given amount
 * @param orderAmount - The BigNum order amount to match precision with
 * @returns BigNum representation of MAX_LEVERAGE_ORDER_SIZE
 */
export const getMaxLeverageOrderSize = (orderAmount: BigNum): BigNum => {
	return new BigNum(MAX_LEVERAGE_ORDER_SIZE, orderAmount.precision);
};

/**
 * Formats an order size for display, showing "Entire Position" if it's a max leverage order
 * @param orderAmount - The BigNum order amount to format
 * @param formatFn - Optional custom format function, defaults to prettyPrint()
 * @returns Formatted string showing either "Entire Position" or the formatted amount
 */
export const formatOrderSize = (
	orderAmount: BigNum,
	formatFn?: (amount: BigNum) => string
): string => {
	if (isEntirePositionOrder(orderAmount)) {
		return 'Entire Position';
	}
	return formatFn ? formatFn(orderAmount) : orderAmount.prettyPrint();
};

export {
	getMarketTickSize,
	getMarketTickSizeDecimals,
	getMarketStepSize,
	getMarketStepSizeDecimals,
};
