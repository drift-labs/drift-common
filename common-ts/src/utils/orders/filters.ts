import {
	OrderAction,
	OrderActionRecord,
	OrderStatus,
	OrderTriggerCondition,
	OrderType,
	ZERO,
} from '@drift-labs/sdk';
import {
	UISerializableOrder,
	UISerializableOrderActionRecord,
} from '../../serializableTypes';
import { matchEnum, ENUM_UTILS } from '../enum';

// Trade records are order records which have been filled
export const orderActionRecordIsTrade = (orderRecord: OrderActionRecord) =>
	orderRecord.baseAssetAmountFilled.gt(ZERO) &&
	// @ts-ignore
	matchEnum(orderRecord.action, OrderAction.FILL) &&
	true;

export const uiOrderActionRecordIsTrade = (
	orderRecord: UISerializableOrderActionRecord
) =>
	orderRecord.baseAssetAmountFilled.gtZero() &&
	matchEnum(orderRecord.action, OrderAction.FILL) &&
	true;

// Trade records are order records which have been filled
export const filterTradeRecordsFromOrderActionRecords = (
	orderRecords: OrderActionRecord[]
): OrderActionRecord[] => orderRecords.filter(orderActionRecordIsTrade);

// Trade records are order records which have been filled
export const filterTradeRecordsFromUIOrderRecords = (
	orderRecords: UISerializableOrderActionRecord[]
): UISerializableOrderActionRecord[] =>
	orderRecords.filter(uiOrderActionRecordIsTrade);

export const isOrderTriggered = (
	order: Pick<UISerializableOrder, 'orderType' | 'triggerCondition' | 'status'>
): boolean => {
	const isTriggerOrderType =
		ENUM_UTILS.match(order.orderType, OrderType.TRIGGER_MARKET) ||
		ENUM_UTILS.match(order.orderType, OrderType.TRIGGER_LIMIT);

	const orderWasCancelled = ENUM_UTILS.match(
		order.status,
		OrderStatus.CANCELED
	);

	const orderWasTriggered =
		ENUM_UTILS.match(
			order.triggerCondition,
			OrderTriggerCondition.TRIGGERED_ABOVE
		) ||
		ENUM_UTILS.match(
			order.triggerCondition,
			OrderTriggerCondition.TRIGGERED_BELOW
		);

	return isTriggerOrderType && orderWasTriggered && !orderWasCancelled;
};
