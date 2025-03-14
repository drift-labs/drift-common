import {
	SpotMarketConfig,
	DriftEnv,
	initialize,
	PerpMarketConfig,
} from '@drift-labs/sdk';

export const Config: {
	initialized: boolean;
	spotMarketsLookup: SpotMarketConfig[];
	perpMarketsLookup: PerpMarketConfig[];
	sdkConfig: ReturnType<typeof initialize>;
} = {
	initialized: false,
	spotMarketsLookup: [],
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

	const spotMarkets = new Array(maxSpotMarketIndex);
	const markets = new Array(maxPerpMarketIndex);

	SDKConfig.SPOT_MARKETS.forEach((spotMarket) => {
		spotMarkets[spotMarket.marketIndex] = spotMarket;
	});

	SDKConfig.PERP_MARKETS.forEach((perpMarket) => {
		markets[perpMarket.marketIndex] = perpMarket;
	});

	Config.spotMarketsLookup = spotMarkets;
	Config.perpMarketsLookup = markets;

	Config.initialized = true;

	return SDKConfig;
};
