import {
	PerpMarketAccount,
	PerpOperation,
	SpotMarketAccount,
	SpotOperation,
	isOperationPaused,
	InsuranceFundOperation,
	MarketType,
	SpotMarketConfig,
	DriftEnv,
	PerpMarketConfig,
	PerpMarkets,
	SpotMarkets,
	DriftClient,
	isVariant,
} from '@drift-labs/sdk';
import { ENUM_UTILS } from '../utils';
import { DEFAULT_MAX_MARKET_LEVERAGE } from '../constants/markets';

const getBaseAssetSymbol = (marketName: string, removePrefix = false) => {
	let baseAssetSymbol = marketName.replace('-PERP', '').replace('/USDC', '');

	if (removePrefix) {
		baseAssetSymbol = baseAssetSymbol.replace('1K', '').replace('1M', '');
	}

	return baseAssetSymbol;
};

const PerpOperationsMap = {
	UPDATE_FUNDING: 'Funding',
	AMM_FILL: 'AMM Fills',
	FILL: 'Fills',
	SETTLE_PNL: 'Settle P&L',
	SETTLE_PNL_WITH_POSITION: 'Settle P&L With Open Position',
};

const SpotOperationsMap = {
	UPDATE_CUMULATIVE_INTEREST: 'Update Cumulative Interest',
	FILL: 'Fills',
	WITHDRAW: 'Withdrawals',
};

const InsuranceFundOperationsMap = {
	INIT: 'Initialize IF',
	ADD: 'Deposit To IF',
	REQUEST_REMOVE: 'Request Withdrawal From IF',
	REMOVE: 'Withdraw From IF',
};

const getPausedOperations = (
	marketAccount: PerpMarketAccount | SpotMarketAccount
): string[] => {
	if (!marketAccount) return [];

	const pausedOperations = [];
	//@ts-ignore
	const isPerp = !!marketAccount.amm;

	// check perp operations
	if (isPerp) {
		Object.keys(PerpOperation)
			.filter((operation) =>
				isOperationPaused(
					marketAccount.pausedOperations,
					PerpOperation[operation]
				)
			)
			.forEach((pausedOperation) => {
				pausedOperations.push(PerpOperationsMap[pausedOperation]);
			});
	} else {
		// check spot operations
		Object.keys(SpotOperation)
			.filter((operation) =>
				isOperationPaused(
					marketAccount.pausedOperations,
					SpotOperation[operation]
				)
			)
			.forEach((pausedOperation) => {
				pausedOperations.push(SpotOperationsMap[pausedOperation]);
			});

		// check IF operations
		Object.keys(InsuranceFundOperation)
			.filter((operation) =>
				isOperationPaused(
					//@ts-ignore
					marketAccount.ifPausedOperations,
					InsuranceFundOperation[operation]
				)
			)
			.forEach((pausedOperation) => {
				pausedOperations.push(InsuranceFundOperationsMap[pausedOperation]);
			});
	}

	return pausedOperations;
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

const getMaxLeverageForMarket = (
	marketType: MarketType,
	marketIndex: number,
	driftClient: DriftClient
): {
	maxLeverage: number;
	highLeverageMaxLeverage: number;
	hasHighLeverage: boolean;
} => {
	try {
		if (isVariant(marketType, 'perp')) {
			const marketAccount = driftClient.getPerpMarketAccount(marketIndex);

			const maxLeverage = parseFloat(
				(
					1 /
					((marketAccount?.marginRatioInitial
						? marketAccount.marginRatioInitial
						: 10000 / DEFAULT_MAX_MARKET_LEVERAGE) /
						10000)
				).toFixed(2)
			);

			const marketHasHighLeverageMode =
				!!marketAccount?.highLeverageMarginRatioInitial;

			const highLeverageMaxLeverage = marketHasHighLeverageMode
				? parseFloat(
						(
							1 /
							((marketAccount?.highLeverageMarginRatioInitial
								? marketAccount?.highLeverageMarginRatioInitial
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
			const marketAccount = driftClient.getSpotMarketAccount(marketIndex);

			const liabilityWeight = marketAccount
				? marketAccount.initialLiabilityWeight / 10000
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

export const MARKET_UTILS = {
	getBaseAssetSymbol,
	getPausedOperations,
	PerpOperationsMap,
	SpotOperationsMap,
	InsuranceFundOperationsMap,
	getMarketConfig,
	getMaxLeverageForMarket,
};
