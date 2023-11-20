import { BN, L2OrderBook } from '@drift-labs/sdk';
import { describe, expect, it } from '@jest/globals';
import COMMON_MATH from '../math';

// Mock data setup
const createBN = (value) => new BN(value);
const BASIC_L2_ORDERBOOK: Pick<L2OrderBook, 'asks' | 'bids'> = {
	bids: [
		{ price: createBN(100), size: createBN(10), sources: {} },
		{ price: createBN(120), size: createBN(15), sources: {} },
	],
	asks: [
		{ price: createBN(130), size: createBN(12), sources: {} },
		{ price: createBN(150), size: createBN(8), sources: {} },
	],
};

const EDGE_L2_ORDERBOOK_1: Pick<L2OrderBook, 'asks' | 'bids'> = {
	bids: [],
	asks: [
		{ price: createBN(130), size: createBN(12), sources: {} },
		{ price: createBN(150), size: createBN(8), sources: {} },
	],
};

const EDGE_L2_ORDERBOOK_2: Pick<L2OrderBook, 'asks' | 'bids'> = {
	bids: [],
	asks: [
		{ price: createBN(130), size: createBN(12), sources: {} },
		{ price: createBN(150), size: createBN(8), sources: {} },
	],
};

describe('COMMON_MATH Tests', () => {
	describe('calculateSpreadBidAskMark', () => {
		it('should correctly calculate spread, bid, ask, and mark', () => {
			const result = COMMON_MATH.calculateSpreadBidAskMark(BASIC_L2_ORDERBOOK);
			expect(result.bestBid).toEqual('120');
			expect(result.bestAsk).toEqual('130');
			expect(result.mark).toEqual('125');
			expect(result.spreadQuote).toEqual('10');
			expect(result.spreadPct).toEqual('800');
		});

		it('should handle edge cases', () => {
			const result_1 =
				COMMON_MATH.calculateSpreadBidAskMark(EDGE_L2_ORDERBOOK_1);
			expect(result_1.bestBid).toBeUndefined();
			expect(result_1.bestAsk).toBeUndefined();
			expect(result_1.mark).toBeUndefined();
			expect(result_1.spreadQuote).toBeUndefined();
			expect(result_1.spreadPct).toBeUndefined();

			const result_2 =
				COMMON_MATH.calculateSpreadBidAskMark(EDGE_L2_ORDERBOOK_2);
			expect(result_2.bestBid).toBeUndefined();
			expect(result_2.bestAsk).toBeUndefined();
			expect(result_2.mark).toBeUndefined();
			expect(result_2.spreadQuote).toBeUndefined();
			expect(result_2.spreadPct).toBeUndefined();
		});
	});
});
