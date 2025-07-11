import {
	BN,
	BigNum,
	MarketType,
	SpotBalanceType,
	SpotPosition,
	TradeSide,
} from '@drift-labs/sdk';
import { PublicKey } from '@solana/web3.js';
import {
	SerializableUserSnapshotRecord,
	UISerializableAccountSnapshot,
	UISerializableAllTimePnlData,
	UISerializableUserSnapshotRecord,
} from '../serializableTypes';
import { OrderType } from '@drift-labs/sdk';

export * from './MarketId';
export * from './UIMarket';
export * from './Superstake';
export * from './remote-configs';
export * from './UIEnv';

// Type for the trades returned by the data API
export type JsonTrade = {
	action: string;
	actionExplanation: string;
	baseAssetAmountFilled: number;
	bitFlags: number;
	createdAt: number;
	entity: string;
	fillRecordId: string;
	filler: string;
	fillerReward: number;
	maker: string;
	makerFee: number;
	makerOrderBaseAssetAmount: number;
	makerOrderCumulativeBaseAssetAmountFilled: number;
	makerOrderCumulativeQuoteAssetAmountFilled: number;
	makerOrderDirection: string;
	makerOrderId: number;
	makerRebate: number;
	marketFilter: string;
	marketIndex: number;
	marketType: string;
	oraclePrice: number;
	price: number;
	quoteAssetAmountFilled: number;
	quoteAssetAmountSurplus: number;
	referrerReward: number;
	slot: number;
	spotFulfillmentMethodFee: number;
	symbol: string;
	taker: string;
	takerFee: number;
	takerOrderBaseAssetAmount: number;
	takerOrderCumulativeBaseAssetAmountFilled: number;
	takerOrderCumulativeQuoteAssetAmountFilled: number;
	takerOrderDirection: string;
	takerOrderId: number;
	ts: number;
	txSig: string;
	txSigIndex: number;
};

// Type for the candles returned by the data API
export type JsonCandle = {
	ts: number;
	fillOpen: number;
	fillHigh: number;
	fillClose: number;
	fillLow: number;
	oracleOpen: number;
	oracleHigh: number;
	oracleClose: number;
	oracleLow: number;
	quoteVolume: number;
	baseVolume: number;
};

// Opaque type pattern
export type Opaque<K, T> = T & { __TYPE__: K };

// TODO-v2 cleanup these types - most of them should have moved into serializableTypes
// # UI ↔ History Server Data Types

export class SnapshotEpochResolution {
	static readonly HOURLY = { hourly: {} };
	static readonly DAILY = { daily: {} };
	static readonly WEEKLY = { weekly: {} };
	static readonly MONTHLY = { monthly: {} };
}

export enum CandleType {
	FILL_PRICE = 'FILL_PRICE',
	ORACLE_PRICE = 'ORACLE_PRICE',
}

export enum HistoryResolution {
	DAY = 'DAY',
	WEEK = 'WEEK',
	MONTH = 'MONTH',
	ALL = 'ALL',
}

export type UIAccountSnapshot = Pick<
	UserSnapshotRecord,
	'authority' | 'user' | 'epochTs'
> &
	Pick<
		UISerializableUserSnapshotRecord,
		| 'cumulativeDepositQuoteValue'
		| 'cumulativeWithdrawalQuoteValue'
		| 'totalAccountValue'
		| 'cumulativeReferralReward'
		| 'cumulativeReferralVolume'
		| 'cumulativeReferralCount'
	> & {
		allTimeTotalPnl: BigNum;
		allTimeTotalPnlPct: BigNum;
	};

export type AccountSnapshot = Pick<
	UserSnapshotRecord,
	'authority' | 'user' | 'epochTs'
> &
	Pick<
		SerializableUserSnapshotRecord,
		| 'cumulativeDepositQuoteValue'
		| 'cumulativeWithdrawalQuoteValue'
		| 'totalAccountValue'
		| 'cumulativeReferralReward'
		| 'cumulativeReferralVolume'
		| 'cumulativeReferralCount'
	> & {
		allTimeTotalPnl: BN;
		allTimeTotalPnlPct: BN;
	};

export type SnapshotHistory = {
	[key in HistoryResolution]: AccountSnapshot[];
};

export type UISnapshotHistory = {
	[HistoryResolution.DAY]: UISerializableAccountSnapshot[];
	[HistoryResolution.WEEK]: UISerializableAccountSnapshot[];
	[HistoryResolution.MONTH]: UISerializableAccountSnapshot[];
	[HistoryResolution.ALL]: UISerializableAccountSnapshot[];
	dailyAllTimePnls: UISerializableAllTimePnlData[];
};

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

export type RollingPnlData = {
	totalPnlQuote: BN;
	totalPnlPct: BN;
	spotPnlQuote: BN;
	spotPnlPct: BN;
	perpPnlQuote: BN;
	perpPnlPct: BN;
};

export type UserPerpPositionSnapshot = {
	lpShares: BN;
	quoteAssetAmount: BN;
	baseAssetAmount: BN;
	marketIndex: number;
};

export type UserSpotPositionSnapshot = {
	tokenValue: BN;
	tokenAmount: BN;
	cumulativeDeposits: BN;
	balanceInterestDelta: BN;
	marketIndex: number;
	type: SpotBalanceType;
};

export type UserSnapshotRecord = {
	programId: PublicKey;
	authority: PublicKey;
	user: PublicKey;
	epochTs: number;
	ts: number;
	perpPositionUpnl: BN;

	totalAccountValue: BN;
	cumulativeDepositQuoteValue: BN;
	cumulativeWithdrawalQuoteValue: BN;
	cumulativeSettledPerpPnl: BN;
	cumulativeReferralReward: BN;
	cumulativeReferralVolume: BN;
	cumulativeReferralCount: number;
};

export type PnlSnapshotOrderOption = keyof Pick<
	RollingPnlData,
	'totalPnlPct' | 'totalPnlQuote'
>;

export type PnlHistoryDataPoint = {
	val: number;
	ts: number;
};

export type LeaderBoardResultRow = {
	user: PublicKey;
	authority: PublicKey;
	subaccountId: number;
	resolution: SnapshotEpochResolution;
	rollingValue: number;
	pnlHistoryPoints: PnlHistoryDataPoint[];
};

export type LeaderboardResult = {
	lastUpdateTs: number;
	results: LeaderBoardResultRow[];
	ordering: PnlSnapshotOrderOption;
};

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
	constrainedBySlippage?: boolean; // flag to tell the UI that end price is constrained by max slippage tolerance
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
	feesAndFundingPnl: BN;
	lastCumulativeFundingRate: BN;
	openOrders: number;
	/**
	 * This is the unsettled pnl that is claimable. Naming is a bit confusing here.
	 */
	unsettledPnl: BN;
	unsettledFundingPnl: BN;
	/**
	 * This is the total of unsettled pnl and unsettled funding.
	 */
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

export type TradeOffsetPrice =
	| 'worst'
	| 'best'
	| 'oracle'
	| 'mark'
	| 'entry'
	| 'bestOffer';
