import {
	BASE_PRECISION_EXP,
	BigNum,
	BN,
	CandleResolution,
	OrderAction,
	OrderActionExplanation,
	QUOTE_PRECISION_EXP,
	WrappedEvent,
} from '@drift-labs/sdk';
import { UISerializableCandle } from 'src/serializableTypes';
import {
	ENUM_UTILS,
	getPriceForUIOrderRecord,
	PartialUISerializableOrderActionRecord,
	sortUIOrderActionRecords,
} from '.';
import { Candle } from './Candle';
import { CandleType } from '../types';

/**
 * Filter for trades which we want to include in candles, which may change over time.
 * @param tradeEvent
 */
const filterOrderActionsForCandles = (
	tradeEvent: Pick<
		WrappedEvent<'OrderActionRecord'>,
		'action' | 'actionExplanation'
	>
) => {
	if (!ENUM_UTILS.match(tradeEvent.action, OrderAction.FILL)) {
		return false;
	}

	if (
		ENUM_UTILS.match(
			tradeEvent.actionExplanation,
			OrderActionExplanation.LIQUIDATION
		) ||
		ENUM_UTILS.match(
			tradeEvent.actionExplanation,
			OrderActionExplanation.TRANSFER_PERP_POSITION
		)
	) {
		// Don't include liquidations in candle prices
		return false;
	}

	return true;
};

const stitchCandles = (allCandles: Candle[]) => {
	const stichedCandles: Candle[] = [];

	const allCandlesAsc = [...allCandles].sort(
		(a, b) => a.start.toNumber() - b.start.toNumber()
	);

	allCandlesAsc.forEach((candle, index) => {
		if (index === 0) {
			stichedCandles[index] = candle;
			return;
		}

		const newCandle = Candle.fromMerge(candle, stichedCandles[index - 1]);
		stichedCandles[index] = newCandle;
		return;
	});

	// Return stiched candles
	return stichedCandles;
};

/**
 * Create an array of candles from an array of trades. Merges trades into a single candle if they are in the same candle window.
 * @param trades
 * @param resolution
 * @returns
 */
const mergeTradesIntoCandles = (
	trades: PartialUISerializableOrderActionRecord[],
	resolution: CandleResolution
): Candle[] => {
	const ascOrderedTrades = [...trades].sort(
		(tradeA, tradeB) => tradeA.slot - tradeB.slot
	);

	const candleTradeBuckets = new Map<
		number,
		PartialUISerializableOrderActionRecord[]
	>();

	// Sort trades into buckets for candles
	for (const trade of ascOrderedTrades) {
		const candleTs = startTimeForCandle(trade.ts.toNumber() * 1000, resolution);
		if (candleTradeBuckets.get(candleTs)) {
			candleTradeBuckets.get(candleTs).push(trade);
		} else {
			candleTradeBuckets.set(candleTs, [trade]);
		}
	}

	// Create a candle for each bucket
	const allCandles: Candle[] = [];
	for (const [startTime, tradesInBucket] of candleTradeBuckets.entries()) {
		const innerCandles = tradesInBucket.map((trade) =>
			candleFromTrade(startTime, resolution, trade)
		);
		const mergedCandle = Candle.fromMergeAll(innerCandles);
		allCandles.push(mergedCandle);
	}
	allCandles.sort(
		(candleA, candleB) => candleA.start.toNumber() - candleB.start.toNumber()
	);

	// Stitch candles together
	const stichedCandles: Candle[] = stitchCandles(allCandles);

	// Return stiched candles
	return stichedCandles;
};

const candleFromTrade = (
	start: number,
	resolution: CandleResolution,
	trade: Omit<PartialUISerializableOrderActionRecord, 'slot'>
) => {
	return Candle.fromData({
		start: new BN(startTimeForCandle(start, resolution)),
		fillOpen: getPriceForUIOrderRecord(trade).val,
		fillHigh: getPriceForUIOrderRecord(trade).val,
		fillClose: getPriceForUIOrderRecord(trade).val,
		fillLow: getPriceForUIOrderRecord(trade).val,
		oracleOpen: trade.oraclePrice.val,
		oracleHigh: trade.oraclePrice.val,
		oracleClose: trade.oraclePrice.val,
		oracleLow: trade.oraclePrice.val,
		quoteVolume: trade.quoteAssetAmountFilled.val,
		baseVolume: trade.baseAssetAmountFilled.val,
		resolution,
	});
};

const mergeTradesIntoCandle = (
	trades: PartialUISerializableOrderActionRecord[],
	candle: UISerializableCandle
): Candle => {
	if (trades.length === 0) return Candle.fromUICandle(candle);

	const candlesFromTrades = trades.map((trade) =>
		candleFromTrade(candle.start.toNumber(), candle.resolution, trade)
	);

	const mergedCandleFromTrades = Candle.fromMergeAll([...candlesFromTrades]);

	const mergedCandle = Candle.fromMerge(
		mergedCandleFromTrades,
		Candle.fromUICandle(candle)
	);

	return mergedCandle;
};

