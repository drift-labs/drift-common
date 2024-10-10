import { MarketType } from '@drift-labs/sdk';
import { ENUM_UTILS } from '../utils';
import { Opaque } from './utility';

// Define MarketKey as an opaque type
export type MarketKey = Opaque<'MarketKey', string>;

export class MarketId {
	constructor(readonly marketIndex: number, readonly marketType: MarketType) {}

	static createPerpMarket(marketIndex: number) {
		return new MarketId(marketIndex, MarketType.PERP);
	}

	static createSpotMarket(marketIndex: number) {
		return new MarketId(marketIndex, MarketType.SPOT);
	}

	static getMarketIdFromKey(key: MarketKey) {
		const [marketType, marketIndex] = key.split('_');
		return new MarketId(parseInt(marketIndex), ENUM_UTILS.toObj(marketType));
	}

	get isSpot() {
		return ENUM_UTILS.match(this.marketType, MarketType.SPOT);
	}

	get isPerp() {
		return ENUM_UTILS.match(this.marketType, MarketType.PERP);
	}

	get marketTypeStr() {
		return ENUM_UTILS.toStr(this.marketType);
	}

	/**
	 * Returns a unique string that can be used as a key in a map.
	 */
	get key() {
		return `${ENUM_UTILS.toStr(this.marketType)}_${
			this.marketIndex
		}` as MarketKey;
	}

	equals(other: MarketId) {
		return (
			ENUM_UTILS.match(this.marketType, other.marketType) &&
			this.marketIndex === other.marketIndex
		);
	}
}
