import { OrderType } from '@drift-labs/sdk';
import { UIOrderTypeLookup } from '../types';

export const UI_ORDER_TYPES: UIOrderTypeLookup = {
	market: {
		label: 'Market',
		value: 'market',
		orderType: OrderType.MARKET,
	},
	limit: {
		label: 'Limit',
		value: 'limit',
		orderType: OrderType.LIMIT,
	},
	stopMarket: {
		label: 'Stop Market',
		value: 'stopMarket',
		orderType: OrderType.TRIGGER_MARKET,
	},
	stopLimit: {
		label: 'Stop Limit',
		value: 'stopLimit',
		orderType: OrderType.TRIGGER_LIMIT,
	},
	takeProfitMarket: {
		label: 'Take Profit',
		value: 'takeProfitMarket',
		orderType: OrderType.TRIGGER_MARKET,
	},
	takeProfitLimit: {
		label: 'Take Profit Limit',
		value: 'takeProfitLimit',
		orderType: OrderType.TRIGGER_LIMIT,
	},
	oracle: {
		label: 'Oracle Market',
		value: 'oracle',
		orderType: OrderType.ORACLE,
	},
	oracleLimit: {
		label: 'Oracle Limit',
		value: 'oracleLimit',
		orderType: OrderType.LIMIT,
	},
	scaledOrders: {
		label: 'Scaled Orders',
		value: 'scaledOrders',
		orderType: OrderType.LIMIT,
	},
};

export const UI_ORDER_TYPES_LIST = Object.values(UI_ORDER_TYPES);
