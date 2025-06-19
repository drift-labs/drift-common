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
} from '@drift-labs/sdk';
import { MarketId } from './MarketId';
import invariant from 'tiny-invariant';
import { USDC_SPOT_MARKET_INDEX } from '../constants';
import { ENUM_UTILS } from '../utils';
import { Config } from '../Config';
import { MarketAccount } from '../types';

const useAsyncMarketConfigs =
	process.env.NEXT_PUBLIC_USE_ASYNC_MARKET_CONFIGS === 'true';

export abstract class UIMarket {
	static perpMarkets = PerpMarkets['mainnet-beta'];
	static spotMarkets = SpotMarkets['mainnet-beta'];

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

	static create(marketIndex: number, marketType: MarketType) {
		return marketType === MarketType.PERP
			? new PerpUIMarket(marketIndex)
			: new SpotUIMarket(marketIndex);
	}

	static createSpotMarket(marketIndex: number) {
		return new SpotUIMarket(marketIndex);
	}

	static createPerpMarket(marketIndex: number) {
		return new PerpUIMarket(marketIndex);
	}

	static fromMarketId(marketId: MarketId) {
		return marketId.isPerp
			? new PerpUIMarket(marketId.marketIndex)
			: new SpotUIMarket(marketId.marketIndex);
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
}

export class PerpUIMarket extends UIMarket {
	constructor(marketIndex: number) {
		super(marketIndex, MarketType.PERP);
	}

	baseDisplayDp(marketAccount: PerpMarketAccount) {
		return this.geDisplayDpFromSize(
			(marketAccount as PerpMarketAccount).amm.orderStepSize,
			BASE_PRECISION_EXP
		);
	}

	priceDisplayDp(marketAccount: PerpMarketAccount) {
		return this.geDisplayDpFromSize(
			(marketAccount as PerpMarketAccount).amm.orderTickSize,
			QUOTE_PRECISION_EXP
		);
	}

	getStepSize(marketAccount: PerpMarketAccount) {
		return (marketAccount as PerpMarketAccount).amm.orderStepSize;
	}

	getTickSize(marketAccount: PerpMarketAccount) {
		return (marketAccount as PerpMarketAccount).amm.orderTickSize;
	}
}

export class SpotUIMarket extends UIMarket {
	constructor(marketIndex: number) {
		super(marketIndex, MarketType.SPOT);
	}

	baseDisplayDp(marketAccount: SpotMarketAccount) {
		return this.geDisplayDpFromSize(
			(marketAccount as SpotMarketAccount).orderStepSize,
			(this.market as SpotMarketConfig).precisionExp
		);
	}

	priceDisplayDp(marketAccount: SpotMarketAccount) {
		return this.geDisplayDpFromSize(
			(marketAccount as SpotMarketAccount).orderTickSize,
			QUOTE_PRECISION_EXP
		);
	}

	getStepSize(marketAccount: SpotMarketAccount) {
		return (marketAccount as SpotMarketAccount).orderStepSize;
	}

	getTickSize(marketAccount: SpotMarketAccount) {
		return (marketAccount as SpotMarketAccount).orderTickSize;
	}
}
