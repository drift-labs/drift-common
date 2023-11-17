import {
	DriftClient,
	PerpMarketConfig,
	PerpPosition,
	QUOTE_SPOT_MARKET_INDEX,
	User,
	ZERO,
	calculateClaimablePnl,
	calculateCostBasis,
	calculateEntryPrice,
	calculatePositionFundingPNL,
	calculatePositionPNL,
} from '@drift-labs/sdk';
import { OpenPosition } from 'src/types';

const getOpenPositionData = (
	driftClient: DriftClient,
	userPositions: PerpPosition[],
	user: User,
	perpMarketLookup: PerpMarketConfig[]
): OpenPosition[] => {
	const newResult: OpenPosition[] = userPositions
		.filter(
			(position) =>
				!position.baseAssetAmount.eq(ZERO) ||
				!position.quoteAssetAmount.eq(ZERO) ||
				!position.lpShares.eq(ZERO)
		)
		.map((position) => {
			const perpMarketConfig = perpMarketLookup[position.marketIndex];
			const perpMarket = driftClient.getPerpMarketAccount(position.marketIndex);

			const usdcSpotMarket = driftClient.getSpotMarketAccount(
				QUOTE_SPOT_MARKET_INDEX
			);

			const oraclePriceData = driftClient.getOracleDataForPerpMarket(
				position.marketIndex
			);

			const markPrice = oraclePriceData.price;

			const [perpPositionWithLpSettle, _dustBaseAmount, _unsettledLpPnl] =
				user.getPerpPositionWithLPSettle(position.marketIndex, position);

			const [estExitPrice, pnl] = user.getPositionEstimatedExitPriceAndPnl(
				perpPositionWithLpSettle,
				perpPositionWithLpSettle.baseAssetAmount
			);

			return {
				marketIndex: perpPositionWithLpSettle.marketIndex,
				marketSymbol: perpMarketConfig.symbol,
				direction: perpPositionWithLpSettle.baseAssetAmount.isNeg()
					? 'short'
					: 'long',
				notional: user
					.getPerpPositionValue(position.marketIndex, oraclePriceData)
					.abs(),
				baseSize: perpPositionWithLpSettle.baseAssetAmount,
				markPrice: markPrice,
				entryPrice: calculateEntryPrice(perpPositionWithLpSettle),
				exitPrice: estExitPrice,
				liqPrice: user.liquidationPrice(position.marketIndex, ZERO),
				quoteAssetNotionalAmount: perpPositionWithLpSettle.quoteAssetAmount,
				quoteEntryAmount: perpPositionWithLpSettle.quoteEntryAmount,
				pnl: pnl,
				unsettledPnl: calculateClaimablePnl(
					perpMarket,
					usdcSpotMarket,
					perpPositionWithLpSettle,
					oraclePriceData
				),
				unsettledFundingPnl: calculatePositionFundingPNL(
					perpMarket,
					perpPositionWithLpSettle
				),
				totalUnrealizedPnl: calculatePositionPNL(
					perpMarket,
					perpPositionWithLpSettle,
					true,
					oraclePriceData
				),
				unrealizedFundingPnl: user.getUnrealizedFundingPNL(
					perpPositionWithLpSettle.marketIndex
				),
				lastCumulativeFundingRate:
					perpPositionWithLpSettle.lastCumulativeFundingRate,
				openOrders: perpPositionWithLpSettle.openOrders,
				costBasis: calculateCostBasis(perpPositionWithLpSettle),
				realizedPnl: perpPositionWithLpSettle.settledPnl,
				lpShares: perpPositionWithLpSettle.lpShares,
			};
		});

	return newResult;
};

export const USER_COMMON_UTILS = {
	getOpenPositionData,
};
