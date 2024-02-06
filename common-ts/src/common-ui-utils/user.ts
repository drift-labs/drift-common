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
	UserStatsAccount,
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

			const estExitPrice = user.getPositionEstimatedExitPriceAndPnl(
				perpPositionWithRemainderBaseAdded,
				perpPositionWithRemainderBaseAdded.baseAssetAmount
			)[0];

			const entryPrice = calculateEntryPrice(
				perpPositionWithRemainderBaseAdded
			);
			// const entryPrice = perpPositionWithRemainderBaseAdded.lpShares.eq(ZERO)
			// 	? calculateEntryPrice(perpPositionWithRemainderBaseAdded)
			// 	: calculateCostBasis(perpPositionWithRemainderBaseAdded, true);

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

			const pnlVsOracle = TRADING_COMMON_UTILS.calculatePotentialProfit({
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
				exitPrice: BigNum.from(oraclePriceData.price, PRICE_PRECISION_EXP),
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
				remainderBaseAmount: position.remainderBaseAssetAmount ?? 0,
			};
		});

	return newResult;
};

const getUser30dRollingVolumeEstimate = (
	userStatsAccount: UserStatsAccount,
	now?: BN
) => {
	now = now || new BN(new Date().getTime() / 1000);
	const sinceLastTaker = BN.max(
		now.sub(userStatsAccount.lastTakerVolume30DTs),
		ZERO
	);
	const sinceLastMaker = BN.max(
		now.sub(userStatsAccount.lastMakerVolume30DTs),
		ZERO
	);
	const thirtyDaysInSeconds = new BN(60 * 60 * 24 * 30);
	const last30dVolume = userStatsAccount.takerVolume30D
		.mul(thirtyDaysInSeconds.sub(sinceLastTaker))
		.div(thirtyDaysInSeconds)
		.add(
			userStatsAccount.makerVolume30D
				.mul(thirtyDaysInSeconds.sub(sinceLastMaker))
				.div(thirtyDaysInSeconds)
		);

	return last30dVolume;
};

export const USER_COMMON_UTILS = {
	getOpenPositionData,
	getUser30dRollingVolumeEstimate,
};
