import {
	BASE_PRECISION_EXP,
	BN,
	BigNum,
	CandleResolution,
	PRICE_PRECISION_EXP,
	QUOTE_PRECISION_EXP,
	OrderAction,
	OrderActionExplanation,
	ZERO,
	WrappedEvent,
} from '@drift-labs/sdk';
import { SerializableCandle, UISerializableCandle } from '../serializableTypes';
import {
	ENUM_UTILS,
	getPriceForUIOrderRecord,
	PartialUISerializableOrderActionRecord,
	sortUIOrderActionRecords,
} from '.';
import { CandleType } from '../types';

const FLAGS = {
	DEFAULT_HANDLE_BAD_CANDLES: true,
};

type CandleData = Pick<
	Candle,
	| 'baseVolume'
	| 'fillOpen'
	| 'fillHigh'
	| 'fillClose'
	| 'fillLow'
	| 'oracleOpen'
	| 'oracleHigh'
	| 'oracleClose'
	| 'oracleLow'
	| 'quoteVolume'
	| 'resolution'
	| 'start'
>;

type CandleProps = {
	start: BN;
	fillOpen: BN;
	fillHigh: BN;
	fillClose: BN;
	fillLow: BN;
	oracleOpen: BN;
	oracleHigh: BN;
	oracleClose: BN;
	oracleLow: BN;
	quoteVolume: BN;
	baseVolume: BN;
	resolution: CandleResolution;
};

const logBadCandleProp = () => {
	console.trace('Would have created bad candle here');
};

export class Candle {
	public start: BN;
	public fillOpen: BN;
	public fillHigh: BN;
	public fillClose: BN;
	public fillLow: BN;
	public oracleOpen: BN;
	public oracleHigh: BN;
	public oracleClose: BN;
	public oracleLow: BN;
	public quoteVolume: BN;
	public baseVolume: BN;
	public resolution: CandleResolution;

	public static getSafeProps(props: CandleProps) {
		const safeProps = { ...props };

		if (props.fillHigh.lt(props.fillLow)) {
			logBadCandleProp();
			safeProps.fillHigh = safeProps.fillLow;
		}

		if (props.fillHigh.lt(props.fillOpen)) {
			logBadCandleProp();
			safeProps.fillHigh = safeProps.fillOpen;
		}

		if (props.fillHigh.lt(props.fillClose)) {
			logBadCandleProp();
			logBadCandleProp();
			safeProps.fillHigh = safeProps.fillClose;
		}

		if (props.oracleHigh.lt(props.oracleLow)) {
			logBadCandleProp();
			safeProps.oracleHigh = safeProps.oracleLow;
		}

		if (props.oracleHigh.lt(props.oracleOpen)) {
			logBadCandleProp();
			safeProps.oracleHigh = safeProps.oracleOpen;
		}

		if (props.oracleHigh.lt(props.oracleClose)) {
			logBadCandleProp();
			safeProps.oracleHigh = safeProps.oracleClose;
		}

		if (props.fillLow.gt(props.fillHigh)) {
			logBadCandleProp();
			safeProps.fillLow = safeProps.fillHigh;
		}

		if (props.fillLow.gt(props.fillOpen)) {
			logBadCandleProp();
			safeProps.fillLow = props.fillOpen;
		}

		if (props.fillLow.gt(props.fillClose)) {
			logBadCandleProp();
			safeProps.fillLow = safeProps.fillClose;
		}

		if (props.oracleLow.gt(props.oracleHigh)) {
			logBadCandleProp();
			safeProps.oracleLow = safeProps.oracleHigh;
		}

		if (props.oracleLow.gt(props.oracleOpen)) {
			logBadCandleProp();
			safeProps.oracleLow = props.oracleOpen;
		}

		if (props.oracleLow.gt(props.oracleClose)) {
			logBadCandleProp();
			safeProps.oracleLow = safeProps.oracleClose;
		}

		if (props.quoteVolume.isNeg()) {
			logBadCandleProp();
			safeProps.quoteVolume = ZERO;
		}

		if (props.baseVolume.isNeg()) {
			logBadCandleProp();
			safeProps.baseVolume = ZERO;
		}

		return safeProps;
	}