const convertTradesToCandle = (
	trades: PartialUISerializableOrderActionRecord[],
	fromMs: number,
	resolution: CandleResolution,
	previousCandle?: UISerializableCandle
): Candle => {
	const resolutionMs = resolutionStringToCandleLengthMs(resolution);
	const toMs = fromMs + resolutionMs;

	const filteredTrades = trades.filter((t) => {
		const tradeMs = t.ts.mul(new BN(1000));

		if (fromMs && tradeMs.lt(new BN(fromMs))) return false;
		if (toMs && tradeMs.gte(new BN(toMs))) return false;
		return true;
	});

	if (filteredTrades.length === 0) {
		return previousCandle ? Candle.fromUICandle(previousCandle) : undefined;
	}

	const sortedTrades = sortUIOrderActionRecords(filteredTrades, 'asc');

	const candleForPrevious = previousCandle
		? Candle.fromUICandle(previousCandle)
		: undefined;

	const candlesForTrades = sortedTrades.map((trade) =>
		candleFromTrade(fromMs, resolution, trade)
	);

	const candlesToMerge = candleForPrevious
		? [candleForPrevious, ...candlesForTrades]
		: [...candlesForTrades];

	const mergedCandles = Candle.fromMergeAll(candlesToMerge);

	return mergedCandles;
};

const resolutionStringToCandleLengthMs = (
	resolutionString: CandleResolution
): number => {
	switch (resolutionString) {
		case '1':
			return 1 * 60 * 1000;
		case '5':
			return 5 * 60 * 1000;
		case '15':
			return 15 * 60 * 1000;
		case '60':
			return 60 * 60 * 1000;
		case '240':
			return 240 * 60 * 1000;
		case 'D':
			return 24 * 60 * 60 * 1000;
		case 'W':
			return 7 * 24 * 60 * 60 * 1000;
		case 'M':
			return 30 * 24 * 60 * 60 * 1000;
	}
};

const getDividingResolution = (
	resolutionString: CandleResolution
): CandleResolution => {
	switch (resolutionString) {
		case '1':
			return '1';
		case '5':
			return '1';
		case '15':
			return '5';
		case '60':
			return '15';
		case '240':
			return '60';
		case 'D':
			return '240';
		case 'W':
			return 'D';
		case 'M':
			return 'D';
	}
};

// This Type is copied from tradingview charting_library
type Bar = {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume?: number;
};

const candleToTvBar = (
	candle: UISerializableCandle,
	candleType: CandleType
): Bar => {
	const useFill = candleType === CandleType.FILL_PRICE;

	return {
		time: candle.start.toNumber(),
		open: (useFill ? candle.fillOpen : candle.oracleOpen).toNum(),
		close: (useFill ? candle.fillClose : candle.oracleClose).toNum(),
		low: (useFill ? candle.fillLow : candle.oracleLow).toNum(),
		high: (useFill ? candle.fillHigh : candle.oracleHigh).toNum(),
		volume: candle.quoteVolume.toNum(),
	};
};

/**
 * This method handles the candles that come back from the exchange history server and converts them into Bars for the TradingView Chart. It also fills any gaps in the candles with blanks.
 * @param candles
 * @returns
 */
const candlesToTvBars = (
	candles: UISerializableCandle[],
	resolution: CandleResolution,
	candleType: CandleType
): Bar[] => {
	const candlesWithBlanks: UISerializableCandle[] = [];

	candles.forEach((candle, index) => {
		if (index == 0) {
			candlesWithBlanks.push(candle);
		} else {
			const previousCandle = candles[index - 1];
			let msBetweenCandles =
				candle.start.toNumber() - previousCandle.start.toNumber();
			const interval = resolutionStringToCandleLengthMs(resolution);
			let blankCandleCount = 1;

			// Fill gaps in candles with blanks
			while (msBetweenCandles > interval) {
				const blankCandle = Candle.fromData({
					start: new BN(
						previousCandle.start.toNumber() + interval * blankCandleCount
					),
					fillOpen: previousCandle.fillClose.val,
					fillClose: previousCandle.fillClose.val,
					fillHigh: previousCandle.fillClose.val,
					fillLow: previousCandle.fillClose.val,
					oracleOpen: previousCandle.oracleClose.val,
					oracleClose: previousCandle.oracleClose.val,
					oracleHigh: previousCandle.oracleClose.val,
					oracleLow: previousCandle.oracleClose.val,
					quoteVolume: BigNum.zero(QUOTE_PRECISION_EXP).val,
					baseVolume: BigNum.zero(BASE_PRECISION_EXP).val,
					resolution,
				}).toUISerializable();

				candlesWithBlanks.push(blankCandle);
				blankCandleCount++;
				msBetweenCandles -= interval;
			}

			candlesWithBlanks.push(candle);
		}
	});

	return candlesWithBlanks.map((candle) => candleToTvBar(candle, candleType));
};

const tsIsSeconds = (ts: number) => {
	return ts.toString().length <= 10;
};

const startTimeForCandle = (ts: number, resolution: CandleResolution) => {
	if (tsIsSeconds(ts)) {
		throw new Error('Timestamp for candle should be in milliseconds');
	}
	return ts - (ts % resolutionStringToCandleLengthMs(resolution));
};

const endTimeForCandle = (ts: number, resolution: CandleResolution) => {
	if (tsIsSeconds(ts)) {
		throw new Error('Timestamp for candle should be in milliseconds');
	}
	return (
		startTimeForCandle(ts, resolution) +
		resolutionStringToCandleLengthMs(resolution)
	);
};

export const CANDLE_UTILS = {
	mergeTradesIntoCandle,
	startTimeForCandle,
	endTimeForCandle,
	candleFromTrade,
	convertTradesToCandle,
	candleToTvBar,
	candlesToTvBars,
	resolutionStringToCandleLengthMs,
	mergeTradesIntoCandles,
	stitchCandles,
	getDividingResolution,
	filterOrderActionsForCandles,
};
