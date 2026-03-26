import {
	DriftClient,
	MarketType,
	PerpMarketAccount,
	SpotMarketAccount,
} from '@drift-labs/sdk';
import { ENUM_UTILS } from '../enum';
import { DEFAULT_MAX_MARKET_LEVERAGE } from '../../constants/markets';

const getMaxLeverageForMarketAccount = (
	marketType: MarketType,
	marketAccount: PerpMarketAccount | SpotMarketAccount
): {
	maxLeverage: number;
	highLeverageMaxLeverage: number;
	hasHighLeverage: boolean;
} => {
	const isPerp = ENUM_UTILS.match(marketType, MarketType.PERP);

	try {
		if (isPerp) {
			const perpMarketAccount = marketAccount as PerpMarketAccount;

			const maxLeverage = parseFloat(
				(
					1 /
					((perpMarketAccount?.marginRatioInitial
						? perpMarketAccount.marginRatioInitial
						: 10000 / DEFAULT_MAX_MARKET_LEVERAGE) /
						10000)
				).toFixed(2)
			);

			const marketHasHighLeverageMode =
				!!perpMarketAccount?.highLeverageMarginRatioInitial;

			const highLeverageMaxLeverage = marketHasHighLeverageMode
				? parseFloat(
						(
							1 /
							((perpMarketAccount?.highLeverageMarginRatioInitial
								? perpMarketAccount?.highLeverageMarginRatioInitial
								: 10000 / DEFAULT_MAX_MARKET_LEVERAGE) /
								10000)
						).toFixed(1)
				  )
				: 0;

			return {
				maxLeverage,
				highLeverageMaxLeverage,
				hasHighLeverage: marketHasHighLeverageMode,
			};
		} else {
			const spotMarketAccount = marketAccount as SpotMarketAccount;

			const liabilityWeight = spotMarketAccount
				? spotMarketAccount.initialLiabilityWeight / 10000
				: 0;

			return {
				maxLeverage: parseFloat((1 / (liabilityWeight - 1)).toFixed(2)),
				highLeverageMaxLeverage: 0,
				hasHighLeverage: false,
			};
		}
	} catch (e) {
		console.error(e);
		return {
			maxLeverage: 0,
			highLeverageMaxLeverage: 0,
			hasHighLeverage: false,
		};
	}
};

const getMaxLeverageForMarket = (
	marketType: MarketType,
	marketIndex: number,
	driftClient: DriftClient
): {
	maxLeverage: number;
	highLeverageMaxLeverage: number;
	hasHighLeverage: boolean;
} => {
	const marketAccount = ENUM_UTILS.match(marketType, MarketType.PERP)
		? driftClient.getPerpMarketAccount(marketIndex)
		: driftClient.getSpotMarketAccount(marketIndex);

	return getMaxLeverageForMarketAccount(marketType, marketAccount);
};

export { getMaxLeverageForMarketAccount, getMaxLeverageForMarket };
