import { Opaque } from '../../types/utility';

import {
	MarketType,
	OraclePriceData,
	L2OrderBook,
	BN,
	MMOraclePriceData,
	L2Level,
} from '@drift-labs/sdk';

export interface L2WithOracle extends L2OrderBook {
	oracleData: OraclePriceData;
	markPrice: BN;
	bestBidPrice: BN;
	bestAskPrice: BN;
	spreadPct: BN;
	spreadQuote: BN;
	mmOracleData?: MMOraclePriceData;
}

export interface L2WithOracleAndMarketData extends L2WithOracle {
	marketSlot: number;
	marketIndex: number;
	marketName: string;
	marketType?: MarketType;
}

export type RawL2Output = {
	marketIndex: number;
	marketType: MarketType;
	marketName: string;
	marketSlot: number;
	asks: {
		price: string;
		size: string;
		sources: {
			[key: string]: string;
		};
	}[];
	bids: {
		price: string;
		size: string;
		sources: {
			[key: string]: string;
		};
	}[];
	oracleData: {
		price: string;
		slot: string;
		confidence: string;
		hasSufficientNumberOfDataPoints: boolean;
		twap?: string;
		twapConfidence?: string;
		maxPrice?: string;
	};
	mmOracleData?: {
		price: string;
		slot: string;
		confidence: string;
		hasSufficientNumberOfDataPoints: boolean;
		isMMOracleActive: boolean;
	};
	markPrice: string;
	bestBidPrice: string;
	bestAskPrice: string;
	spreadPct: string;
	spreadQuote: string;
	slot?: number;
};

export type LiquidityType = keyof L2Level['sources'];

export type OrderBookBidAsk = {
	price: number;
	size: number;
	type: LiquidityType;
};

export type BidsAndAsks = {
	bids: OrderBookBidAsk[];
	asks: OrderBookBidAsk[];
};

export enum CUMULATIVE_SIZE_CURRENCY {
	USD,
	BASE,
}

export type GroupingSizeQuoteValue = Opaque<number, 'GroupingSizeQuoteValue'>;

export type CategorisedLiquidity = Partial<Record<LiquidityType, number>>;
