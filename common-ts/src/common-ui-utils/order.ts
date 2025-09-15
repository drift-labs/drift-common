import {
	OrderType,
	OrderTriggerCondition,
	PositionDirection,
	BigNum,
	ZERO,
	ContractTier,
	BN,
	PERCENTAGE_PRECISION,
	isOneOfVariant,
} from '@drift-labs/sdk';
import {
	LIMIT_ORDER_TYPE_CONFIG,
	MARKET_ORDER_TYPE_CONFIG,
	ORACLE_LIMIT_ORDER_TYPE_CONFIG,
	ORACLE_MARKET_ORDER_TYPE_CONFIG,
	STOP_LIMIT_ORDER_TYPE_CONFIG,
	STOP_MARKET_ORDER_TYPE_CONFIG,
	TAKE_PROFIT_LIMIT_ORDER_TYPE_CONFIG,
	TAKE_PROFIT_MARKET_ORDER_TYPE_CONFIG,
	UI_ORDER_TYPES,
} from '../constants/orders';
import { UISerializableOrder } from '../serializableTypes';
import { ENUM_UTILS, matchEnum } from '../utils';
import { AuctionParams } from '../types';
import { EMPTY_AUCTION_PARAMS } from '../constants/trade';

const getOrderLabelFromOrderDetails = (
	orderDetails: Pick<
		UISerializableOrder,
		| 'orderType'
		| 'oraclePriceOffset'
		| 'direction'
		| 'triggerCondition'
		| 'existingPositionDirection'
	>
) => {
	if (matchEnum(orderDetails.orderType, OrderType.MARKET))
		return UI_ORDER_TYPES.market.label;

	if (matchEnum(orderDetails.orderType, OrderType.LIMIT))
		return `${
			orderDetails.oraclePriceOffset &&
			!orderDetails.oraclePriceOffset?.eqZero()
				? 'Oracle '
				: ''
		}${UI_ORDER_TYPES.limit.label}`;

	if (matchEnum(orderDetails.orderType, OrderType.ORACLE))
		return UI_ORDER_TYPES.oracle.label;

	if (matchEnum(orderDetails.orderType, OrderType.TRIGGER_MARKET)) {
		const isTriggered =
			matchEnum(
				orderDetails.triggerCondition,
				OrderTriggerCondition.TRIGGERED_ABOVE
			) ||
			matchEnum(
				orderDetails.triggerCondition,
				OrderTriggerCondition.TRIGGERED_BELOW
			);
		if (isTriggered) {
			return 'Market (Triggered)';
		}

		const isTriggerAbove = matchEnum(
			orderDetails.triggerCondition,
			OrderTriggerCondition.ABOVE
		);
		const isExistingPositionShort = matchEnum(
			orderDetails.existingPositionDirection,
			PositionDirection.SHORT
		);
		const isOrderDirectionShort = matchEnum(
			orderDetails.direction,
			PositionDirection.SHORT
		);

		if (isTriggerAbove) {
			return isExistingPositionShort
				? isOrderDirectionShort
					? 'Trigger Market' // trigger above, existing position short, order direction short
					: UI_ORDER_TYPES.stopMarket.label // trigger above, existing position short, order direction long
				: isOrderDirectionShort
				? UI_ORDER_TYPES.takeProfitMarket.label // trigger above, existing position long, order direction short
				: 'Trigger Market'; // trigger above, existing position long, order direction long
		} else {
			return isExistingPositionShort
				? isOrderDirectionShort
					? 'Trigger Market' // trigger below, existing position short, order direction short
					: UI_ORDER_TYPES.takeProfitMarket.label // trigger below, existing position short, order direction long
				: isOrderDirectionShort
				? UI_ORDER_TYPES.stopMarket.label // trigger below, existing position long, order direction short
				: 'Trigger Market'; // trigger below, existing position long, order direction long
		}
	}

	if (matchEnum(orderDetails.orderType, OrderType.TRIGGER_LIMIT)) {
		const isTriggered =
			matchEnum(
				orderDetails.triggerCondition,
				OrderTriggerCondition.TRIGGERED_ABOVE
			) ||
			matchEnum(
				orderDetails.triggerCondition,
				OrderTriggerCondition.TRIGGERED_BELOW
			);

		const isTriggerAbove = matchEnum(
			orderDetails.triggerCondition,
			OrderTriggerCondition.ABOVE
		);
		const isExistingPositionLong = matchEnum(
			orderDetails.existingPositionDirection,
			PositionDirection.LONG
		);
		const isOrderDirectionLong = matchEnum(
			orderDetails.direction,
			PositionDirection.LONG
		);

		if (isTriggered) {
			return 'Limit (Triggered)';
		}

		if (isTriggerAbove) {
			return isExistingPositionLong
				? isOrderDirectionLong
					? 'Trigger Limit' // trigger above, existing position long, order direction long
					: UI_ORDER_TYPES.takeProfitLimit.label // trigger above, existing position long, order direction short
				: isExistingPositionLong
				? UI_ORDER_TYPES.stopLimit.label // trigger above, existing position short, order direction long
				: 'Trigger Limit'; // trigger above, existing position short, order direction short
		} else {
			return isExistingPositionLong
				? isOrderDirectionLong
					? 'Trigger Limit' // trigger below, existing position long, order direction long
					: UI_ORDER_TYPES.stopLimit.label // trigger below, existing position long, order direction short
				: isExistingPositionLong
				? UI_ORDER_TYPES.takeProfitLimit.label // trigger below, existing position short, order direction long
				: 'Trigger Limit'; // trigger below, existing position short, order direction short
		}
	}

	return '-';
};

