import {
	BASE_PRECISION_EXP,
	BN,
	BigNum,
	DriftClient,
	PRICE_PRECISION_EXP,
	PerpMarketConfig,
	PerpPosition,
	PositionDirection,
	QUOTE_PRECISION_EXP,
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
import { TRADING_COMMON_UTILS } from './trading';

const getOpenPositionData = (
	driftClient: DriftClient,
	userPositions: PerpPosition[],
	user: User,
	perpMarketLookup: PerpMarketConfig[],
	markPriceCallback?: (marketIndex: number) => BN
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

			// mark price fetched with a callback so we don't need extra dlob server calls. fallback to oracle
			const markPrice = markPriceCallback
				? markPriceCallback(position.marketIndex) ?? oraclePriceData.price
				: oraclePriceData.price;

			const perpPositionWithLpSettle = user.getPerpPositionWithLPSettle(
				position.marketIndex,
				position,
				false
			)[0];

			const perpPositionWithRemainderBaseAdded =
				user.getPerpPositionWithLPSettle(
					position.marketIndex,
					position,
					false,
					true
				)[0];

			const [estExitPrice, pnlVsOracle] =
				user.getPositionEstimatedExitPriceAndPnl(
					perpPositionWithRemainderBaseAdded,
					perpPositionWithRemainderBaseAdded.baseAssetAmount
				);

			const entryPrice = calculateEntryPrice(
				perpPositionWithRemainderBaseAdded
			);

			const isShort =
				perpPositionWithRemainderBaseAdded.baseAssetAmount.isNeg();

			const pnlVsMark = TRADING_COMMON_UTILS.calculatePotentialProfit({
				currentPositionSize: BigNum.from(
					perpPositionWithRemainderBaseAdded.baseAssetAmount.abs(),
					BASE_PRECISION_EXP
				),
				currentPositionDirection: isShort
					? PositionDirection.SHORT
					: PositionDirection.LONG,
				currentPositionEntryPrice: BigNum.from(entryPrice, PRICE_PRECISION_EXP),
				tradeDirection: isShort
					? PositionDirection.LONG
					: PositionDirection.SHORT,
				exitBaseSize: BigNum.from(
					perpPositionWithRemainderBaseAdded.baseAssetAmount.abs(),
					BASE_PRECISION_EXP
				),
				exitPrice: BigNum.from(markPrice, PRICE_PRECISION_EXP),
				slippageTolerance: 0,
				takerFeeBps: 0,
			}).estimatedProfit.shiftTo(QUOTE_PRECISION_EXP).val;

			return {
				marketIndex: perpPositionWithLpSettle.marketIndex,
				marketSymbol: perpMarketConfig.symbol,
				direction: isShort ? 'short' : 'long',
				notional: user
					.getPerpPositionValue(position.marketIndex, oraclePriceData)
					.abs(),
				baseSize: perpPositionWithRemainderBaseAdded.baseAssetAmount,
				markPrice,
				entryPrice,
				exitPrice: estExitPrice,
				liqPrice: user.liquidationPrice(position.marketIndex, ZERO),
				quoteAssetNotionalAmount:
					perpPositionWithRemainderBaseAdded.quoteAssetAmount,
				quoteEntryAmount: perpPositionWithRemainderBaseAdded.quoteEntryAmount,
				pnlVsMark,
				pnlVsOracle,
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
				costBasis: calculateCostBasis(perpPositionWithRemainderBaseAdded),
				realizedPnl: perpPositionWithLpSettle.settledPnl,
				lpShares: perpPositionWithLpSettle.lpShares,
			};
		});

	return newResult;
};

export const USER_COMMON_UTILS = {
	getOpenPositionData,
};
