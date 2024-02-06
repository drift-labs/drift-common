import {
	AMM_TO_QUOTE_PRECISION_RATIO,
	BASE_PRECISION_EXP,
	BN,
	BigNum,
	DriftClient,
	PRICE_PRECISION,
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

const getAvgEntry = (baseAmount: BN, quoteAmount: BN) => {
	if (baseAmount.eq(ZERO)) {
		return ZERO;
	}

	return quoteAmount
		.mul(PRICE_PRECISION)
		.mul(AMM_TO_QUOTE_PRECISION_RATIO)
		.div(baseAmount)
		.abs();
};

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

			const entryPrice = perpPositionWithRemainderBaseAdded.lpShares.eq(ZERO)
				? calculateEntryPrice(perpPositionWithLpSettle)
				: getAvgEntry(
						perpPositionWithRemainderBaseAdded.baseAssetAmount,
						perpPositionWithRemainderBaseAdded.quoteAssetAmount
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
				lpDeriskPrice: user.liquidationPrice(
					position.marketIndex,
					undefined,
					undefined,
					'Initial'
				),
			};
		});

	return newResult;
};

export const USER_COMMON_UTILS = {
	getOpenPositionData,
};
