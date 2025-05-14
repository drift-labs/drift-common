import { PerpMarketConfig, SpotMarketConfig } from '@drift-labs/sdk';
import { MarketId } from './MarketId';
import { EXPONENT_POOL_ID, JLP_POOL_ID, MAIN_POOL_ID } from '../constants/misc';
import { Opaque } from '..';

type CommonMarketConfig = Pick<
	PerpMarketConfig,
	'symbol' | 'marketIndex' | 'oracle' | 'oracleSource'
>;

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

export class UIMarketConfig {
	constructor(
		readonly marketId: MarketId,
		readonly config: CommonMarketConfig
	) {}

	get marketIndex() {
		return this.config.marketIndex;
	}

	get oracle() {
		return this.config.oracle;
	}

	get oracleSource() {
		return this.config.oracleSource;
	}
}

interface UIMarketConfigDisplay {
	get marketSymbol(): MarketSymbol;
	get marketDisplaySymbol(): MarketDisplaySymbol;
	get baseAssetSymbol(): BaseAssetSymbol;
	get baseAssetDisplaySymbol(): BaseAssetDisplaySymbol;
}

export class UIPerpMarketConfig
	extends UIMarketConfig
	implements UIMarketConfigDisplay
{
	constructor(readonly baseMarketConfig: PerpMarketConfig) {
		super(
			MarketId.createPerpMarket(baseMarketConfig.marketIndex),
			baseMarketConfig
		);
	}

	get category() {
		return this.baseMarketConfig.category;
	}

	get marketSymbol(): MarketSymbol {
		return this.baseMarketConfig.symbol as MarketSymbol;
	}

	get marketDisplaySymbol(): MarketDisplaySymbol {
		return this.baseMarketConfig.symbol as MarketDisplaySymbol;
	}

	// TODO :: Improve performance by calculating this once during initialization and setting it on the class, rather than doing this every time we access it at runtime
	get baseAssetSymbol(): BaseAssetSymbol {
		return this.baseMarketConfig.baseAssetSymbol
			.replace('1K', '')
			.replace('1M', '') as BaseAssetSymbol;
	}

	get baseAssetDisplaySymbol(): BaseAssetDisplaySymbol {
		return this.baseMarketConfig.baseAssetSymbol as BaseAssetDisplaySymbol;
	}
}

export class UISpotMarketConfig
	extends UIMarketConfig
	implements UIMarketConfigDisplay
{
	constructor(readonly baseMarketConfig: SpotMarketConfig) {
		super(
			MarketId.createSpotMarket(baseMarketConfig.marketIndex),
			baseMarketConfig
		);
	}

	get mint() {
		return this.baseMarketConfig.mint;
	}

	get poolId() {
		return this.baseMarketConfig.poolId;
	}

	get marketSymbol(): MarketSymbol {
		return this.baseMarketConfig.symbol as MarketSymbol;
	}

	get precision() {
		return this.baseMarketConfig.precision;
	}

	get precisionExp() {
		return this.baseMarketConfig.precisionExp;
	}

	// TODO :: Improve performance by calculating this once during initialization and setting it on the class, rather than doing this every time we access it at runtime
	get marketDisplaySymbol(): MarketDisplaySymbol {
		switch (this.baseMarketConfig.poolId) {
			case MAIN_POOL_ID:
				return this.baseMarketConfig.symbol as MarketDisplaySymbol;
			case JLP_POOL_ID:
				return `${
					this.baseMarketConfig.symbol.split('-')[0]
				}` as MarketDisplaySymbol;
			case EXPONENT_POOL_ID: {
				/*
					Example market symbol conversions:
					PT-fragSOL-15JUN25-3 => PT-fragSOL-15JUN25
					PT-kySOL-10JUL25-3 => PT-kySOL-10JUL25
					JitoSOL-3 => JitoSOL
					JTO-3 => JTO
				*/
				return (
					this.baseMarketConfig.symbol.startsWith('PT-')
						? this.baseMarketConfig.symbol.slice(
								0,
								this.baseMarketConfig.symbol.lastIndexOf('-')
						  )
						: this.baseMarketConfig.symbol.split('-')[0]
				) as MarketDisplaySymbol;
			}
			default:
				return this.baseMarketConfig.symbol as MarketDisplaySymbol;
		}
	}

	get baseAssetSymbol(): BaseAssetSymbol {
		return this.marketDisplaySymbol as unknown as BaseAssetSymbol; // Currently no cases where SPOT baseAssetSymbol is different from marketDisplaySymbol
	}

	get baseAssetDisplaySymbol(): BaseAssetDisplaySymbol {
		switch (this.baseMarketConfig.poolId) {
			case EXPONENT_POOL_ID: {
				/*
					Example market symbol conversions:
					PT-fragSOL-15JUN25-3 => PT-fragSOL
					PT-kySOL-10JUL25-3 => PT-kySOL
					JitoSOL-3 => JitoSOL
					JTO-3 => JTO
				*/
				return (
					this.baseMarketConfig.symbol.startsWith('PT-')
						? this.baseMarketConfig.symbol.slice(
								0,
								this.baseMarketConfig.symbol.indexOf('-', 3)
						  )
						: this.baseMarketConfig.symbol.split('-')[0]
				) as BaseAssetDisplaySymbol;
			}
			default:
				return this.baseMarketConfig.symbol as BaseAssetDisplaySymbol;
		}
	}
}
