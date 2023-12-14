import { BN, PRICE_PRECISION, PositionDirection } from '@drift-labs/sdk';
import { COMMON_UI_UTILS } from '@drift/common';
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
				auctionStartPriceOffset: 0.05,
				auctionEndPriceOffset: 0.05,
			});
			expect(result.auctionDuration).to.equal(20);
			expect(result.auctionStartPrice.toString()).to.equal('99950000');
			expect(result.auctionEndPrice.toString()).to.equal('103000000');
		});

		// todo - more tests
	});
});
