import {
	BN,
	MarketType,
	PositionDirection,
	OrderType,
	PostOnlyParams,
	OptionalOrderParams,
	getLimitOrderParams,
	getTriggerMarketOrderParams,
	getTriggerLimitOrderParams,
	OrderTriggerCondition,
} from '@drift-labs/sdk';
import { ENUM_UTILS } from '../../utils';

/**
 * Converts amount and assetType to base asset amount
 * @param amount - The amount to convert
 * @param assetType - 'base' or 'quote'
 * @param limitPrice - Required when assetType is 'quote' for conversion
 * @returns Base asset amount
 */
export function convertToBaseAssetAmount(
	amount: BN,
	assetType: 'base' | 'quote',
	limitPrice?: BN
): BN {
	if (assetType === 'quote') {
		if (!limitPrice || limitPrice.isZero()) {
			throw new Error(
				'When using quote asset type, limitPrice is required for conversion to base amount'
			);
		}
		// Convert quote amount to base amount: quoteAmount / price = baseAmount
		// Using PRICE_PRECISION as the limit price is in price precision
		const PRICE_PRECISION = new BN(10).pow(new BN(6));
		return amount.mul(PRICE_PRECISION).div(limitPrice);
	} else {
		// Base amount, use directly
		return amount;
	}
}

/**
 * Resolves amount parameters from either new (amount + assetType) or legacy (baseAssetAmount) approach
 */
export function resolveBaseAssetAmount(params: {
	amount?: BN;
	assetType?: 'base' | 'quote';
	baseAssetAmount?: BN;
	limitPrice?: BN;
}): BN {
	const { amount, assetType, baseAssetAmount, limitPrice } = params;

	if (amount && assetType) {
		// New approach: convert if needed
		return convertToBaseAssetAmount(amount, assetType, limitPrice);
	} else if (baseAssetAmount) {
		// Legacy approach
		return baseAssetAmount;
	} else {
		throw new Error(
			'Either (amount + assetType) or baseAssetAmount must be provided'
		);
	}
}

export interface NonMarketOrderParamsConfig {
	marketIndex: number;
	marketType: MarketType;
	direction: PositionDirection;
	baseAssetAmount: BN;
	orderType: OrderType;
	limitPrice?: BN;
	triggerPrice?: BN;
	reduceOnly?: boolean;
	postOnly?: PostOnlyParams;
	userOrderId?: number;
}

/**
 * Builds proper order parameters for non-market orders using the same logic as the UI
 */
export function buildNonMarketOrderParams({
	marketIndex,
	marketType,
	direction,
	baseAssetAmount,
	orderType,
	limitPrice,
	triggerPrice,
	reduceOnly = false,
	postOnly = PostOnlyParams.NONE,
	userOrderId,
}: NonMarketOrderParamsConfig): OptionalOrderParams {
	const isLong = ENUM_UTILS.match(direction, PositionDirection.LONG);

	// Build order params based on order type using SDK functions
	if (ENUM_UTILS.match(orderType, OrderType.LIMIT)) {
		if (!limitPrice) {
			throw new Error('LIMIT orders require limitPrice');
		}

		return getLimitOrderParams({
			marketIndex,
			marketType,
			direction,
			baseAssetAmount,
			price: limitPrice,
			reduceOnly,
			postOnly,
			userOrderId,
		});
	}

	if (ENUM_UTILS.match(orderType, OrderType.TRIGGER_MARKET)) {
		if (!triggerPrice) {
			throw new Error('TRIGGER_MARKET orders require triggerPrice');
		}

		// Determine trigger condition based on direction
		// For stop orders: ABOVE when long, BELOW when short
		// For take profit orders: BELOW when long, ABOVE when short
		// Note: We don't distinguish between stop and take profit at the OrderType level
		// This assumes TRIGGER_MARKET is used for stop orders
		const triggerCondition = isLong
			? OrderTriggerCondition.ABOVE
			: OrderTriggerCondition.BELOW;

		return getTriggerMarketOrderParams({
			marketIndex,
			marketType,
			direction,
			baseAssetAmount,
			triggerPrice,
			triggerCondition,
			reduceOnly,
			userOrderId,
		});
	}

	if (ENUM_UTILS.match(orderType, OrderType.TRIGGER_LIMIT)) {
		if (!limitPrice || !triggerPrice) {
			throw new Error(
				'TRIGGER_LIMIT orders require both limitPrice and triggerPrice'
			);
		}

		// Same trigger condition logic as TRIGGER_MARKET
		const triggerCondition = isLong
			? OrderTriggerCondition.ABOVE
			: OrderTriggerCondition.BELOW;

		return getTriggerLimitOrderParams({
			marketIndex,
			marketType,
			direction,
			baseAssetAmount,
			triggerPrice,
			price: limitPrice,
			triggerCondition,
			reduceOnly,
			userOrderId,
		});
	}

	if (ENUM_UTILS.match(orderType, OrderType.ORACLE)) {
		// TODO
		throw new Error('Oracle orders are not supported in this context');
	}

	throw new Error(`Unsupported order type: ${orderType}`);
}

/**
 * Helper to build limit order parameters specifically
 */
export function buildLimitOrderParams({
	marketIndex,
	marketType,
	direction,
	baseAssetAmount,
	limitPrice,
	reduceOnly = false,
	postOnly = PostOnlyParams.NONE,
	userOrderId,
}: {
	marketIndex: number;
	marketType: MarketType;
	direction: PositionDirection;
	baseAssetAmount: BN;
	limitPrice: BN;
	reduceOnly?: boolean;
	postOnly?: PostOnlyParams;
	userOrderId?: number;
}): OptionalOrderParams {
	return getLimitOrderParams({
		marketIndex,
		marketType,
		direction,
		baseAssetAmount,
		price: limitPrice,
		reduceOnly,
		postOnly,
		userOrderId,
	});
}
