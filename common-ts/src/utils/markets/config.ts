import {
	DriftEnv,
	MarketType,
	PerpMarketConfig,
	PerpMarkets,
	SpotMarketConfig,
	SpotMarkets,
} from '@drift-labs/sdk';
import { ENUM_UTILS } from '../enum';

const getBaseAssetSymbol = (marketName: string, removePrefix = false) => {
	let baseAssetSymbol = marketName.replace('-PERP', '').replace('/USDC', '');

	if (removePrefix) {
		baseAssetSymbol = baseAssetSymbol.replace('1K', '').replace('1M', '');
	}

	return baseAssetSymbol;
};

function getMarketConfig(
	driftEnv: DriftEnv,
	marketType: typeof MarketType.PERP,
	marketIndex: number
): PerpMarketConfig;
function getMarketConfig(
	driftEnv: DriftEnv,
	marketType: typeof MarketType.SPOT,
	marketIndex: number
): SpotMarketConfig;
function getMarketConfig(
	driftEnv: DriftEnv,
	marketType: MarketType,
	marketIndex: number
): PerpMarketConfig | SpotMarketConfig {
	const isPerp = ENUM_UTILS.match(marketType, MarketType.PERP);

	if (isPerp) {
		return PerpMarkets[driftEnv][marketIndex];
	} else {
		return SpotMarkets[driftEnv][marketIndex];
	}
}

export { getBaseAssetSymbol, getMarketConfig };
