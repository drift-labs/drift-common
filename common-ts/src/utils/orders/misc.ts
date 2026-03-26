import { Event, OrderActionRecord } from '@drift-labs/sdk';
import { UISerializableOrderActionRecord } from '../../serializableTypes';
import { PartialUISerializableOrderActionRecord } from './sort';

export const orderIsNull = (
	order: UISerializableOrderActionRecord | Event<OrderActionRecord>,
	side: 'taker' | 'maker'
) => {
	return side === 'taker' ? !order.taker : !order.maker;
};

export const getTradeInfoFromActionRecord = (
	actionRecord: PartialUISerializableOrderActionRecord
) => {
	return {
		ts: actionRecord.ts,
		baseAssetAmount: actionRecord.taker
			? actionRecord.takerOrderBaseAssetAmount
			: actionRecord.makerOrderBaseAssetAmount,
		baseAssetAmountFilled: actionRecord.taker
			? actionRecord.takerOrderCumulativeBaseAssetAmountFilled
			: actionRecord.makerOrderCumulativeBaseAssetAmountFilled,
		quoteAssetAmountFilled: actionRecord.taker
			? actionRecord.takerOrderCumulativeQuoteAssetAmountFilled
			: actionRecord.makerOrderCumulativeQuoteAssetAmountFilled,
	};
};

export const getAnchorEnumString = (enumVal: Record<string, unknown>) => {
	return Object.keys(enumVal)[0];
};
