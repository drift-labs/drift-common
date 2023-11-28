import { BN, L2OrderBook } from '@drift-labs/sdk';
import COMMON_MATH from '../../src/utils/math';
import { expect } from 'chai';

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
			expect(result.bestBidPrice?.toString()).to.equal('120');
			expect(result.bestAskPrice?.toString()).to.equal('130');
			expect(result.markPrice?.toString()).to.equal('125');
			expect(result.spreadQuote?.toString()).to.equal('10');
			expect(result.spreadPct?.toString()).to.equal('80000'); // (spread / mark * percentage_precision) => (10 / 125) * 10^6 => 80_000
		});

		it('should handle edge cases', () => {
			const result_1 =
				COMMON_MATH.calculateSpreadBidAskMark(EDGE_L2_ORDERBOOK_1);
			expect(result_1.bestBidPrice).to.be.undefined;
			expect(result_1.bestAskPrice).to.be.undefined;
			expect(result_1.markPrice).to.be.undefined;
			expect(result_1.spreadQuote).to.be.undefined;
			expect(result_1.spreadPct).to.be.undefined;

			const result_2 =
				COMMON_MATH.calculateSpreadBidAskMark(EDGE_L2_ORDERBOOK_2);
			expect(result_2.bestBidPrice).to.be.undefined;
			expect(result_2.bestAskPrice).to.be.undefined;
			expect(result_2.markPrice).to.be.undefined;
			expect(result_2.spreadQuote).to.be.undefined;
			expect(result_2.spreadPct).to.be.undefined;
		});
	});
});