	public static sanityCheckProps(props: CandleProps) {
		if (props.start.toString().length !== 13)
			throw new Error(`Candle's start time is not given in milliseconds`);

		if (props.fillHigh.lt(props.fillLow)) {
			throw new Error(`Candle's fillHigh is lower than its low`);
		}

		if (props.fillHigh.lt(props.fillOpen)) {
			throw new Error(`Candle's fillHigh is lower than its open`);
		}

		if (props.fillHigh.lt(props.fillClose)) {
			throw new Error(`Candle's fillHigh is lower than its close`);
		}

		if (props.oracleHigh.lt(props.oracleLow)) {
			throw new Error(`Candle's oracleHigh is lower than its low`);
		}

		if (props.oracleHigh.lt(props.oracleOpen)) {
			throw new Error(`Candle's oracleHigh is lower than its open`);
		}

		if (props.oracleHigh.lt(props.oracleClose)) {
			throw new Error(`Candle's oracleHigh is lower than its close`);
		}

		if (props.fillLow.gt(props.fillHigh)) {
			throw new Error(`Candle's fillLow is higher than its high`);
		}

		if (props.fillLow.gt(props.fillOpen)) {
			throw new Error(`Candle's fillLow is higher than its open`);
		}

		if (props.fillLow.gt(props.fillClose)) {
			throw new Error(`Candle's fillLow is higher than its close`);
		}

		if (props.oracleLow.gt(props.oracleHigh)) {
			throw new Error(`Candle's oracleLow is higher than its high`);
		}

		if (props.oracleLow.gt(props.oracleOpen)) {
			throw new Error(`Candle's oracleLow is higher than its open`);
		}

		if (props.oracleLow.gt(props.oracleClose)) {
			throw new Error(`Candle's oracleLow is higher than its close`);
		}

		if (props.quoteVolume.isNeg())
			throw new Error(`Can't have negative quote volume`);

		if (props.baseVolume.isNeg())
			throw new Error(`Can't have negative base volume`);

		if (props.start.toNumber() > Date.now())
			throw new Error(`Can't create a candle in the future`);

		if (
			props.start.toNumber() !==
			CANDLE_UTILS.startTimeForCandle(props.start.toNumber(), props.resolution)
		) {
			throw new Error(
				`Got a candle with a start time that doesn't match its resolution`
			);
		}
	}

	private constructor(props: {
		start: BN;
		fillOpen: BN;
		fillHigh: BN;
		fillClose: BN;
		fillLow: BN;
		oracleOpen: BN;
		oracleHigh: BN;
		oracleClose: BN;
		oracleLow: BN;
		quoteVolume: BN;
		baseVolume: BN;
		resolution: CandleResolution;
		handleBadCandle?: boolean;
	}) {
		const handleBadCandle =
			props.handleBadCandle ?? FLAGS.DEFAULT_HANDLE_BAD_CANDLES;

		// eslint-disable-next-line no-useless-catch
		try {
			if (handleBadCandle) {
				const safeProps = Candle.getSafeProps(props);

				this.start = safeProps.start;
				this.fillOpen = safeProps.fillOpen;
				this.fillHigh = safeProps.fillHigh;
				this.fillClose = safeProps.fillClose;
				this.fillLow = safeProps.fillLow;
				this.oracleOpen = safeProps.oracleOpen;
				this.oracleHigh = safeProps.oracleHigh;
				this.oracleClose = safeProps.oracleClose;
				this.oracleLow = safeProps.oracleLow;
				this.quoteVolume = safeProps.quoteVolume;
				this.baseVolume = safeProps.baseVolume;
				this.resolution = safeProps.resolution;

				return;
			} else {
				Candle.sanityCheckProps(props);
				this.start = props.start;
				this.fillOpen = props.fillOpen;
				this.fillHigh = props.fillHigh;
				this.fillClose = props.fillClose;
				this.fillLow = props.fillLow;
				this.oracleOpen = props.oracleOpen;
				this.oracleHigh = props.oracleHigh;
				this.oracleClose = props.oracleClose;
				this.oracleLow = props.oracleLow;
				this.quoteVolume = props.quoteVolume;
				this.baseVolume = props.baseVolume;
				this.resolution = props.resolution;
			}
		} catch (e) {
			// Just doing this syntax for an easy breakpoint to catch bad props
			throw e;
		}
	}

