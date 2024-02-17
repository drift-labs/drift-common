import { expect } from 'chai';
import {
	EQUALITY_CHECKS,
	PropertyAndType,
} from '../../src/utils/equalityChecks';
import { BN, BigNum } from '@drift-labs/sdk';
import { OpenPosition } from '../../src/types';

//@ts-ignore
const OPEN_POSITION_SOL_LONG: OpenPosition = {
	marketIndex: 0,
	marketSymbol: 'SOL-PERP',
	direction: 'long',
	notional: new BN(100),
	baseSize: new BN(100),
	entryPrice: new BN(100),
	exitPrice: new BN(100),
	liqPrice: new BN(100),
	pnlVsOracle: new BN(100),
	pnlVsMark: new BN(100),
	quoteAssetNotionalAmount: new BN(100),
	quoteEntryAmount: new BN(100),
	unrealizedFundingPnl: new BN(100),
	lastCumulativeFundingRate: new BN(100),
	openOrders: 1,
	unsettledPnl: new BN(100),
	unsettledFundingPnl: new BN(100),
	totalUnrealizedPnl: new BN(100),
	costBasis: new BN(100),
	pnlIsClaimable: true,
	realizedPnl: new BN(100),
	lpShares: new BN(100),
};

//@ts-ignore
const OPEN_POSITION_BTC_SHORT: OpenPosition = {
	marketIndex: 1,
	marketSymbol: 'BTC-PERP',
	direction: 'short',
	notional: new BN(100),
	baseSize: new BN(100),
	entryPrice: new BN(100),
	exitPrice: new BN(100),
	liqPrice: new BN(100),
	pnlVsOracle: new BN(100),
	pnlVsMark: new BN(100),
	quoteAssetNotionalAmount: new BN(100),
	quoteEntryAmount: new BN(100),
	unrealizedFundingPnl: new BN(100),
	lastCumulativeFundingRate: new BN(100),
	openOrders: 1,
	unsettledPnl: new BN(100),
	unsettledFundingPnl: new BN(100),
	totalUnrealizedPnl: new BN(100),
	costBasis: new BN(100),
	realizedPnl: new BN(100),
	pnlIsClaimable: true,
	lpShares: new BN(100),
};

describe('Equality Checks', () => {
	describe('EQUALITY_CHECKS.arePropertiesEqual', () => {
		it('should return true for equal properties - numbers', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 1, b: 2 };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'primitive'],
				['b', 'primitive'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.true;
		});

		it('should return false for unequal properties - numbers', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 2, b: 2 };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'primitive'],
				['b', 'primitive'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.false;
		});

		it('should return true for equal properties - strings', () => {
			const obj1 = { a: 'hello', b: 'world' };
			const obj2 = { a: 'hello', b: 'world' };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'primitive'],
				['b', 'primitive'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.true;
		});

		it('should return false for unequal properties - strings', () => {
			const obj1 = { a: 'hello', b: 'world' };
			const obj2 = { a: 'goodbye', b: 'world' };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'primitive'],
				['b', 'primitive'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.false;
		});

		it('should return true for equal properties - booleans', () => {
			const obj1 = { a: true, b: false };
			const obj2 = { a: true, b: false };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'primitive'],
				['b', 'primitive'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.true;
		});

		it('should return false for unequal properties - booleans', () => {
			const obj1 = { a: true, b: false };
			const obj2 = { a: false, b: false };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'primitive'],
				['b', 'primitive'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.false;
		});

		it('should return true for equal properties - bn', () => {
			const obj1 = { a: new BN(1), b: new BN(2) };
			const obj2 = { a: new BN(1), b: new BN(2) };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'bn'],
				['b', 'bn'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.true;
		});

		it('should return false for unequal properties - bn', () => {
			const obj1 = { a: new BN(1), b: new BN(2) };
			const obj2 = { a: new BN(2), b: new BN(2) };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'bn'],
				['b', 'bn'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.false;
		});

		it('should return true for equal properties - bignum', () => {
			const obj1 = { a: new BigNum(1), b: new BigNum(2) };
			const obj2 = { a: new BigNum(1), b: new BigNum(2) };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'bignum'],
				['b', 'bignum'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.true;
		});

		it('should return false for unequal properties - bignum', () => {
			const obj1 = { a: new BigNum(1), b: new BigNum(2) };
			const obj2 = { a: new BigNum(2), b: new BigNum(2) };
			const properties: PropertyAndType<keyof typeof obj1>[] = [
				['a', 'bignum'],
				['b', 'bignum'],
			];
			expect(EQUALITY_CHECKS.arePropertiesEqual(obj1, obj2, properties)).to.be
				.false;
		});
	});

	describe('EQUALITY_CHECKS.openPosition', () => {
		it('should return true for equal open positions', () => {
			const openPosition1 = OPEN_POSITION_SOL_LONG;
			const openPosition2 = OPEN_POSITION_SOL_LONG;
			expect(EQUALITY_CHECKS.openPosition(openPosition1, openPosition2)).to.be
				.true;
		});

		it('should return false for unequal open positions', () => {
			const openPosition1 = OPEN_POSITION_SOL_LONG;
			const openPosition2 = OPEN_POSITION_BTC_SHORT;
			expect(EQUALITY_CHECKS.openPosition(openPosition1, openPosition2)).to.be
				.false;
		});
	});
});
