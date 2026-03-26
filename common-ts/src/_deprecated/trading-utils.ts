import {
	calculatePnlPctFromPosition,
	calculatePotentialProfit,
} from '../utils/trading/pnl';
import { calculateLiquidationPriceAfterPerpTrade } from '../utils/trading/liquidation';
import { checkIsMarketOrderType } from '../utils/trading/price';
import {
	convertLeverageToMarginRatio,
	convertMarginRatioToLeverage,
	getMarginUsedForPosition,
	validateLeverageChange,
} from '../utils/trading/leverage';
import {
	getMarketTickSize,
	getMarketTickSizeDecimals,
	getMarketStepSize,
	getMarketStepSizeDecimals,
	isEntirePositionOrder,
	getMaxLeverageOrderSize,
	formatOrderSize,
} from '../utils/trading/size';

/** @deprecated Use direct imports from '@drift-labs/common/utils/trading' */
export const TRADING_UTILS = {
	calculatePnlPctFromPosition,
	calculatePotentialProfit,
	calculateLiquidationPriceAfterPerpTrade,
	checkIsMarketOrderType,
	convertLeverageToMarginRatio,
	convertMarginRatioToLeverage,
	getMarketTickSize,
	getMarketTickSizeDecimals,
	getMarketStepSize,
	getMarketStepSizeDecimals,
	isEntirePositionOrder,
	getMaxLeverageOrderSize,
	formatOrderSize,
	getMarginUsedForPosition,
	validateLeverageChange,
};
