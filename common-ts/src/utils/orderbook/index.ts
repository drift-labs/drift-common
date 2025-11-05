import {
	MarketType,
	OraclePriceData,
	L2OrderBook,
	BN,
	MMOraclePriceData,
	BigNum,
	PERCENTAGE_PRECISION_EXP,
	L2Level,
} from '@drift-labs/sdk';
import { MarketId } from '../../types';
import { COMMON_MATH } from '../math';

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

/**
 * Helper function to deserialize the response from the dlob server. (See https://drift-labs.github.io/v2-teacher/#get-l2-l3)
 * @param serializedOrderbook
 * @returns
 */
export const deserializeL2Response = (
	serializedOrderbook: RawL2Output
): L2WithOracleAndMarketData => {
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
		mmOracleData: {
			price: serializedOrderbook.mmOracleData?.price
				? new BN(serializedOrderbook.mmOracleData.price)
				: undefined,
			slot: serializedOrderbook.mmOracleData?.slot
				? new BN(serializedOrderbook.mmOracleData.slot)
				: undefined,
			confidence: serializedOrderbook.mmOracleData?.confidence
				? new BN(serializedOrderbook.mmOracleData.confidence)
				: undefined,
			hasSufficientNumberOfDataPoints:
				serializedOrderbook.mmOracleData?.hasSufficientNumberOfDataPoints,
			isMMOracleActive:
				serializedOrderbook.mmOracleData?.isMMOracleActive ?? false,
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

export const convertToL2OrderBook = (
	l2Data: L2WithOracleAndMarketData[]
): L2OrderBook => {
	// Find the market data - there should be one entry for our market
	const marketData = l2Data[0];

	if (!marketData) {
		throw new Error('No L2 data available for market');
	}

	// L2WithOracleAndMarketData extends L2OrderBook, so we can use it directly
	return {
		asks: marketData.asks,
		bids: marketData.bids,
		slot: marketData.slot,
	};
};

export interface DynamicSlippageConfig {
	dynamicSlippageMin?: number;
	dynamicSlippageMax?: number;
	dynamicBaseSlippageMajor?: number;
	dynamicBaseSlippageNonMajor?: number;
	dynamicSlippageMultiplierMajor?: number;
	dynamicSlippageMultiplierNonMajor?: number;
}

const DEFAULT_DYNAMIC_SLIPPAGE_CONFIG: DynamicSlippageConfig = {
	dynamicSlippageMin: 0.05,
	dynamicSlippageMax: 5,
	dynamicBaseSlippageMajor: 0,
	dynamicBaseSlippageNonMajor: 0.5,
	dynamicSlippageMultiplierMajor: 1.02,
	dynamicSlippageMultiplierNonMajor: 1.2,
};

export const calculateDynamicSlippageFromL2 = ({
	l2Data,
	marketId,
	startPrice,
	worstPrice,
	oraclePrice,
	dynamicSlippageConfig,
}: {
	l2Data: L2OrderBook;
	marketId: MarketId;
	startPrice: BN;
	worstPrice: BN;
	oraclePrice?: BN;
	dynamicSlippageConfig?: DynamicSlippageConfig;
}): number => {
	const dynamicSlippageConfigToUse = dynamicSlippageConfig
		? { ...DEFAULT_DYNAMIC_SLIPPAGE_CONFIG, ...dynamicSlippageConfig }
		: DEFAULT_DYNAMIC_SLIPPAGE_CONFIG;

	// Calculate spread information from L2 data using the oracle price
	const spreadBidAskMark = COMMON_MATH.calculateSpreadBidAskMark(
		l2Data,
		oraclePrice
	);

	const bestAskNum = spreadBidAskMark.bestAskPrice?.toNumber?.() || 0;
	const bestBidNum = spreadBidAskMark.bestBidPrice?.toNumber?.() || 0;

	const spreadPctFromL2 = BigNum.from(
		spreadBidAskMark.spreadPct,
		PERCENTAGE_PRECISION_EXP
	).toNum();

	// Calculate spread percentage
	const spreadPct =
		spreadPctFromL2 ||
		(Math.abs(bestAskNum - bestBidNum) / ((bestAskNum + bestBidNum) / 2)) * 100;

	// Default to 0.5% if we get invalid spread info
	if (isNaN(spreadPct) || spreadPct <= 0) {
		return 0.5;
	}

	// Apply a buffer based on the tier of the contract
	// Currently no buffer for SOL/BTC/ETH perp and a +10% buffer for other markets
	const isMajor = marketId.isPerp && marketId.marketIndex < 3;

	const spreadBaseSlippage = spreadPct / 2;

	const baseSlippage = isMajor
		? dynamicSlippageConfigToUse.dynamicBaseSlippageMajor
		: dynamicSlippageConfigToUse.dynamicBaseSlippageNonMajor;
	let dynamicSlippage = baseSlippage + spreadBaseSlippage;

	// Use halfway to worst price as size adjusted slippage
	if (startPrice && worstPrice) {
		const sizeAdjustedSlippage =
			(startPrice.sub(worstPrice).abs().toNumber() /
				BN.max(startPrice, worstPrice).toNumber() /
				2) *
			100;

		dynamicSlippage = Math.max(dynamicSlippage, sizeAdjustedSlippage);
	}

	// Apply multiplier from env var
	const multiplier = isMajor
		? dynamicSlippageConfigToUse.dynamicSlippageMultiplierMajor
		: dynamicSlippageConfigToUse.dynamicSlippageMultiplierNonMajor;

	dynamicSlippage = dynamicSlippage * multiplier;

	// Enforce .05% minimum, 5% maximum, can change these in env vars
	const finalSlippage = Math.min(
		Math.max(dynamicSlippage, dynamicSlippageConfigToUse.dynamicSlippageMin),
		dynamicSlippageConfigToUse.dynamicSlippageMax
	);

	// Round to avoid floating point precision issues, preserving 6 decimal places
	return Math.round(finalSlippage * 1000000) / 1000000;
};
