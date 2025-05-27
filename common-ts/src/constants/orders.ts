import { OrderType } from '@drift-labs/sdk';
import { UIOrderTypeLookup, UIOrderTypeValue } from '../types';

// Market order type
export const MARKET_ORDER_TYPE_CONFIG: UIOrderTypeValue = {
	label: 'Market',
	value: 'market',
	orderType: OrderType.MARKET,
	description:
		'A Market Order is an order to buy or sell an asset immediately at the current Market Price. Users can set a maximum slippage tolerance.',
};

// Limit order type
export const LIMIT_ORDER_TYPE_CONFIG: UIOrderTypeValue = {
	label: 'Limit',
	value: 'limit',
	orderType: OrderType.LIMIT,
	description:
		'A Limit Order is an order to buy or sell a given asset at a specified price. Limit Orders are triggered once Oracle Price reaches the specified price.',
};

// Stop Market order type
export const STOP_MARKET_ORDER_TYPE_CONFIG: UIOrderTypeValue = {
	label: 'Stop Market',
	value: 'stopMarket',
	orderType: OrderType.TRIGGER_MARKET,
	description:
		'A Stop Market Order is an order to close the position of a given asset if its Oracle Price reaches the specified Trigger Price. If this happens, the position is closed at Market Price.',
};

// Stop Limit order type
export const STOP_LIMIT_ORDER_TYPE_CONFIG: UIOrderTypeValue = {
	label: 'Stop Limit',
	value: 'stopLimit',
	orderType: OrderType.TRIGGER_LIMIT,
	description:
		'A Stop Limit Order will only execute where the Oracle Price of a given asset reaches the Trigger Price. If this happens, a Limit Order at the specified Limit Price will be placed.',
};

// Take Profit Market order type
export const TAKE_PROFIT_MARKET_ORDER_TYPE_CONFIG: UIOrderTypeValue = {
	label: 'Take Profit',
	value: 'takeProfitMarket',
	orderType: OrderType.TRIGGER_MARKET,
	description:
		'A Take Profit Order is an order to close the position of a given asset if its Oracle Price reaches the specified Trigger Price. If this happens, the position is closed at Market Price.',
};

// Take Profit Limit order type
export const TAKE_PROFIT_LIMIT_ORDER_TYPE_CONFIG: UIOrderTypeValue = {
	label: 'Take Profit Limit',
	value: 'takeProfitLimit',
	orderType: OrderType.TRIGGER_LIMIT,
	description:
		'A Take Profit Limit Order will only execute where the Oracle Price of a given asset reaches the Trigger Price. If this happens, a Limit Order at the specified Limit Price will be placed.',
};

// Oracle Market order type
export const ORACLE_MARKET_ORDER_TYPE_CONFIG: UIOrderTypeValue = {
	label: 'Oracle Market',
	value: 'oracle',
	orderType: OrderType.ORACLE,
};

// Oracle Limit order type
export const ORACLE_LIMIT_ORDER_TYPE_CONFIG: UIOrderTypeValue = {
	label: 'Oracle Limit',
	value: 'oracleLimit',
	orderType: OrderType.LIMIT,
	description:
		'An Oracle Limit Order allows you to specify an offset rather than limit price to execute your order. The offset represents the price above/below the current Oracle Price you want to be filled at. Learn more.',
};

// Scaled Orders order type
export const SCALED_ORDERS_ORDER_TYPE_CONFIG: UIOrderTypeValue = {
	label: 'Scale',
	value: 'scaledOrders',
	orderType: OrderType.LIMIT,
	description:
		'A scaled order automatically generates multiple limit orders within a specified price range. It splits the order amount into several suborders and places them separately without significantly impacting the market.',
};

export const UI_ORDER_TYPES: UIOrderTypeLookup = {
	market: MARKET_ORDER_TYPE_CONFIG,
	limit: LIMIT_ORDER_TYPE_CONFIG,
	stopMarket: STOP_MARKET_ORDER_TYPE_CONFIG,
	stopLimit: STOP_LIMIT_ORDER_TYPE_CONFIG,
	takeProfitMarket: TAKE_PROFIT_MARKET_ORDER_TYPE_CONFIG,
	takeProfitLimit: TAKE_PROFIT_LIMIT_ORDER_TYPE_CONFIG,
	oracle: ORACLE_MARKET_ORDER_TYPE_CONFIG,
	oracleLimit: ORACLE_LIMIT_ORDER_TYPE_CONFIG,
	scaledOrders: SCALED_ORDERS_ORDER_TYPE_CONFIG,
};

export const UI_ORDER_TYPES_LIST = Object.values(UI_ORDER_TYPES);
