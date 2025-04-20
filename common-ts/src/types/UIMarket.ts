import {
	MarketType,
	OracleSource,
	PerpMarketConfig,
	SpotMarketConfig,
} from '@drift-labs/sdk';
import { MarketId } from './MarketId';
import { USDC_SPOT_MARKET_INDEX } from '../constants';
import { ENUM_UTILS } from '../utils';
import { Config } from '../Config';

export class UIMarket {
	static perpMarkets: PerpMarketConfig[] = [];
	static spotMarkets: SpotMarketConfig[] = [];
	static perpMarketIds = Config.perpMarketsLookup.map((m) =>
		MarketId.createPerpMarket(m.marketIndex)
	);
	static spotMarketIds = Config.spotMarketsLookup.map((m) =>
		MarketId.createSpotMarket(m.marketIndex)
	);

	readonly market: SpotMarketConfig | PerpMarketConfig;
	readonly marketId: MarketId;

	constructor(readonly marketIndex: number, readonly marketType: MarketType) {
		const marketId = new MarketId(marketIndex, marketType);
		const markets = marketId.isPerp
			? UIMarket.perpMarkets
			: UIMarket.spotMarkets;

		const market = markets[marketIndex];

		if (!market) {
			console.error(
				`Market not found for type: ${marketId.marketTypeStr}, market index: ${marketIndex}`
			);
		}

		this.marketId = marketId;
		this.market = markets[marketIndex];
	}

	static setPerpMarkets(perpMarkets: PerpMarketConfig[]) {
		this.perpMarkets = perpMarkets;
		this.perpMarketIds = perpMarkets.map((m) =>
			MarketId.createPerpMarket(m.marketIndex)
		);
	}

	static setSpotMarkets(spotMarkets: SpotMarketConfig[]) {
		this.spotMarkets = spotMarkets;
		this.spotMarketIds = spotMarkets.map((m) =>
			MarketId.createSpotMarket(m.marketIndex)
		);
	}

	static createSpotMarket(marketIndex: number) {
		return new UIMarket(marketIndex, MarketType.SPOT);
	}

	static createPerpMarket(marketIndex: number) {
		return new UIMarket(marketIndex, MarketType.PERP);
	}

	static fromMarketId(marketId: MarketId) {
		return new UIMarket(marketId.marketIndex, marketId.marketType);
	}

	static checkIsPredictionMarket(marketConfig: PerpMarketConfig) {
		if (!marketConfig) return false;
		if (!(marketConfig as PerpMarketConfig).category) {
			return false;
		}

		return (marketConfig as PerpMarketConfig).category.includes('Prediction');
	}

	get isSpot() {
		return this.marketId.isSpot;
	}

	get isPerp() {
		return this.marketId.isPerp;
	}

	get marketTypeStr() {
		return this.marketId.marketTypeStr;
	}

	get key() {
		return this.marketId.key;
	}

	get marketName() {
		return `${this.market.symbol}${this.isSpot ? '/USDC' : ''}`;
	}

	get symbol() {
		return this.market.symbol;
	}

	get isUsdcMarket() {
		return this.isSpot && this.marketIndex === USDC_SPOT_MARKET_INDEX;
	}

	get isStableCoinMarket() {
		return (
			this.isSpot &&
			ENUM_UTILS.match(this.market.oracleSource, OracleSource.PYTH_STABLE_COIN)
		);
	}

	get isPredictionMarket() {
		return (
			this.isPerp &&
			UIMarket.checkIsPredictionMarket(this.market as PerpMarketConfig)
		);
	}

	equals(other: UIMarket) {
		return this.marketId.equals(other.marketId);
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
