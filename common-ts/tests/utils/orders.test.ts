import {
	BASE_PRECISION,
	BN,
	BigNum,
	MarketType,
	OrderType,
	PRICE_PRECISION,
	PRICE_PRECISION_EXP,
	PositionDirection,
} from '@drift-labs/sdk';
import { COMMON_UI_UTILS } from '../../src/common-ui-utils/commonUiUtils';
import { ENUM_UTILS } from '../../src';
import { expect } from 'chai';

describe('COMMON_UI_UTILS OrderParams Tests', () => {
	describe('getMarketAuctionParams', () => {
		it('should correctly generate params for long', () => {
			const result = COMMON_UI_UTILS.getMarketAuctionParams({
				direction: PositionDirection.LONG,
				startPriceFromSettings: new BN(100).mul(PRICE_PRECISION),
				worstPrice: new BN(105).mul(PRICE_PRECISION),
				limitPrice: new BN(103).mul(PRICE_PRECISION),
				duration: 20,
				marketTickSize: new BN(1),
				auctionStartPriceOffset: -0.05,
				auctionEndPriceOffset: 0.05,
			});

			expect(result.auctionStartPrice.toString()).to.equal('99950000');
			expect(result.auctionEndPrice.toString()).to.equal('103000000');
		});

		it('should correctly generate params for short', () => {
			const result = COMMON_UI_UTILS.getMarketAuctionParams({
				direction: PositionDirection.SHORT,
				startPriceFromSettings: new BN(100).mul(PRICE_PRECISION),
				worstPrice: new BN(95).mul(PRICE_PRECISION),
				limitPrice: new BN(97).mul(PRICE_PRECISION),
				duration: 20,
				marketTickSize: new BN(1),
				auctionStartPriceOffset: -0.05,
				auctionEndPriceOffset: 0.05,
			});

			expect(result.auctionStartPrice.toString()).to.equal('100050000');
			expect(result.auctionEndPrice.toString()).to.equal('97000000');
		});
	});

	describe('getLimitAuctionParams', () => {
		it('should correctly generate params for long', () => {
			const result = COMMON_UI_UTILS.getLimitAuctionParams({
				direction: PositionDirection.LONG,
				inputPrice: BigNum.from(
					new BN(108).mul(PRICE_PRECISION),
					PRICE_PRECISION_EXP
				),
				startPriceFromSettings: new BN(100).mul(PRICE_PRECISION),
				duration: 60,
				auctionStartPriceOffset: -0.05,
			});

			expect(result.auctionStartPrice.toString()).to.equal('99946000');
			expect(result.auctionEndPrice.toString()).to.equal('108000000');
		});

		it('should correctly generate params for short', () => {
			const result = COMMON_UI_UTILS.getLimitAuctionParams({
				direction: PositionDirection.SHORT,
				inputPrice: BigNum.from(
					new BN(92).mul(PRICE_PRECISION),
					PRICE_PRECISION_EXP
				),
				startPriceFromSettings: new BN(100).mul(PRICE_PRECISION),
				duration: 60,
				auctionStartPriceOffset: -0.05,
			});

			expect(result.auctionStartPrice.toString()).to.equal('100046000');
			expect(result.auctionEndPrice.toString()).to.equal('92000000');
		});

		it('should not generate any auction params for long if limit price is lower than startPriceForSettings', () => {
			const result = COMMON_UI_UTILS.getLimitAuctionParams({
				direction: PositionDirection.LONG,
				inputPrice: BigNum.from(
					new BN(92).mul(PRICE_PRECISION),
					PRICE_PRECISION_EXP
				),
				startPriceFromSettings: new BN(100).mul(PRICE_PRECISION),
				duration: 60,
				auctionStartPriceOffset: -0.05,
			});

			expect(result.auctionDuration).to.be.undefined;
			expect(result.auctionStartPrice?.toString()).to.be.undefined;
			expect(result.auctionEndPrice?.toString()).to.be.undefined;
		});

		it('should not generate any auction params for short if limit price is higher than startPriceFromSettings', () => {
			const result = COMMON_UI_UTILS.getLimitAuctionParams({
				direction: PositionDirection.SHORT,
				inputPrice: BigNum.from(
					new BN(108).mul(PRICE_PRECISION),
					PRICE_PRECISION_EXP
				),
				startPriceFromSettings: new BN(100).mul(PRICE_PRECISION),
				duration: 60,
				auctionStartPriceOffset: -0.05,
			});

			expect(result.auctionDuration).to.be.undefined;
			expect(result.auctionStartPrice?.toString()).to.be.undefined;
			expect(result.auctionEndPrice?.toString()).to.be.undefined;
		});
	});

	describe('deriveMarketOrderParams', () => {
		it('should correctly generate params for LONG oracle order when oracle > est entry', () => {
			const result = COMMON_UI_UTILS.deriveMarketOrderParams({
				marketType: MarketType.PERP,
				marketIndex: 0,
				direction: PositionDirection.LONG,
				maxLeverageSelected: false,
				maxLeverageOrderSize: new BN(1000).mul(BASE_PRECISION),
				baseAmount: new BN(1).mul(BASE_PRECISION),
				reduceOnly: false,
				allowInfSlippage: false,
				bestPrice: new BN(99).mul(PRICE_PRECISION),
				entryPrice: new BN(100).mul(PRICE_PRECISION),
				oraclePrice: new BN(108).mul(PRICE_PRECISION),
				worstPrice: new BN(105).mul(PRICE_PRECISION),
				limitPrice: new BN(103).mul(PRICE_PRECISION),
				auctionDuration: 20,
				marketTickSize: new BN(1),
				auctionStartPriceOffset: -0.05,
				auctionEndPriceOffset: 0.05,
				auctionStartPriceOffsetFrom: 'entry',
				isOracleOrder: true,
			});

			expect(ENUM_UTILS.toStr(result.orderType)).to.equal(
				ENUM_UTILS.toStr(OrderType.ORACLE)
			);
			expect(result.auctionStartPrice?.toString()).to.equal('-8050000');
			expect(result.auctionEndPrice?.toString()).to.equal('-5000000');
		});

		it('should correctly generate params for LONG oracle order when oracle < est entry', () => {
			const result = COMMON_UI_UTILS.deriveMarketOrderParams({
				marketType: MarketType.PERP,
				marketIndex: 0,
				direction: PositionDirection.LONG,
				maxLeverageSelected: false,
				maxLeverageOrderSize: new BN(1000).mul(BASE_PRECISION),
				baseAmount: new BN(1).mul(BASE_PRECISION),
				reduceOnly: false,
				allowInfSlippage: false,
				bestPrice: new BN(99).mul(PRICE_PRECISION),
				entryPrice: new BN(100).mul(PRICE_PRECISION),
				oraclePrice: new BN(92).mul(PRICE_PRECISION),
				worstPrice: new BN(105).mul(PRICE_PRECISION),
				limitPrice: new BN(103).mul(PRICE_PRECISION),
				auctionDuration: 20,
				marketTickSize: new BN(1),
				auctionStartPriceOffset: -0.05,
				auctionEndPriceOffset: 0.05,
				auctionStartPriceOffsetFrom: 'entry',
				isOracleOrder: true,
			});

			expect(ENUM_UTILS.toStr(result.orderType)).to.equal(
				ENUM_UTILS.toStr(OrderType.ORACLE)
			);
			expect(result.auctionStartPrice?.toString()).to.equal('7950000');
			expect(result.auctionEndPrice?.toString()).to.equal('11000000');
		});

		it('should correctly generate params for SHORT oracle order when oracle < est entry', () => {
			const result = COMMON_UI_UTILS.deriveMarketOrderParams({
				marketType: MarketType.PERP,
				marketIndex: 0,
				direction: PositionDirection.SHORT,
				maxLeverageSelected: false,
				maxLeverageOrderSize: new BN(1000).mul(BASE_PRECISION),
				baseAmount: new BN(1).mul(BASE_PRECISION),
				reduceOnly: false,
				allowInfSlippage: false,
				bestPrice: new BN(101).mul(PRICE_PRECISION),
				entryPrice: new BN(100).mul(PRICE_PRECISION),
				oraclePrice: new BN(92).mul(PRICE_PRECISION),
				worstPrice: new BN(95).mul(PRICE_PRECISION),
				limitPrice: new BN(98).mul(PRICE_PRECISION),
				auctionDuration: 20,
				marketTickSize: new BN(1),
				auctionStartPriceOffset: -0.05,
				auctionEndPriceOffset: 0.05,
				auctionStartPriceOffsetFrom: 'entry',
				isOracleOrder: true,
			});

			expect(ENUM_UTILS.toStr(result.orderType)).to.equal(
				ENUM_UTILS.toStr(OrderType.ORACLE)
			);
			expect(result.auctionStartPrice?.toString()).to.equal('8050000');
			expect(result.auctionEndPrice?.toString()).to.equal('6000000');
		});

		it('should correctly generate params for SHORT oracle order when oracle > est entry', () => {
			const result = COMMON_UI_UTILS.deriveMarketOrderParams({
				marketType: MarketType.PERP,
				marketIndex: 0,
				direction: PositionDirection.SHORT,
				maxLeverageSelected: false,
				maxLeverageOrderSize: new BN(1000).mul(BASE_PRECISION),
				baseAmount: new BN(1).mul(BASE_PRECISION),
				reduceOnly: false,
				allowInfSlippage: false,
				bestPrice: new BN(101).mul(PRICE_PRECISION),
				entryPrice: new BN(100).mul(PRICE_PRECISION),
				oraclePrice: new BN(108).mul(PRICE_PRECISION),
				worstPrice: new BN(95).mul(PRICE_PRECISION),
				limitPrice: new BN(98).mul(PRICE_PRECISION),
				auctionDuration: 20,
				marketTickSize: new BN(1),
				auctionStartPriceOffset: -0.05,
				auctionEndPriceOffset: 0.05,
				auctionStartPriceOffsetFrom: 'entry',
				isOracleOrder: true,
			});

			expect(ENUM_UTILS.toStr(result.orderType)).to.equal(
				ENUM_UTILS.toStr(OrderType.ORACLE)
			);
			expect(result.auctionStartPrice?.toString()).to.equal('-7950000');
			expect(result.auctionEndPrice?.toString()).to.equal('-10000000');
		});
	});
});
