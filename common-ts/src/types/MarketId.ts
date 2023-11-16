import { MarketType } from '@drift-labs/sdk';
import { ENUM_UTILS } from '../utils';

export class MarketId {
	constructor(readonly marketIndex: number, readonly marketType: MarketType) {}

	static createPerpMarket(marketIndex: number) {
		return new MarketId(marketIndex, MarketType.PERP);
	}

	static createSpotMarket(marketIndex: number) {
		return new MarketId(marketIndex, MarketType.SPOT);
	}

	isSpot() {
		return ENUM_UTILS.match(this.marketType, MarketType.SPOT);
	}

	isPerp() {
		return ENUM_UTILS.match(this.marketType, MarketType.PERP);
	}

	marketTypeStr() {
		return ENUM_UTILS.toStr(this.marketType);
	}

	/**
	 * Returns a unique string that can be used as a key in a map.
	 */
	key() {
		return `${ENUM_UTILS.toStr(this.marketType)}_${this.marketIndex}`;
	}

	equals(other: MarketId) {
		return (
			this.marketType === other.marketType &&
			this.marketIndex === other.marketIndex
		);
	}
}
