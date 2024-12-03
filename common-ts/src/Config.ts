import {
	SpotMarketConfig,
	DriftEnv,
	initialize,
	PerpMarketConfig,
} from '@drift-labs/sdk';
import { JLP_POOL_ID, MAIN_POOL_ID } from './constants';

export const Config: {
	initialized: boolean;
	spotMarketsLookup: SpotMarketConfig[];
	jlpSpotMarketsLookup: SpotMarketConfig[];
	perpMarketsLookup: PerpMarketConfig[];
	sdkConfig: ReturnType<typeof initialize>;
} = {
	initialized: false,
	spotMarketsLookup: [],
	jlpSpotMarketsLookup: [],
	perpMarketsLookup: [],
	sdkConfig: undefined,
};

export const Initialize = (env: DriftEnv) => {
	const SDKConfig = initialize({ env });

	const maxSpotMarketIndex = Math.max(
		...SDKConfig.SPOT_MARKETS.map((market) => market.marketIndex)
	);

	const maxPerpMarketIndex = Math.max(
		...SDKConfig.PERP_MARKETS.map((market) => market.marketIndex)
	);

	const jlpSpotMarkets = new Array(maxSpotMarketIndex);
	const spotMarkets = new Array(maxSpotMarketIndex);
	const markets = new Array(maxPerpMarketIndex);

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
