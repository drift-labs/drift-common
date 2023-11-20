import { BN, L2OrderBook, PERCENTAGE_PRECISION } from '@drift-labs/sdk';

// TODO : Unit Tests

const calculateMark = (bestBid: BN, bestAsk: BN) => {
	return bestBid.add(bestAsk).divn(2);
};

const calculateBidAskAndMark = (l2: L2OrderBook) => {
	const bestBid = l2.bids.reduce((previousMax, currentBid) => {
		if (!previousMax) return currentBid.price;
		return BN.max(currentBid.price, previousMax);
	}, undefined as BN);

	const bestAsk = l2.asks.reduce((previousMin, currentBid) => {
		if (!previousMin) return currentBid.price;
		return BN.min(currentBid.price, previousMin);
	}, undefined as BN);

	const mark = calculateMark(bestBid, bestAsk);

	return {
		bestBid,
		bestAsk,
		mark,
	};
};

const calculateSpreadQuote = (bestBid: BN, bestAsk: BN) => {
	return bestBid.sub(bestAsk).abs();
};

function calculateSpreadPct(markPrice: BN, spreadQuote: BN) {
	return spreadQuote.mul(PERCENTAGE_PRECISION).div(markPrice);
}

const calculateSpread = (bestBid: BN, bestAsk: BN, mark: BN) => {
	const spreadQuote = calculateSpreadQuote(bestBid, bestAsk);
	const spreadPct = calculateSpreadPct(mark, spreadQuote);

	return {
		spreadPct,
		spreadQuote,
	};
};

const calculateSpreadBidAskMark = (l2: Pick<L2OrderBook, 'bids' | 'asks'>) => {
	if (l2.asks.length === 0 || l2.bids.length === 0) {
		return {
			spreadQuote: undefined,
			spreadPct: undefined,
			mark: undefined,
			bestBid: undefined,
			bestAsk: undefined,
		};
	}

	const { bestBid, bestAsk, mark } = calculateBidAskAndMark(l2);
	const { spreadPct, spreadQuote } = calculateSpread(bestBid, bestAsk, mark);
	return {
		bestBid,
		bestAsk,
		mark,
		spreadPct,
		spreadQuote,
	};
};

const COMMON_MATH = {
	calculateSpreadBidAskMark,
};

export default COMMON_MATH;
