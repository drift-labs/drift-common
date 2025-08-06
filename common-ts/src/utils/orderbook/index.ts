import { MarketType, OraclePriceData, L2OrderBook, BN } from '@drift-labs/sdk';

export interface L2WithOracle extends L2OrderBook {
	oracleData: OraclePriceData;
	markPrice: BN;
	bestBidPrice: BN;
	bestAskPrice: BN;
	spreadPct: BN;
	spreadQuote: BN;
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
		twap?: string;
		twapConfidence?: string;
		maxPrice?: string;
	};
	markPrice: string;
	bestBidPrice: string;
	bestAskPrice: string;
	spreadPct: string;
	spreadQuote: string;
	slot?: number;
};

export type LiquidityType = 'vamm' | 'dlob' | 'serum' | 'phoenix' | 'openbook';

/**
 * Helper function to deserialize the response from the dlob server. (See https://drift-labs.github.io/v2-teacher/#get-l2-l3)
 * @param serializedOrderbook
 * @returns
 */
export const deserializeL2Response = (
	serializedOrderbook: RawL2Output
): L2WithOracleAndMarketData => {
	const oracleDataToUse =
		serializedOrderbook.mmOracleData ?? serializedOrderbook.oracleData;
	return {
		asks: serializedOrderbook.asks.map((ask) => ({
			price: new BN(ask.price),
			size: new BN(ask.size),
			sources: Object.entries(ask.sources).reduce((previous, [key, val]) => {
				return {
					...previous,
					[key]: new BN(val),
				};
			}, {}),
		})),
		bids: serializedOrderbook.bids.map((bid) => ({
			price: new BN(bid.price),
			size: new BN(bid.size),
			sources: Object.entries(bid.sources).reduce((previous, [key, val]) => {
				return {
					...previous,
					[key]: new BN(val),
				};
			}, {}),
		})),
		oracleData: {
			price: oracleDataToUse.price ? new BN(oracleDataToUse.price) : undefined,
			slot: oracleDataToUse.slot ? new BN(oracleDataToUse.slot) : undefined,
			confidence: oracleDataToUse.confidence
				? new BN(oracleDataToUse.confidence)
				: undefined,
			hasSufficientNumberOfDataPoints:
				oracleDataToUse.hasSufficientNumberOfDataPoints,
			twap: oracleDataToUse.twap ? new BN(oracleDataToUse.twap) : undefined,
			twapConfidence: oracleDataToUse.twapConfidence
				? new BN(oracleDataToUse.twapConfidence)
				: undefined,
			maxPrice: oracleDataToUse.maxPrice
				? new BN(oracleDataToUse.maxPrice)
				: undefined,
		},
		slot: serializedOrderbook.slot,
		marketSlot: serializedOrderbook.marketSlot,
		marketType: serializedOrderbook.marketType,
		marketIndex: serializedOrderbook.marketIndex,
		marketName: serializedOrderbook.marketName,
		markPrice: new BN(serializedOrderbook.markPrice),
		bestBidPrice: new BN(serializedOrderbook.bestBidPrice),
		bestAskPrice: new BN(serializedOrderbook.bestAskPrice),
		spreadPct: new BN(serializedOrderbook.spreadPct),
		spreadQuote: new BN(serializedOrderbook.spreadQuote),
	};
};
