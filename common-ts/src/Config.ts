import {
	SpotMarketConfig,
	DriftEnv,
	initialize,
	PerpMarketConfig,
} from '@drift-labs/sdk';
import { JLP_POOL_ID, MAIN_POOL_ID } from './constants';

export const Config: {
	initialized: boolean;
	spotMarketsLookup: Record<number, SpotMarketConfig>;
	jlpSpotMarketsLookup: Record<number, SpotMarketConfig>;
	perpMarketsLookup: Record<number, PerpMarketConfig>;
	sdkConfig: ReturnType<typeof initialize>;
} = {
	initialized: false,
	spotMarketsLookup: {},
	jlpSpotMarketsLookup: {},
	perpMarketsLookup: {},
	sdkConfig: undefined,
};

export const Initialize = (env: DriftEnv) => {
	const SDKConfig = initialize({ env });

	const jlpSpotMarkets = {};
	const spotMarkets = {};
	const markets = {};

	SDKConfig.SPOT_MARKETS.filter(
		(market) => market.poolId === MAIN_POOL_ID
	).forEach((spotMarket) => {
		spotMarkets[spotMarket.marketIndex] = spotMarket;
	});

	SDKConfig.SPOT_MARKETS.filter(
		(market) => market.poolId === JLP_POOL_ID
	).forEach((spotMarket) => {
		jlpSpotMarkets[spotMarket.marketIndex] = spotMarket;
	});

	SDKConfig.PERP_MARKETS.forEach((perpMarket) => {
		markets[perpMarket.marketIndex] = perpMarket;
	});

	Config.spotMarketsLookup = spotMarkets;
	Config.jlpSpotMarketsLookup = jlpSpotMarkets;
	Config.perpMarketsLookup = markets;

	Config.initialized = true;
};
