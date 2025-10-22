import { BN, L2OrderBook, PERCENTAGE_PRECISION, ZERO } from '@drift-labs/sdk';

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

export const COMMON_MATH = {
	calculateSpreadBidAskMark,
};
