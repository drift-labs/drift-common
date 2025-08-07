import { BN, OrderType } from '@drift-labs/sdk';

export type TradeOffsetPrice =
	| 'worst'
	| 'best'
	| 'oracle'
	| 'mark'
	| 'entry'
	| 'bestOffer';

export type UIOrderType =
	| 'market'
	| 'limit'
	| 'stopMarket'
	| 'stopLimit'
	| 'takeProfitMarket'
	| 'takeProfitLimit'
	| 'oracle'
	| 'oracleLimit'
	| 'scaledOrders';

export type UIOrderTypeValue = {
	label: string;
	value: UIOrderType;
	orderType: OrderType;
	description?: string;
};

export type UIOrderTypeLookup = {
	[key in UIOrderType]: UIOrderTypeValue;
};

export type AuctionParams = {
	auctionStartPrice: BN;
	auctionEndPrice: BN;
	auctionDuration: number;
	constrainedBySlippage?: boolean; // flag to tell the UI that end price is constrained by max slippage tolerance
};