const getLimitPriceFromOracleOffset = (
	order: UISerializableOrder,
	oraclePrice: BigNum
): BigNum => {
	if (
		(order.price && !order.price.eqZero()) ||
		!order.oraclePriceOffset ||
		order.oraclePriceOffset.eqZero() ||
		!oraclePrice ||
		oraclePrice?.eqZero()
	) {
		return order.price;
	}
	return oraclePrice.add(order.oraclePriceOffset);
};

function isAuctionEmpty(auctionParams: AuctionParams) {
	return (
		auctionParams.auctionStartPrice ===
			EMPTY_AUCTION_PARAMS.auctionStartPrice &&
		auctionParams.auctionEndPrice === EMPTY_AUCTION_PARAMS.auctionEndPrice &&
		auctionParams.auctionDuration === EMPTY_AUCTION_PARAMS.auctionDuration
	);
}

const getUIOrderTypeFromSdkOrderType = (
	orderType: OrderType,
	triggerCondition: OrderTriggerCondition,
	direction: PositionDirection,
	oracleOffset: BigNum | undefined
) => {
	const isLong = ENUM_UTILS.match(direction, PositionDirection.LONG);
	const triggerAbove =
		matchEnum(triggerCondition, OrderTriggerCondition.ABOVE) ||
		matchEnum(triggerCondition, OrderTriggerCondition.TRIGGERED_ABOVE);

	const triggerBelow =
		matchEnum(triggerCondition, OrderTriggerCondition.BELOW) ||
		matchEnum(triggerCondition, OrderTriggerCondition.TRIGGERED_BELOW);

	// Buy side + trigger below: take profit for a short position
	// Buy side + trigger above: stop loss for a short position
	// Sell side + trigger above: take profit for a long position
	// Sell side + trigger below: stop loss for a long position

	if (matchEnum(orderType, OrderType.MARKET)) {
		return MARKET_ORDER_TYPE_CONFIG;
	} else if (matchEnum(orderType, OrderType.LIMIT)) {
		if (oracleOffset && !oracleOffset.eq(ZERO)) {
			return ORACLE_LIMIT_ORDER_TYPE_CONFIG;
		} else {
			return LIMIT_ORDER_TYPE_CONFIG;
		}
	} else if (matchEnum(orderType, OrderType.TRIGGER_MARKET)) {
		if (isLong) {
			if (triggerAbove) {
				return STOP_MARKET_ORDER_TYPE_CONFIG;
			} else if (triggerBelow) {
				return TAKE_PROFIT_MARKET_ORDER_TYPE_CONFIG;
			}
		} else {
			if (triggerAbove) {
				return TAKE_PROFIT_MARKET_ORDER_TYPE_CONFIG;
			} else if (triggerBelow) {
				return STOP_MARKET_ORDER_TYPE_CONFIG;
			}
		}
	} else if (matchEnum(orderType, OrderType.TRIGGER_LIMIT)) {
		if (isLong) {
			if (triggerAbove) {
				return STOP_LIMIT_ORDER_TYPE_CONFIG;
			} else if (triggerBelow) {
				return TAKE_PROFIT_LIMIT_ORDER_TYPE_CONFIG;
			}
		} else {
			if (triggerAbove) {
				return TAKE_PROFIT_LIMIT_ORDER_TYPE_CONFIG;
			} else if (triggerBelow) {
				return STOP_LIMIT_ORDER_TYPE_CONFIG;
			}
		}
	} else if (matchEnum(orderType, OrderType.ORACLE)) {
		return ORACLE_MARKET_ORDER_TYPE_CONFIG;
	}
	throw new Error('Invalid order type');
};

function getPerpAuctionDuration(
	priceDiff: BN,
	price: BN,
	contractTier: ContractTier
): number {
	const percentDiff = priceDiff.mul(PERCENTAGE_PRECISION).div(price);

	const slotsPerBp = isOneOfVariant(contractTier, ['a', 'b'])
		? new BN(100)
		: new BN(60);

	const rawSlots = percentDiff
		.mul(slotsPerBp)
		.div(PERCENTAGE_PRECISION.divn(100));

	const clamped = BN.min(BN.max(rawSlots, new BN(5)), new BN(180));

	return clamped.toNumber();
}

export const ORDER_COMMON_UTILS = {
	getOrderLabelFromOrderDetails,
	getLimitPriceFromOracleOffset,
	isAuctionEmpty,
	getUIOrderTypeFromSdkOrderType,
	getPerpAuctionDuration,
};
