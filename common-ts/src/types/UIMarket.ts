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
import {
	EXPONENT_POOL_ID,
	JLP_POOL_ID,
	MAIN_POOL_ID,
	SACRED_POOL_ID,
	USDC_SPOT_MARKET_INDEX,
} from '../constants';
import { ENUM_UTILS } from '../utils';
import { Config } from '../Config';
import { MarketAccount } from '../types';
import { Opaque } from '.';

const useAsyncMarketConfigs =
	process.env.NEXT_PUBLIC_USE_ASYNC_MARKET_CONFIGS === 'true';

/**
 * MarketSymbol will uniquely identify a market
 */
export type MarketSymbol = Opaque<string, 'MarketSymbol'>;
/**
 * MarketDisplaySymbol is the label for a market that we display to a user
 */
export type MarketDisplaySymbol = Opaque<string, 'MarketDisplaySymbol'>;
/**
 * BaseAssetSymbol is the symbol for the underlying asset for a market
 */
export type BaseAssetSymbol = Opaque<string, 'BaseAssetSymbol'>;
/**
 * BaseAssetDisplaySymbol is the label for the underlying asset for a market that we display to a user
 */
export type BaseAssetDisplaySymbol = Opaque<string, 'BaseAssetDisplaySymbol'>;

/**
 * # Examples and explanations of the symbol types:
 *
 * ## MarketSymbol:
 * These are basically just the raw symbols in the market configs.
 * - 1KWEN-PERP
 * - JitoSOL-3
 * - PT-fragSOL-15JUN25-3
 *
 * ## MarketDisplaySymbol:
 * This is the symbol we use to display the market to the user. For SPOT markets it should be the exact same as the BaseAssetDisplaySymbol, but for PERP markets they might be different which is why we have this separate type.
 *
 * - 1KWEN-PERP => 1KWEN-PERP
 * - JitoSOL-3 => JitoSOL
 * - PT-fragSOL-15JUN25-3 => PT-fragSOL-15JUN25
 *
 * ## BaseAssetDisplaySymbol:
 * This is the symbol we use to communicate "what asset they are holding". For SPOT markets it should be the same as the MarketDisplaySymbol, but for PERP markets it may be different, for example we show open interest denominated in "1KWEN", while the market is "1KWEN-PERP".
 *
 * - 1KWEN-PERP => 1KWEN
 * - JitoSOL-3 => JitoSOL
 * - PT-fragSOL-15JUN25-3 => PT-fragSOL-15JUN25
 *
 * ## BaseAssetSymbol:
 * This is the symbol for the underlying asset for a market. I don't believe we will display this anywhere but we use these for example when looking up the market icon to use.
 *
 * - 1KWEN-PERP => WEN
 * - JitoSOL-3 => JitoSOL
 * - PT-fragSOL-15JUN25-3 => PT-fragSOL-15JUN25 (note: PT-fragSOL has an icon different to regular fragSOL, otherwise we would use 'fragSOL' for the base asset symbol)
 */

export abstract class UIMarket {
	private static _perpMarkets = PerpMarkets['mainnet-beta'];
	private static _spotMarkets = SpotMarkets['mainnet-beta'];

	protected _baseAssetDisplaySymbol: BaseAssetDisplaySymbol;
	protected _baseAssetSymbol: BaseAssetSymbol;
	protected _marketDisplaySymbol: MarketDisplaySymbol;
	protected _marketSymbol: MarketSymbol;

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

		const market = markets[marketIndex];

		invariant(
			market,
			`Market not found for type: ${marketId.marketTypeStr}, market index: ${marketIndex}`
		);

		this.marketId = marketId;
		this.market = markets[marketIndex];