	public print() {
		const printBn = (bn: BN) => bn.toString();
		const printString = `${printBn(this.fillOpen)},${printBn(
			this.fillHigh
		)},${printBn(this.fillLow)},${printBn(this.fillClose)} : ${
			this.resolution
		} , ${new Date(this.start.toNumber()).toLocaleString()}`;
		return printString;
	}

	public toSerializable(): SerializableCandle {
		return {
			fillOpen: this.fillOpen,
			fillClose: this.fillClose,
			fillHigh: this.fillHigh,
			fillLow: this.fillLow,
			oracleOpen: this.oracleOpen,
			oracleClose: this.oracleClose,
			oracleHigh: this.oracleHigh,
			oracleLow: this.oracleLow,
			quoteVolume: this.quoteVolume,
			baseVolume: this.baseVolume,
			start: this.start,
			resolution: this.resolution,
		};
	}

	public toUISerializable(): UISerializableCandle {
		return {
			start: this.start,
			fillOpen: BigNum.from(this.fillOpen, PRICE_PRECISION_EXP),
			fillClose: BigNum.from(this.fillClose, PRICE_PRECISION_EXP),
			fillHigh: BigNum.from(this.fillHigh, PRICE_PRECISION_EXP),
			fillLow: BigNum.from(this.fillLow, PRICE_PRECISION_EXP),
			oracleOpen: BigNum.from(this.oracleOpen, PRICE_PRECISION_EXP),
			oracleClose: BigNum.from(this.oracleClose, PRICE_PRECISION_EXP),
			oracleHigh: BigNum.from(this.oracleHigh, PRICE_PRECISION_EXP),
			oracleLow: BigNum.from(this.oracleLow, PRICE_PRECISION_EXP),
			quoteVolume: BigNum.from(this.quoteVolume, QUOTE_PRECISION_EXP),
			baseVolume: BigNum.from(this.baseVolume, BASE_PRECISION_EXP),
			resolution: this.resolution,
		};
	}

	static fromData(candle: CandleData) {
		return new Candle({
			start: candle.start,
			fillOpen: candle.fillOpen,
			fillHigh: candle.fillHigh,
			fillClose: candle.fillClose,
			fillLow: candle.fillLow,
			oracleOpen: candle.oracleOpen,
			oracleHigh: candle.oracleHigh,
			oracleClose: candle.oracleClose,
			oracleLow: candle.oracleLow,
			quoteVolume: candle.quoteVolume,
			baseVolume: candle.baseVolume,
			resolution: candle.resolution,
		});
	}

	static fromUICandle(candle: UISerializableCandle, handleBadCandle?: boolean) {
		return new Candle({
			start: candle.start,
			fillOpen: candle.fillOpen.val,
			fillHigh: candle.fillHigh.val,
			fillClose: candle.fillClose.val,
			fillLow: candle.fillLow.val,
			oracleOpen: candle.oracleOpen.val,
			oracleHigh: candle.oracleHigh.val,
			oracleClose: candle.oracleClose.val,
			oracleLow: candle.oracleLow.val,
			quoteVolume: candle.quoteVolume?.val ?? new BN(0),
			baseVolume: candle.baseVolume.val,
			resolution: candle.resolution,
			handleBadCandle,
		});
	}

	static blank(
		startMs: BN,
		resolution: CandleResolution,
		fillPrice = ZERO,
		oraclePrice = ZERO
	) {
		return new Candle({
			start: startMs,
			fillOpen: fillPrice,
			fillHigh: fillPrice,
			fillClose: fillPrice,
			fillLow: fillPrice,
			oracleOpen: oraclePrice,
			oracleHigh: oraclePrice,
			oracleClose: oraclePrice,
			oracleLow: oraclePrice,
			quoteVolume: ZERO,
			baseVolume: ZERO,
			resolution,
		});
	}

	static clone(candle: Candle) {
		return new Candle({
			start: candle.start,
			fillOpen: candle.fillOpen,
			fillHigh: candle.fillHigh,
			fillClose: candle.fillClose,
			fillLow: candle.fillLow,
			oracleOpen: candle.oracleOpen,
			oracleHigh: candle.oracleHigh,
			oracleClose: candle.oracleClose,
			oracleLow: candle.oracleLow,
			quoteVolume: candle.quoteVolume,
			baseVolume: candle.baseVolume,
			resolution: candle.resolution,
		});
	}

