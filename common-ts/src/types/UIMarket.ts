import {
	MarketType,
	OracleSource,
	PerpMarketConfig,
	PerpMarkets,
	SpotMarkets,
	SpotMarketConfig,
} from '@drift-labs/sdk';
import { MarketId } from './MarketId';
import invariant from 'tiny-invariant';
import { USDC_SPOT_MARKET_INDEX } from '../constants';
import { ENUM_UTILS } from '../utils';
import { Config } from '../Config';

const useAsyncMarketConfigs =
	process.env.NEXT_PUBLIC_USE_ASYNC_MARKET_CONFIGS === 'true';

export class UIMarket {
	static perpMarkets = PerpMarkets['mainnet-beta'];
	static spotMarkets = SpotMarkets['mainnet-beta'];
	private static cache = new Map<string, UIMarket>();

	readonly market: SpotMarketConfig | PerpMarketConfig;
	readonly marketId: MarketId;

	constructor(readonly marketIndex: number, readonly marketType: MarketType) {
		const marketId = new MarketId(marketIndex, marketType);
		const perpMarkets = useAsyncMarketConfigs
			? UIMarket.perpMarkets
			: Config.perpMarketsLookup;
		const spotMarkets = useAsyncMarketConfigs
			? UIMarket.spotMarkets
			: Config.spotMarketsLookup;
		const markets = marketId.isPerp ? perpMarkets : spotMarkets;

		//@ts-ignore
		const market = markets.find((m) => m.marketIndex === marketIndex);

		// TODO: should we purposely throw an error here? Or construct a default market?
		invariant(
			market,
			`Market not found for type: ${marketId.marketTypeStr}, market index: ${marketIndex}`
		);

		this.marketId = marketId;
		this.market = market;
	}

	static setPerpMarkets(perpMarkets: PerpMarketConfig[]) {
		this.perpMarkets = perpMarkets;
	}

	static setSpotMarkets(spotMarkets: SpotMarketConfig[]) {
		this.spotMarkets = spotMarkets;
	}

	private static getOrCreate(marketIndex: number, marketType: MarketType) {
		const key = MarketId.key(marketIndex, marketType);
		if (UIMarket.cache.has(key)) {
			return UIMarket.cache.get(key)!;
		}
		const market = new UIMarket(marketIndex, marketType);
		UIMarket.cache.set(key, market);
		return market;
	}

	static createSpotMarket(marketIndex: number) {
		return UIMarket.getOrCreate(marketIndex, MarketType.SPOT);
	}

	static createPerpMarket(marketIndex: number) {
		return UIMarket.getOrCreate(marketIndex, MarketType.PERP);
	}

	static fromMarketId(marketId: MarketId) {
		return UIMarket.getOrCreate(marketId.marketIndex, marketId.marketType);
	}

	static checkIsPredictionMarket(marketConfig: PerpMarketConfig) {
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