		this.setMarketSymbols();
	}

	static setPerpMarkets(perpMarkets: PerpMarketConfig[]) {
		this.perpMarkets = perpMarkets;
		this.perpMarketIds = perpMarkets.map((m) =>
			MarketId.createPerpMarket(m.marketIndex)
		);
		this.clearCaches();
	}

	static setSpotMarkets(spotMarkets: SpotMarketConfig[]) {
		this.spotMarkets = spotMarkets;
		this.spotMarketIds = spotMarkets.map((m) =>
			MarketId.createSpotMarket(m.marketIndex)
		);
		this.clearCaches();
	}

	static create(marketIndex: number, marketType: MarketType) {
		return marketType === MarketType.PERP
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

	get marketName() {
		return `${this.market.symbol}${this.isSpot ? '/USDC' : ''}`; // TODO Remove this
	}

	get symbol() {
		return this.market.symbol; // TODO Remove this
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
	get baseAssetDisplaySymbol(): BaseAssetDisplaySymbol {
		return this._baseAssetDisplaySymbol;
	}
	get marketDisplaySymbol(): MarketDisplaySymbol {
		return this._marketDisplaySymbol;
	}
	get marketSymbol(): MarketSymbol {
		return this._marketSymbol;
	}

	private setMarketSymbols() {
		this._baseAssetDisplaySymbol = this.calcBaseAssetDisplaySymbol();
		this._baseAssetSymbol = this.calcBaseAssetSymbol();
		this._marketDisplaySymbol = this.calcMarketDisplaySymbol();
		this._marketSymbol = this.calcMarketSymbol();
	}

	protected abstract calcBaseAssetDisplaySymbol(): BaseAssetDisplaySymbol;
	protected abstract calcBaseAssetSymbol(): BaseAssetSymbol;
	protected abstract calcMarketDisplaySymbol(): MarketDisplaySymbol;
	protected abstract calcMarketSymbol(): MarketSymbol;

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

	calcBaseAssetDisplaySymbol(): BaseAssetDisplaySymbol {
		return this.market.baseAssetSymbol
			.replace('1K', '')
			.replace('1M', '') as BaseAssetDisplaySymbol;
	}

	calcBaseAssetSymbol(): BaseAssetSymbol {
		return this.market.baseAssetSymbol as BaseAssetSymbol;
	}

	calcMarketDisplaySymbol(): MarketDisplaySymbol {
		return this.market.symbol as MarketDisplaySymbol;
	}

	calcMarketSymbol(): MarketSymbol {
		return this.market.symbol as MarketSymbol;
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

	calcBaseAssetDisplaySymbol(): BaseAssetDisplaySymbol {
		const config = this.market;

		switch (config.poolId) {
			case EXPONENT_POOL_ID: {
				/*
					Example market symbol conversions:
					PT-fragSOL-15JUN25-3 => PT-fragSOL
					PT-kySOL-10JUL25-3 => PT-kySOL
					JitoSOL-3 => JitoSOL
					JTO-3 => JTO
				*/
				return (
					config.symbol.startsWith('PT-')
						? config.symbol.slice(0, config.symbol.indexOf('-', 3))
						: config.symbol.split('-')[0]
				) as BaseAssetDisplaySymbol;
			}
			default:
				return config.symbol as BaseAssetDisplaySymbol;
		}
	}

	calcBaseAssetSymbol(): BaseAssetSymbol {
		return this.marketDisplaySymbol as unknown as BaseAssetSymbol; // Currently no cases where SPOT baseAssetSymbol is different from marketDisplaySymbol
	}

	calcMarketDisplaySymbol(): MarketDisplaySymbol {
		const config = this.market as SpotMarketConfig;

		switch (config.poolId) {
			case MAIN_POOL_ID:
				return config.symbol as MarketDisplaySymbol;
			case JLP_POOL_ID:
				return `${config.symbol.split('-')[0]}` as MarketDisplaySymbol;
			case EXPONENT_POOL_ID: {
				/*
					Example market symbol conversions:
					PT-fragSOL-15JUN25-3 => PT-fragSOL-15JUN25
					PT-kySOL-10JUL25-3 => PT-kySOL-10JUL25
					JitoSOL-3 => JitoSOL
					JTO-3 => JTO
				*/
				return (
					config.symbol.startsWith('PT-')
						? config.symbol.slice(0, config.symbol.lastIndexOf('-'))
						: config.symbol.split('-')[0]
				) as MarketDisplaySymbol;
			}
			case SACRED_POOL_ID:
				return `${config.symbol.split('-')[0]}` as MarketDisplaySymbol;
			default:
				return config.symbol as MarketDisplaySymbol;
		}
	}

	calcMarketSymbol(): MarketSymbol {
		return this.market.symbol as MarketSymbol;
	}
}
