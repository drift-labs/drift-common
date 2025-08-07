import {
	DriftEnv,
	MarketType,
	PerpMarketConfig,
	PerpMarkets,
	SpotMarketConfig,
	SpotMarkets,
} from '@drift-labs/sdk';
import { ENUM_UTILS } from 'src/utils';

export function getMarketConfig(
	driftEnv: DriftEnv,
	marketType: typeof MarketType.PERP,
	marketIndex: number
): PerpMarketConfig;
export function getMarketConfig(
	driftEnv: DriftEnv,
	marketType: typeof MarketType.SPOT,
	marketIndex: number
): SpotMarketConfig;
export function getMarketConfig(
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
