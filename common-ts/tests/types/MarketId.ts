import { expect } from 'chai';
import { MarketId } from '../../src/types/MarketId';
import { MarketType } from '@drift-labs/sdk';

describe('MarketId', () => {
	it('should create a perp market', () => {
		const marketId = MarketId.createPerpMarket(1);
		expect(marketId.marketIndex).to.equal(1);
		expect(marketId.marketType).to.equal(MarketType.PERP);
	});

	it('should create a spot market', () => {
		const marketId = MarketId.createSpotMarket(2);
		expect(marketId.marketIndex).to.equal(2);
		expect(marketId.marketType).to.equal(MarketType.SPOT);
	});

	it('should correctly identify a spot market', () => {
		const marketId = MarketId.createSpotMarket(2);
		expect(marketId.isSpot).to.be.true;
		expect(marketId.isPerp).to.be.false;
	});

	it('should correctly identify a perp market', () => {
		const marketId = MarketId.createPerpMarket(1);
		expect(marketId.isPerp).to.be.true;
		expect(marketId.isSpot).to.be.false;
	});

	it('should return the correct perp market string', () => {
		const marketId = MarketId.createPerpMarket(1);
		expect(marketId.marketTypeStr).to.equal('perp');
	});

	it('should return the correct spot market string', () => {
		const marketId = MarketId.createSpotMarket(2);
		expect(marketId.marketTypeStr).to.equal('spot');
	});

	it('should return a unique key created from its market index and market type', () => {
		const randomIndex = Math.floor(Math.random() * 1000);
		const marketId = MarketId.createSpotMarket(randomIndex);
		expect(marketId.key).to.equal(`spot_${randomIndex}`);
	});
});
