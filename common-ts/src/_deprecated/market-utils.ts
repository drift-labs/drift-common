import { getBaseAssetSymbol, getMarketConfig } from '../utils/markets/config';
import {
	getPausedOperations,
	PerpOperationsMap,
	SpotOperationsMap,
	InsuranceFundOperationsMap,
} from '../utils/markets/operations';
import {
	getMaxLeverageForMarket,
	getMaxLeverageForMarketAccount,
} from '../utils/markets/leverage';

/** @deprecated Use direct imports from '@drift-labs/common/utils/markets' */
export const MARKET_UTILS = {
	getBaseAssetSymbol,
	getPausedOperations,
	PerpOperationsMap,
	SpotOperationsMap,
	InsuranceFundOperationsMap,
	getMarketConfig,
	getMaxLeverageForMarket,
	getMaxLeverageForMarketAccount,
};
