import { BN, L2OrderBook, PERCENTAGE_PRECISION } from '@drift-labs/sdk';

const calculateMarkPrice = (bestBidPrice: BN, bestAskPrice: BN) => {
	return bestBidPrice.add(bestAskPrice).divn(2);
};

const calculateBidAskAndmarkPrice = (l2: L2OrderBook) => {
	const bestBidPrice = l2.bids.reduce((previousMax, currentBid) => {
		if (!previousMax) return currentBid.price;
		return BN.max(currentBid.price, previousMax);
	}, undefined as BN);

	const bestAskPrice = l2.asks.reduce((previousMin, currentBid) => {
		if (!previousMin) return currentBid.price;
		return BN.min(currentBid.price, previousMin);
	}, undefined as BN);

	const markPrice = calculateMarkPrice(bestBidPrice, bestAskPrice);

	return {
		bestBidPrice,
		bestAskPrice,
		markPrice,
	};
};

const calculateSpreadQuote = (bestBidPrice: BN, bestAskPrice: BN) => {
	return bestBidPrice.sub(bestAskPrice).abs();
};

function calculateSpreadPct(markPricePrice: BN, spreadQuote: BN) {
	return spreadQuote.mul(PERCENTAGE_PRECISION).div(markPricePrice);
}

const calculateSpread = (bestBidPrice: BN, bestAskPrice: BN, markPrice: BN) => {
	const spreadQuote = calculateSpreadQuote(bestBidPrice, bestAskPrice);
	const spreadPct = calculateSpreadPct(markPrice, spreadQuote);

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
			markPrice: undefined,
			bestBidPrice: undefined,
			bestAskPrice: undefined,
		};
	}

	const { bestBidPrice, bestAskPrice, markPrice } =
		calculateBidAskAndmarkPrice(l2);
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
