import {
	OrderType,
	OrderTriggerCondition,
	PositionDirection,
	BigNum,
	ZERO,
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
} from '../../constants/orders';
import { UISerializableOrder } from '../../serializableTypes';
import { ENUM_UTILS, matchEnum } from '../enum';

export const getOrderLabelFromOrderDetails = (
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
		const isOrderDirectionShort = matchEnum(
			orderDetails.direction,
			PositionDirection.SHORT
		);

		if (isTriggerAbove) {
			return isOrderDirectionShort
				? UI_ORDER_TYPES.takeProfitMarket.label
				: UI_ORDER_TYPES.stopMarket.label;
		} else {
			return isOrderDirectionShort
				? UI_ORDER_TYPES.stopMarket.label
				: UI_ORDER_TYPES.takeProfitMarket.label;
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
		const isOrderDirectionShort = matchEnum(
			orderDetails.direction,
			PositionDirection.SHORT
		);

		if (isTriggered) {
			return 'Limit (Triggered)';
		}

		if (isTriggerAbove) {
			return isOrderDirectionShort
				? UI_ORDER_TYPES.takeProfitLimit.label
				: UI_ORDER_TYPES.stopLimit.label;
		} else {
			return isOrderDirectionShort
				? UI_ORDER_TYPES.stopLimit.label
				: UI_ORDER_TYPES.takeProfitLimit.label;
		}
	}

	return '-';
};

export const getUIOrderTypeFromSdkOrderType = (
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
