import { OrderType } from '@drift-labs/sdk';
import { UIOrderTypeLookup } from '../types';

export const UI_ORDER_TYPES: UIOrderTypeLookup = {
	market: {
		label: 'Market',
		value: 'market',
		orderType: OrderType.MARKET,
		description:
			'A Market Order is an order to buy or sell an asset immediately at the current Market Price. Users can set a maximum slippage tolerance.',
	},
	limit: {
		label: 'Limit',
		value: 'limit',
		orderType: OrderType.LIMIT,
		description:
			'A Limit Order is an order to buy or sell a given asset at a specified price. Limit Orders are triggered once Oracle Price reaches the specified price.',
	},
	stopMarket: {
		label: 'Stop Market',
		value: 'stopMarket',
		orderType: OrderType.TRIGGER_MARKET,
		description:
			'A Stop Market Order is an order to close the position of a given asset if its Oracle Price reaches the specified Trigger Price. If this happens, the position is closed at Market Price.',
	},
	stopLimit: {
		label: 'Stop Limit',
		value: 'stopLimit',
		orderType: OrderType.TRIGGER_LIMIT,
		description:
			'A Stop Limit Order will only execute where the Oracle Price of a given asset reaches the Trigger Price. If this happens, a Limit Order at the specified Limit Price will be placed.',
	},
	takeProfitMarket: {
		label: 'Take Profit',
		value: 'takeProfitMarket',
		orderType: OrderType.TRIGGER_MARKET,
		description:
			'A Take Profit Order is an order to close the position of a given asset if its Oracle Price reaches the specified Trigger Price. If this happens, the position is closed at Market Price.',
	},
	takeProfitLimit: {
		label: 'Take Profit Limit',
		value: 'takeProfitLimit',
		orderType: OrderType.TRIGGER_LIMIT,
		description:
			'A Take Profit Limit Order will only execute where the Oracle Price of a given asset reaches the Trigger Price. If this happens, a Limit Order at the specified Limit Price will be placed.',
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
		description:
			'An Oracle Limit Order allows you to specify an offset rather than limit price to execute your order. The offset represents the price above/below the current Oracle Price you want to be filled at. Learn more.',
	},
	scaledOrders: {
		label: 'Scale Order',
		value: 'scaledOrders',
		orderType: OrderType.LIMIT,
		description:
			'A scaled order automatically generates multiple limit orders within a specified price range. It splits the order amount into several suborders and places them separately without significantly impacting the market.',
	},
};

export const UI_ORDER_TYPES_LIST = Object.values(UI_ORDER_TYPES);
