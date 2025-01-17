import { MarketType, OraclePriceData, L2OrderBook, BN } from '@drift-labs/sdk';

export type L2WithOracle = L2OrderBook & { oracleData: OraclePriceData };

export type RawL2Output = {
	marketIndex: number;
	marketType: MarketType;
	marketName: string;
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
	slot?: number;
};

/**
 * Helper function to deserialize the response from the dlob server. (See https://drift-labs.github.io/v2-teacher/#get-l2-l3)
 * @param serializedOrderbook
 * @returns
 */
export const deserializeL2Response = (
	serializedOrderbook: RawL2Output
): L2WithOracle => {
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
			price: serializedOrderbook.oracleData.price
				? new BN(serializedOrderbook.oracleData.price)
				: undefined,
			slot: serializedOrderbook.oracleData.slot
				? new BN(serializedOrderbook.oracleData.slot)
				: undefined,
			confidence: serializedOrderbook.oracleData.confidence
				? new BN(serializedOrderbook.oracleData.confidence)
				: undefined,
			hasSufficientNumberOfDataPoints:
				serializedOrderbook.oracleData.hasSufficientNumberOfDataPoints,
			twap: serializedOrderbook.oracleData.twap
				? new BN(serializedOrderbook.oracleData.twap)
				: undefined,
			twapConfidence: serializedOrderbook.oracleData.twapConfidence
				? new BN(serializedOrderbook.oracleData.twapConfidence)
				: undefined,
			maxPrice: serializedOrderbook.oracleData.maxPrice
				? new BN(serializedOrderbook.oracleData.maxPrice)
				: undefined,
		},
		slot: serializedOrderbook.slot,
	};
};
