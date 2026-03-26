import { BN, L2OrderBook } from '@drift-labs/sdk';
import {
	numbersFitEvenly,
	roundToStepSizeIfLargeEnough,
	sortBnAsc,
	sortBnDesc,
	truncateInputToPrecision,
	valueIsBelowStepSize,
} from '../../src/utils/math/index';
import { COMMON_MATH } from '../../src/_deprecated/common-math';
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
			expect(result.spreadPct?.toString()).to.equal('8000000'); // ((spread / mark) * 100 * percentage_precision) => (10 / 125) * 100 * 10^6 => 0.08 * 100 * 10^6 => 8_000_000
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

describe('numbersFitEvenly', () => {
	it('detects evenly divisible cases with floats', () => {
		expect(numbersFitEvenly(5.1, 0.1)).to.equal(true);
		expect(numbersFitEvenly(5, 2)).to.equal(false);
		expect(numbersFitEvenly(0, 7)).to.equal(true);
	});
});

describe('BN sorting', () => {
	it('sortBnAsc and sortBnDesc compare big numbers correctly', () => {
		const a = new BN(5);
		const b = new BN(10);
		expect(sortBnAsc(a, b)).to.equal(-1);
		expect(sortBnAsc(b, a)).to.equal(1);
		expect(sortBnAsc(a, a)).to.equal(0);
		expect(sortBnDesc(a, b)).to.equal(1);
		expect(sortBnDesc(b, a)).to.equal(-1);
	});
});

describe('step/truncation utilities', () => {
	it('roundToStepSizeIfLargeEnough truncates to step decimals without rounding', () => {
		expect(roundToStepSizeIfLargeEnough('1.23456', 0.01)).to.equal('1.23');
		expect(roundToStepSizeIfLargeEnough('0.0000001', 0.01)).to.equal('0.00');
	});

	it('truncateInputToPrecision slices extra decimals', () => {
		expect(truncateInputToPrecision('123.4567', new BN(2))).to.equal('123.45');
		expect(truncateInputToPrecision('123', new BN(2))).to.equal('123');
	});

	it('valueIsBelowStepSize compares numeric values', () => {
		expect(valueIsBelowStepSize('0.009', 0.01)).to.equal(true);
		expect(valueIsBelowStepSize('0.01', 0.01)).to.equal(false);
	});
});
