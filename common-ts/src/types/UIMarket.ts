import {
	MarketType,
	PerpMarketConfig,
	SpotMarketConfig,
} from '@drift-labs/sdk';
import { MarketId } from './MarketId';
import { Config } from '../Config';
import invariant from 'tiny-invariant';

export class UIMarket {
	readonly market: SpotMarketConfig | PerpMarketConfig;
	readonly marketId: MarketId;

	constructor(readonly marketIndex: number, readonly marketType: MarketType) {
		const marketId = new MarketId(marketIndex, marketType);
		const markets = marketId.isPerp()
			? Config.perpMarketsLookup
			: Config.spotMarketsLookup;

		const market = markets[marketIndex];

		invariant(
			market,
			`Market not found for type: ${marketId.marketTypeStr()}, market index: ${marketIndex}`
		);

		this.marketId = marketId;
		this.market = markets[marketIndex];
	}

	static createSpotMarket(marketIndex: number) {
		return new UIMarket(marketIndex, MarketType.SPOT);
	}

	static createPerpMarket(marketIndex: number) {
		return new UIMarket(marketIndex, MarketType.PERP);
	}

	get isSpot() {
		return this.marketId.isSpot();
	}

	get isPerp() {
		return this.marketId.isPerp();
	}

	get marketTypeStr() {
		return this.marketId.marketTypeStr();
	}

	get key() {
		return this.marketId.key();
	}

	get marketName() {
		return `${this.market.symbol}${this.isSpot ? '/USDC' : ''}`;
	}

	get symbol() {
		return this.market.symbol;
	}

	baseAssetSymbol(removePrefix = false) {
		let baseAssetSymbol = this.isPerp
			? (this.market as PerpMarketConfig).baseAssetSymbol
			: this.market.symbol;

		if (removePrefix) {
			baseAssetSymbol = baseAssetSymbol.replace('1K', '').replace('1M', '');
		}

		return baseAssetSymbol;
	}
}