	static mergeSmallCandlesIntoBig(
		start: number,
		smallCandles: Candle[],
		outputResolution: CandleResolution
	): Candle {
		if (smallCandles.length === 0) return null;

		const clonedCandles = smallCandles.map((candle) => Candle.clone(candle));

		// Temporarily small candles to have same resolution and start time, so that we can merge them
		clonedCandles.forEach((candle) => {
			candle.resolution = outputResolution;
			candle.start = new BN(start);
		});

		const mergedCandle = Candle.fromMergeAll(clonedCandles);

		return mergedCandle;
	}

	/**
	 * Merge two candles together. The previous candle should be from either the same window or a previous window.
	 *
	 * - If the previous candle is in the same window => outputs both the candles merged into one
	 * - If the previous candle is in the previous window => ensures the current candle correctly "follows" the previous one (updates open price, etc.)
	 *
	 * @param current
	 * @param previous
	 * @returns
	 */
	static fromMerge(current: Candle, previous?: Candle) {
		const cloned = Candle.clone(current);

		if (!previous) return cloned;

		// If the current candle has no quote or base volume, then
		if (current.baseVolume === ZERO && current.quoteVolume === ZERO) {
			return this.fromBlankAfterPrevious(
				previous,
				current.resolution,
				current.start.toNumber()
			);
		}

		if (previous.resolution !== current.resolution) {
			throw new Error(`Can't merge candles with different resolutions`);
		}

		if (previous.start.gt(current.start)) {
			throw new Error(`Previous candle is later than current candle in merge`);
		}

		const previousCandleIsInSameWindow = previous.start.eq(current.start);

		const fillOpen = previousCandleIsInSameWindow
			? previous.fillOpen
			: previous.fillClose;
		const fillClose = cloned.fillClose;

		const fillHigh = previousCandleIsInSameWindow
			? BN.max(previous.fillHigh, cloned.fillHigh)
			: BN.max(fillOpen, cloned.fillHigh);

		const fillLow = previousCandleIsInSameWindow
			? BN.min(previous.fillLow, cloned.fillLow)
			: BN.min(fillOpen, cloned.fillLow);

		const oracleOpen = previousCandleIsInSameWindow
			? previous.oracleOpen
			: previous.oracleClose;
		const oracleClose = cloned.oracleClose;

		const oracleHigh = previousCandleIsInSameWindow
			? BN.max(previous.oracleHigh, cloned.oracleHigh)
			: BN.max(oracleOpen, cloned.oracleHigh);

		const oracleLow = previousCandleIsInSameWindow
			? BN.min(previous.oracleLow, cloned.oracleLow)
			: BN.min(oracleOpen, cloned.oracleLow);

		const baseVolume = previousCandleIsInSameWindow
			? previous.baseVolume.add(cloned.baseVolume)
			: cloned.baseVolume;

		const quoteVolume = previousCandleIsInSameWindow
			? previous.quoteVolume.add(cloned.quoteVolume)
			: cloned.quoteVolume;

		return new Candle({
			start: current.start,
			fillOpen,
			fillHigh,
			fillClose,
			fillLow,
			oracleOpen,
			oracleHigh,
			oracleClose,
			oracleLow,
			quoteVolume,
			baseVolume,
			resolution: cloned.resolution,
		});
	}

	static fromBlankAfterPrevious(
		previousCandle: Candle,
		resolution: CandleResolution,
		start: number
	) {
		// Candle hasn't changed
		if (start === previousCandle.start.toNumber()) {
			return this.clone(previousCandle);
		}

		// New candle starts from previous
		const newCandle = this.blank(
			new BN(start),
			resolution,
			previousCandle.fillClose,
			previousCandle.oracleClose
		);

		return this.clone(newCandle);
	}

	static fromMergeAll(candles: Candle[]) {
		if (candles.length === 0) {
			throw new Error('Trying to merge empty array of candles');
		}

		let mergedCandle: Candle = candles[0];

		for (const candle of candles.slice(1)) {
			mergedCandle = Candle.fromMerge(candle, mergedCandle);
		}

		return mergedCandle;
	}
}

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
