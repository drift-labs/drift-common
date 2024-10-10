import {
	BN,
	MarketType,
	OrderType,
	PublicKey,
	SpotPosition,
	TradeSide,
} from '@drift-labs/sdk';

export enum CandleType {
	FILL_PRICE = 'FILL_PRICE',
	ORACLE_PRICE = 'ORACLE_PRICE',
}

export interface Trade {
	recordId: number;
	// needs to be a string to compare http response object
	userAuthority: string;
	user: string;
	price: number;
	beforePrice: number;
	afterPrice: number;
	side: TradeSide;
	size: number;
	quoteSize: number;
	ts: number;
	fee: number;
	marketIndex: number;
	chainTs: number;
}

export type MarketDetails24H = {
	marketType: MarketType;
	marketIndex: number;
	symbol: string;
	baseVolume: number;
	quoteVolume: number;
	baseVolume30D: number;
	quoteVolume30D: number;
	price24hAgo: number;
	pricePercentChange: number;
	priceHigh: number;
	priceLow: number;
	avgFunding?: number;
	avgLongFunding?: number;
	avgShortFunding?: number;
	marketCap: number;
	dailyVolumeIncreaseZScore: number;
};

export type BankBalanceUI = SpotPosition & {
	accountId: number;
	accountName: string;
	accountAuthority: PublicKey;
};

export type AuctionParams = {
	auctionStartPrice: BN;
	auctionEndPrice: BN;
	auctionDuration: number;
};

export type MarketMakerRewardRecord = {
	ts: number;
	amount: number;
	symbol: string;
};

export type OpenPosition = {
	marketIndex: number;
	marketSymbol: string;
	direction: 'short' | 'long';
	notional: BN;
	baseSize: BN;
	entryPrice: BN;
	exitPrice: BN;
	liqPrice: BN;
	pnlVsOracle: BN;
	pnlVsMark: BN;
	quoteAssetNotionalAmount: BN;
	quoteEntryAmount: BN;
	quoteBreakEvenAmount: BN;
	unrealizedFundingPnl: BN;
	lastCumulativeFundingRate: BN;
	openOrders: number;
	unsettledPnl: BN;
	unsettledFundingPnl: BN;
	totalUnrealizedPnl: BN;
	costBasis: BN;
	realizedPnl: BN;
	lpShares: BN;
	pnlIsClaimable: boolean;
	remainderBaseAmount?: number; // LP only
	lpDeriskPrice?: BN; //LP only
};

export type UIOrderType =
	| 'market'
	| 'limit'
	| 'stopMarket'
	| 'stopLimit'
	| 'takeProfitMarket'
	| 'takeProfitLimit'
	| 'oracle'
	| 'oracleLimit';

export type UIOrderTypeValue = {
	label: string;
	value: UIOrderType;
	orderType: OrderType;
};

export type UIOrderTypeLookup = {
	[key in UIOrderType]: UIOrderTypeValue;
};
