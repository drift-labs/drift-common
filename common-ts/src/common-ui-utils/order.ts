import {
	OrderType,
	OrderTriggerCondition,
	PositionDirection,
	BigNum,
} from '@drift-labs/sdk';
import { UI_ORDER_TYPES } from '../constants/orders';
import { UISerializableOrder } from '../serializableTypes';
import { matchEnum } from '../utils';
import { AuctionParams } from '../types';
import { EMPTY_AUCTION_PARAMS } from '..';

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
		if (
			matchEnum(
				orderDetails.triggerCondition,
				OrderTriggerCondition.TRIGGERED_ABOVE
			) ||
			matchEnum(
				orderDetails.triggerCondition,
				OrderTriggerCondition.TRIGGERED_BELOW
			)
		) {
			return 'Market (Triggered)';
		}

		if (matchEnum(orderDetails.triggerCondition, OrderTriggerCondition.ABOVE)) {
			return matchEnum(
				orderDetails.existingPositionDirection,
				PositionDirection.SHORT
			)
				? matchEnum(orderDetails.direction, PositionDirection.SHORT)
					? 'Trigger Market'
					: UI_ORDER_TYPES.stopMarket.label
				: matchEnum(orderDetails.direction, PositionDirection.SHORT)
				? UI_ORDER_TYPES.takeProfitMarket.label
				: UI_ORDER_TYPES.stopMarket.label;
		} else {
			return matchEnum(
				orderDetails.existingPositionDirection,
				PositionDirection.SHORT
			)
				? matchEnum(orderDetails.direction, PositionDirection.SHORT)
					? 'Trigger Market'
					: UI_ORDER_TYPES.takeProfitMarket.label
				: matchEnum(orderDetails.direction, PositionDirection.SHORT)
				? UI_ORDER_TYPES.stopMarket.label
				: UI_ORDER_TYPES.takeProfitMarket.label;
		}
	}

	if (matchEnum(orderDetails.orderType, OrderType.TRIGGER_LIMIT)) {
		if (
			matchEnum(
				orderDetails.triggerCondition,
				OrderTriggerCondition.TRIGGERED_ABOVE
			) ||
			matchEnum(
				orderDetails.triggerCondition,
				OrderTriggerCondition.TRIGGERED_BELOW
			)
		) {
			return 'Limit (Triggered)';
		}

		if (matchEnum(orderDetails.triggerCondition, OrderTriggerCondition.ABOVE)) {
			return matchEnum(
				orderDetails.existingPositionDirection,
				PositionDirection.LONG
			)
				? matchEnum(orderDetails.direction, PositionDirection.LONG)
					? 'Stop Limit'
					: UI_ORDER_TYPES.takeProfitLimit.label
				: UI_ORDER_TYPES.stopLimit.label;
		} else {
			return matchEnum(
				orderDetails.existingPositionDirection,
				PositionDirection.LONG
			)
				? UI_ORDER_TYPES.stopLimit.label
				: matchEnum(orderDetails.direction, PositionDirection.SHORT)
				? 'Stop Limit'
				: UI_ORDER_TYPES.takeProfitLimit.label;
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

export const ORDER_COMMON_UTILS = {
	getOrderLabelFromOrderDetails,
	getLimitPriceFromOracleOffset,
	isAuctionEmpty,
};
