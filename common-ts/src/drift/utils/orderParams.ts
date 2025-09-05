import {
	BN,
	MarketType,
	PositionDirection,
	PostOnlyParams,
	OptionalOrderParams,
	getLimitOrderParams,
	getTriggerMarketOrderParams,
	getTriggerLimitOrderParams,
	OrderTriggerCondition,
	ZERO,
} from '@drift-labs/sdk';
import { ENUM_UTILS } from '../../utils';
import { OptionalTriggerOrderParams } from '../base/actions/trade/openPerpOrder/openSwiftOrder';

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

export type NonMarketOrderType =
	| 'limit'
	| 'takeProfit'
	| 'stopLoss'
	| 'oracleLimit';

export interface NonMarketOrderParamsConfig {
	marketIndex: number;
	marketType: MarketType;
	direction: PositionDirection;
	baseAssetAmount: BN;
	reduceOnly?: boolean;
	postOnly?: PostOnlyParams;
	orderConfig:
		| {
				orderType: Extract<NonMarketOrderType, 'limit'>;
				limitPrice: BN;
				disableSwift?: boolean;
				bracketOrders?: {
					takeProfit?: OptionalTriggerOrderParams;
					stopLoss?: OptionalTriggerOrderParams;
				};
		  }
		| {
				orderType: Extract<NonMarketOrderType, 'takeProfit' | 'stopLoss'>;
				triggerPrice: BN;
				limitPrice?: BN;
		  }
		| {
				orderType: Extract<NonMarketOrderType, 'oracleLimit'>;
				oraclePriceOffset: BN;
		  };
}

/**
 * Determine trigger condition based on direction
 * For stop orders: ABOVE when long, BELOW when short
 * For take profit orders: BELOW when long, ABOVE when short
 */
const getTriggerCondition = (
	direction: PositionDirection,
	tpOrSl: 'takeProfit' | 'stopLoss'
) => {
	const isTakeProfit = tpOrSl === 'takeProfit';
	const isLong = ENUM_UTILS.match(direction, PositionDirection.LONG);

	if (isTakeProfit) {
		if (isLong) {
			return OrderTriggerCondition.BELOW;
		} else {
			return OrderTriggerCondition.ABOVE;
		}
	} else {
		// Stop loss
		if (isLong) {
			return OrderTriggerCondition.ABOVE;
		} else {
			return OrderTriggerCondition.BELOW;
		}
	}
};

/**
 * Builds proper order parameters for non-market orders using the same logic as the UI
 */
export function buildNonMarketOrderParams({
	marketIndex,
	marketType,
	direction,
	baseAssetAmount,
	orderConfig,
	reduceOnly = false,
	postOnly = PostOnlyParams.NONE,
}: NonMarketOrderParamsConfig): OptionalOrderParams {
	const orderType = orderConfig.orderType;

	// Build order params based on order type using SDK functions
	if (orderType === 'limit') {
		if (!orderConfig.limitPrice) {
			throw new Error('LIMIT orders require limitPrice');
		}

		return getLimitOrderParams({
			marketIndex,
			marketType,
			direction,
			baseAssetAmount,
			price: orderConfig.limitPrice,
			reduceOnly,
			postOnly,
		});
	}

	if (orderType === 'takeProfit' || orderType === 'stopLoss') {
		if (!orderConfig.triggerPrice) {
			throw new Error('TRIGGER_MARKET orders require triggerPrice');
		}

		const triggerCondition = getTriggerCondition(direction, orderType);
		const hasLimitPrice = !!orderConfig.limitPrice;

		if (hasLimitPrice) {
			return getTriggerLimitOrderParams({
				marketIndex,
				marketType,
				direction,
				baseAssetAmount,
				triggerPrice: orderConfig.triggerPrice,
				price: orderConfig.limitPrice,
				triggerCondition,
				reduceOnly,
			});
		} else {
			return getTriggerMarketOrderParams({
				marketIndex,
				marketType,
				direction,
				baseAssetAmount,
				triggerPrice: orderConfig.triggerPrice,
				price: orderConfig.limitPrice,
				triggerCondition,
				reduceOnly,
			});
		}
	}

	if (orderType === 'oracleLimit') {
		if (!orderConfig.oraclePriceOffset) {
			throw new Error('ORACLE orders require oraclePriceOffset');
		}

		return getLimitOrderParams({
			marketIndex,
			marketType,
			direction,
			baseAssetAmount,
			price: ZERO,
			oraclePriceOffset: orderConfig.oraclePriceOffset.toNumber(),
		});
	}

	throw new Error(`Unsupported order type: ${orderType}`);
}
