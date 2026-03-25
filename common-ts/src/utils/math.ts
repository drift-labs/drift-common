import {
	BigNum,
	BN,
	L2OrderBook,
	PERCENTAGE_PRECISION,
	SpotMarketConfig,
	ZERO,
} from '@drift-labs/sdk';

const calculateMarkPrice = (
	bestBidPrice?: BN,
	bestAskPrice?: BN,
	oraclePrice?: BN
) => {
	const bid = bestBidPrice;
	const ask = bestAskPrice;

	let mid: BN;

	// if bid/ask cross, force it to be the one closer to oracle, if oracle is in the middle, use oracle price
	if (bid && ask && bid.gt(ask) && oraclePrice) {
		if (bid.gt(oraclePrice) && ask.gt(oraclePrice)) {
			mid = BN.min(bid, ask);
		} else if (bid.lt(oraclePrice) && ask.lt(oraclePrice)) {
			mid = BN.max(bid, ask);
		} else {
			mid = oraclePrice;
		}
	} else {
		if (bid && ask) {
			mid = bid.add(ask).divn(2);
		} else if (oraclePrice) {
			mid = oraclePrice;
		} else {
			mid = undefined;
		}
	}

	return mid;
};

const calculateBidAskAndmarkPrice = (l2: L2OrderBook, oraclePrice?: BN) => {
	const bestBidPrice = l2.bids.reduce((previousMax, currentBid) => {
		if (!previousMax) return currentBid.price;
		return BN.max(currentBid.price, previousMax);
	}, undefined as BN);

	const bestAskPrice = l2.asks.reduce((previousMin, currentBid) => {
		if (!previousMin) return currentBid.price;
		return BN.min(currentBid.price, previousMin);
	}, undefined as BN);

	const markPrice = calculateMarkPrice(bestBidPrice, bestAskPrice, oraclePrice);

	return {
		bestBidPrice,
		bestAskPrice,
		markPrice,
	};
};

const calculateSpreadQuote = (bestBidPrice: BN, bestAskPrice: BN) => {
	return BN.max(bestAskPrice.sub(bestBidPrice), ZERO);
};

function calculateSpreadPct(markPricePrice: BN, spreadQuote: BN) {
	return spreadQuote.muln(100).mul(PERCENTAGE_PRECISION).div(markPricePrice);
}

const calculateSpread = (bestBidPrice: BN, bestAskPrice: BN, markPrice: BN) => {
	const spreadQuote = calculateSpreadQuote(bestBidPrice, bestAskPrice);
	const spreadPct = calculateSpreadPct(markPrice, spreadQuote);

	return {
		spreadPct,
		spreadQuote,
	};
};

const calculateSpreadBidAskMark = (
	l2: Pick<L2OrderBook, 'bids' | 'asks'>,
	oraclePrice?: BN
) => {
	if (l2.asks.length === 0 || l2.bids.length === 0) {
		return {
			spreadQuote: undefined,
			spreadPct: undefined,
			markPrice: undefined,
			bestBidPrice: undefined,
			bestAskPrice: undefined,
		};
	}

	const { bestBidPrice, bestAskPrice, markPrice } = calculateBidAskAndmarkPrice(
		l2,
		oraclePrice
	);

	const { spreadPct, spreadQuote } = calculateSpread(
		bestBidPrice,
		bestAskPrice,
		markPrice
	);
	return {
		bestBidPrice,
		bestAskPrice,
		markPrice,
		spreadPct,
		spreadQuote,
	};
};

export const TRADE_PRECISION = 6;

export const getPctCompletion = (
	start: number,
	end: number,
	current: number
) => {
	const totalProgressSize = end - start;
	const currentProgressSize = current - start;

	return (currentProgressSize / totalProgressSize) * 100;
};

export const sortBnAsc = (bnA: BN, bnB: BN) => {
	if (bnA.gt(bnB)) return 1;
	if (bnA.eq(bnB)) return 0;
	if (bnA.lt(bnB)) return -1;

	return 0;
};

export const sortBnDesc = (bnA: BN, bnB: BN) => sortBnAsc(bnB, bnA);

export const getBigNumRoundedToStepSize = (baseSize: BigNum, stepSize: BN) => {
	const baseSizeRounded = baseSize.div(stepSize).mul(stepSize);
	return baseSizeRounded;
};

export const truncateInputToPrecision = (
	input: string,
	marketPrecisionExp: SpotMarketConfig['precisionExp']
) => {
	const decimalPlaces = input.split('.')[1]?.length ?? 0;
	const maxDecimals = marketPrecisionExp.toNumber();

	if (decimalPlaces > maxDecimals) {
		return input.slice(0, input.length - (decimalPlaces - maxDecimals));
	}

	return input;
};

export const roundToStepSize = (value: string, stepSize?: number) => {
	const stepSizeExp = stepSize?.toString().split('.')[1]?.length ?? 0;
	const truncatedValue = truncateInputToPrecision(value, new BN(stepSizeExp));

	if (truncatedValue.charAt(truncatedValue.length - 1) === '.') {
		return truncatedValue.slice(0, -1);
	}

	return truncatedValue;
};

export const roundToStepSizeIfLargeEnough = (
	value: string,
	stepSize?: number
) => {
	const parsedValue = parseFloat(value);
	if (isNaN(parsedValue) || stepSize === 0 || !value || parsedValue === 0) {
		return value;
	}

	return roundToStepSize(value, stepSize);
};

export const valueIsBelowStepSize = (value: string, stepSize: number) => {
	const parsedValue = parseFloat(value);

	if (isNaN(parsedValue)) return false;

	return parsedValue < stepSize;
};

/**
 * NOTE: Do not use modulo alone to check if numbers fit evenly.
 * Due to floating point precision issues this can return incorrect results.
 * i.e. 5.1 % 0.1 = 0.09999999999999959 (should be 0)
 * tells me 5.1 / 0.1 = 50.99999999999999
 */
export const numbersFitEvenly = (
	numberOne: number,
	numberTwo: number
): boolean => {
	if (isNaN(numberOne) || isNaN(numberTwo)) return false;
	if (numberOne === 0 || numberTwo === 0) return true;

	return (
		Number.isInteger(Number((numberOne / numberTwo).toFixed(9))) ||
		numberOne % numberTwo === 0
	);
};

export function roundToDecimal(
	value: number,
	decimals: number | undefined | null
) {
	return decimals ? Math.round(value * 10 ** decimals) / 10 ** decimals : value;
}

export const roundBigNumToDecimalPlace = (
	bignum: BigNum,
	decimalPlaces: number
): BigNum => {
	const factor = Math.pow(10, decimalPlaces);
	const newNum = Math.round(bignum.toNum() * factor) / factor;
	return BigNum.fromPrint(newNum.toString(), bignum.precision);
};

export const sortRecordsByTs = <T extends { ts: BN }[]>(
	records: T | undefined,
	direction: 'asc' | 'desc' = 'desc'
) => {
	if (!records || !records?.length) return [];

	return direction === 'desc'
		? [...records].sort((a, b) => b.ts.toNumber() - a.ts.toNumber())
		: [...records].sort((a, b) => a.ts.toNumber() - b.ts.toNumber());
};

export const COMMON_MATH = {
	calculateSpreadBidAskMark,
};
