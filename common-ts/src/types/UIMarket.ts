import {
	MarketType,
	OracleSource,
	PerpMarketConfig,
	PerpMarkets,
	SpotMarkets,
	SpotMarketConfig,
	SpotMarketAccount,
	PerpMarketAccount,
	BN,
	BigNum,
	BASE_PRECISION_EXP,
	QUOTE_PRECISION_EXP,
	PRICE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { MarketId } from './MarketId';
import invariant from 'tiny-invariant';
import { MAIN_POOL_ID, USDC_SPOT_MARKET_INDEX } from '../constants';
import { ENUM_UTILS } from '../utils';
import { Config } from '../Config';
import { MarketAccount } from '../types';
import { Opaque } from '.';

const useAsyncMarketConfigs =
	process.env.NEXT_PUBLIC_USE_ASYNC_MARKET_CONFIGS === 'true';

/**
 * UniqueMarketSymbol will uniquely identify a market
 */
export type UniqueMarketSymbol = Opaque<string, 'UniqueMarketSymbol'>;
/**
 * MarketDisplayName is the label for a market that we display to a user
 */
export type MarketDisplayName = Opaque<string, 'MarketDisplayName'>;
/**
 * BaseAssetSymbol is the symbol for the underlying asset for a market
 */
export type BaseAssetSymbol = Opaque<string, 'BaseAssetSymbol'>;
/**
 * BaseAssetDisplayName is the label for the underlying asset for a market that we display to a user
 */
export type BaseAssetDisplayName = Opaque<string, 'BaseAssetDisplayName'>;

/**
 * # Examples and explanations of the symbol types:
 *
 * ## UniqueMarketSymbol:
 * These are the raw symbols in the market configs that uniquely identify a market.
 * - 1KWEN-PERP
 * - JitoSOL-3
 * - PT-fragSOL-15JUN25-3
 *
 * ## MarketDisplayName:
 * This is the symbol we use to display the market to the user.
 *
 * - 1KWEN-PERP => 1KWEN-PERP
 * - JitoSOL-3 => JitoSOL/USDC
 * - PT-fragSOL-15JUN25-3 => PT-fragSOL-15JUN25/USDC
 *
 * ## BaseAssetDisplayName:
 * This is the symbol we use to communicate "what asset they are holding".
 * - SOL-PERP => SOL
 * - 1KWEN-PERP => 1KWEN
 * - JitoSOL-3 => JitoSOL
 * - PT-fragSOL-15JUN25-3 => PT-fragSOL-15JUN25
 *
 * ## BaseAssetSymbol:
 * This is the symbol for the underlying asset for a market. I don't believe we will display this anywhere but we use these for example when looking up the market icon to use.
 *
 * - 1KWEN-PERP => WEN
 * - JitoSOL-3 => JitoSOL
 * - PT-fragSOL-15JUN25-3 => PT-fragSOL-15JUN25
 */

export abstract class UIMarket {
	private static _perpMarkets = PerpMarkets['mainnet-beta'];
	private static _spotMarkets = SpotMarkets['mainnet-beta'];

	protected _baseAssetDisplayName: BaseAssetDisplayName;
	protected _baseAssetSymbol: BaseAssetSymbol;
	protected _marketDisplayName: MarketDisplayName;
	protected _uniqueMarketSymbol: UniqueMarketSymbol;

	static get perpMarkets(): readonly PerpMarketConfig[] {
		return this._perpMarkets;
	}

	static get spotMarkets(): readonly SpotMarketConfig[] {
		return this._spotMarkets;
	}

	protected static set perpMarkets(value: PerpMarketConfig[]) {
		this._perpMarkets = value;
	}

	protected static set spotMarkets(value: SpotMarketConfig[]) {
		this._spotMarkets = value;
	}

	static perpMarketIds = PerpMarkets['mainnet-beta'].map((m) =>
		MarketId.createPerpMarket(m.marketIndex)
	);
	static spotMarketIds = SpotMarkets['mainnet-beta'].map((m) =>
		MarketId.createSpotMarket(m.marketIndex)
	);

	// Cache for market instances
	private static perpMarketCache: Map<number, PerpUIMarket> = new Map();
	private static spotMarketCache: Map<number, SpotUIMarket> = new Map();

	readonly config: SpotMarketConfig | PerpMarketConfig;
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

		const market = markets[marketIndex];

		invariant(
			market,
			`Market not found for type: ${marketId.marketTypeStr}, market index: ${marketIndex}`
		);

		this.marketId = marketId;
		this.config = markets[marketIndex];

		this.setUniqueMarketSymbols();
	}

	static setPerpMarkets(perpMarkets: PerpMarketConfig[]) {
		this.perpMarkets = [...perpMarkets].map((market) => Object.freeze(market));
		this.perpMarketIds = perpMarkets.map((m) =>
			MarketId.createPerpMarket(m.marketIndex)
		);
		this.clearCaches();
	}

	static setSpotMarkets(spotMarkets: SpotMarketConfig[]) {
		this.spotMarkets = [...spotMarkets].map((market) => Object.freeze(market));
		this.spotMarketIds = spotMarkets.map((m) =>
			MarketId.createSpotMarket(m.marketIndex)
		);
		this.clearCaches();
	}

	static create(marketIndex: number, marketType: MarketType) {
		return ENUM_UTILS.match(marketType, MarketType.PERP)
			? UIMarket.createPerpMarket(marketIndex)
			: UIMarket.createSpotMarket(marketIndex);
	}

	static createSpotMarket(marketIndex: number) {
		let market = UIMarket.spotMarketCache.get(marketIndex);
		if (!market) {
			market = new SpotUIMarket(marketIndex);
			UIMarket.spotMarketCache.set(marketIndex, market);
		}
		return market;
	}

	static createPerpMarket(marketIndex: number) {
		let market = UIMarket.perpMarketCache.get(marketIndex);
		if (!market) {
			market = new PerpUIMarket(marketIndex);
			UIMarket.perpMarketCache.set(marketIndex, market);
		}
		return market;
	}

	static fromMarketId(marketId: MarketId) {
		return marketId.isPerp
			? UIMarket.createPerpMarket(marketId.marketIndex)
			: UIMarket.createSpotMarket(marketId.marketIndex);
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

	get isUsdcMarket() {
		return this.isSpot && this.marketIndex === USDC_SPOT_MARKET_INDEX;
	}

	get isStableCoinMarket() {
		return (
			this.isSpot &&
			ENUM_UTILS.match(this.config.oracleSource, OracleSource.PYTH_STABLE_COIN)
		);
	}

	get isPredictionMarket() {
		return (
			this.isPerp &&
			UIMarket.checkIsPredictionMarket(this.config as PerpMarketConfig)
		);
	}

	equals(other: UIMarket) {
		return this.marketId.equals(other.marketId);
	}

	protected geDisplayDpFromSize(size: BN, precisionExp: BN) {
		const formattedSize = BigNum.from(size, precisionExp).prettyPrint();
		if (formattedSize.includes('.')) {
			return formattedSize.split('.')[1].length;
		}
		return 0;
	}

	abstract baseDisplayDp(marketAccount: MarketAccount): number;

	abstract priceDisplayDp(marketAccount: MarketAccount): number;

	abstract getStepSize(marketAccount: MarketAccount): BN;

	abstract getTickSize(marketAccount: MarketAccount): BN;

	getStepSizeNum(marketAccount: MarketAccount): number {
		if (this.isSpot) {
			return BigNum.from(
				(marketAccount as SpotMarketAccount).orderStepSize,
				(marketAccount as SpotMarketAccount).decimals
			).toNum();
		} else {
			return BigNum.from(
				(marketAccount as PerpMarketAccount).amm.orderStepSize,
				BASE_PRECISION_EXP
			).toNum();
		}
	}

	getTickSizeNum(marketAccount: MarketAccount): number {
		if (this.isSpot) {
			return BigNum.from(
				(marketAccount as SpotMarketAccount).orderTickSize,
				PRICE_PRECISION_EXP
			).toNum();
		} else {
			return BigNum.from(
				(marketAccount as PerpMarketAccount).amm.orderTickSize,
				PRICE_PRECISION_EXP
			).toNum();
		}
	}

	get baseAssetSymbol(): BaseAssetSymbol {
		return this._baseAssetSymbol;
	}
	get baseAssetDisplayName(): BaseAssetDisplayName {
		return this._baseAssetDisplayName;
	}
	get marketDisplayName(): MarketDisplayName {
		return this._marketDisplayName;
	}
	get uniqueMarketSymbol(): UniqueMarketSymbol {
		return this._uniqueMarketSymbol;
	}

	private setUniqueMarketSymbols() {
		this._baseAssetDisplayName = this.calcBaseAssetDisplayName();
		this._baseAssetSymbol = this.calcBaseAssetSymbol();
		this._marketDisplayName = this.calcMarketDisplayName();
		this._uniqueMarketSymbol = this.calcUniqueMarketSymbol();
	}

	protected abstract calcBaseAssetDisplayName(): BaseAssetDisplayName;
	protected abstract calcBaseAssetSymbol(): BaseAssetSymbol;
	protected abstract calcMarketDisplayName(): MarketDisplayName;
	protected abstract calcUniqueMarketSymbol(): UniqueMarketSymbol;

	// Make clearCaches private and only call it from setPerpMarkets and setSpotMarkets
	private static clearCaches() {
		UIMarket.perpMarketCache.clear();
		UIMarket.spotMarketCache.clear();
	}
}

export class PerpUIMarket extends UIMarket {
	market: PerpMarketConfig;

	constructor(marketIndex: number) {
		super(marketIndex, MarketType.PERP);
	}

	baseDisplayDp(marketAccount: PerpMarketAccount) {
		return this.geDisplayDpFromSize(
			marketAccount.amm.orderStepSize,
			BASE_PRECISION_EXP
		);
	}

	priceDisplayDp(marketAccount: PerpMarketAccount) {
		return this.geDisplayDpFromSize(
			marketAccount.amm.orderTickSize,
			QUOTE_PRECISION_EXP
		);
	}

	getStepSize(marketAccount: PerpMarketAccount) {
		return marketAccount.amm.orderStepSize;
	}

	getTickSize(marketAccount: PerpMarketAccount) {
		return marketAccount.amm.orderTickSize;
	}

	calcBaseAssetDisplayName(): BaseAssetDisplayName {
		return this.market.baseAssetSymbol as BaseAssetDisplayName;
	}

	calcBaseAssetSymbol(): BaseAssetSymbol {
		return this.market.baseAssetSymbol
			.replace('1K', '')
			.replace('1M', '') as BaseAssetSymbol;
	}

	calcMarketDisplayName(): MarketDisplayName {
		return this.market.symbol as MarketDisplayName;
	}

	calcUniqueMarketSymbol(): UniqueMarketSymbol {
		return this.market.symbol as UniqueMarketSymbol;
	}
}

export class SpotUIMarket extends UIMarket {
	market: SpotMarketConfig;

	constructor(marketIndex: number) {
		super(marketIndex, MarketType.SPOT);
	}

	baseDisplayDp(marketAccount: SpotMarketAccount) {
		return this.geDisplayDpFromSize(
			marketAccount.orderStepSize,
			this.market.precisionExp
		);
	}

	priceDisplayDp(marketAccount: SpotMarketAccount) {
		return this.geDisplayDpFromSize(
			marketAccount.orderTickSize,
			QUOTE_PRECISION_EXP
		);
	}

	getStepSize(marketAccount: SpotMarketAccount) {
		return marketAccount.orderStepSize;
	}

	getTickSize(marketAccount: SpotMarketAccount) {
		return marketAccount.orderTickSize;
	}

	calcUniqueMarketSymbol(): UniqueMarketSymbol {
		return this.market.symbol as UniqueMarketSymbol;
	}

	calcBaseAssetDisplayName(): BaseAssetDisplayName {
		const config = this.market;

		switch (config.poolId) {
			case MAIN_POOL_ID: {
				return config.symbol as BaseAssetDisplayName;
			}
			default: {
				// Just removing the last number from the end of the string.
				return config.symbol.slice(
					0,
					config.symbol.lastIndexOf('-')
				) as BaseAssetDisplayName;
			}
		}
	}

	calcBaseAssetSymbol(): BaseAssetSymbol {
		const config = this.market;

		switch (config.poolId) {
			case MAIN_POOL_ID: {
				return config.symbol as BaseAssetSymbol;
			}
			default: {
				// Just removing the last number from the end of the string.
				return config.symbol.slice(
					0,
					config.symbol.lastIndexOf('-')
				) as BaseAssetSymbol;
			}
		}
	}

	calcMarketDisplayName(): MarketDisplayName {
		const config = this.market as SpotMarketConfig;

		switch (config.poolId) {
			case MAIN_POOL_ID:
				return (config.symbol + '/USDC') as MarketDisplayName;
			default:
				return (config.symbol.slice(0, config.symbol.lastIndexOf('-')) +
					'/USDC') as MarketDisplayName;
		}
	}
}
