import {
	BASE_PRECISION_EXP,
	BN,
	BigNum,
	DriftClient,
	MarketStatus,
	ONE,
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
	calculateFeesAndFundingPnl,
	calculatePositionFundingPNL,
	calculatePositionPNL,
	isOracleValid,
} from '@drift-labs/sdk';
import { OpenPosition, UIMarket } from '../types';
import { TRADING_COMMON_UTILS } from './trading';
import { ENUM_UTILS } from '..';

const getOpenPositionData = (
	driftClient: DriftClient,
	userPositions: PerpPosition[],
	user: User,
	perpMarketLookup: PerpMarketConfig[],
	markPriceCallback?: (marketIndex: number) => BN
): OpenPosition[] => {
	const oracleGuardRails = driftClient.getStateAccount().oracleGuardRails;

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

			let oraclePrice = oraclePriceData.price;

			// mark price fetched with a callback so we don't need extra dlob server calls. fallback to oracle
			let markPrice = markPriceCallback
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

			let estExitPrice = user.getPositionEstimatedExitPriceAndPnl(
				perpPositionWithRemainderBaseAdded,
				perpPositionWithRemainderBaseAdded.baseAssetAmount
			)[0];

			const entryPrice = calculateEntryPrice(
				perpPositionWithRemainderBaseAdded
			);

			const isShort =
				perpPositionWithRemainderBaseAdded.baseAssetAmount.isNeg();

			if (UIMarket.checkIsPredictionMarket(perpMarketConfig)) {
				const isResolved =
					ENUM_UTILS.match(perpMarket?.status, MarketStatus.SETTLEMENT) ||
					ENUM_UTILS.match(perpMarket?.status, MarketStatus.DELISTED);

				if (isResolved) {
					const resolvedToNo = perpMarket.expiryPrice.lte(
						ZERO.add(perpMarket.amm.orderTickSize)
					);

					const price = resolvedToNo
						? ZERO.mul(PRICE_PRECISION)
						: ONE.mul(PRICE_PRECISION);

					estExitPrice = price;
					markPrice = price;
					oraclePrice = price;
				}
			}

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
				exitPrice: BigNum.from(oraclePrice, PRICE_PRECISION_EXP),
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
				quoteBreakEvenAmount:
					perpPositionWithRemainderBaseAdded.quoteBreakEvenAmount,
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
				// Includes both settled and unsettled funding as well as fees
				feesAndFundingPnl: calculateFeesAndFundingPnl(
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
				pnlIsClaimable: isOracleValid(
					perpMarket,
					oraclePriceData,
					oracleGuardRails,
					perpMarket.amm.lastUpdateSlot?.toNumber()
				),
				lpShares: perpPositionWithLpSettle.lpShares,
				remainderBaseAmount: position.remainderBaseAssetAmount ?? 0,
				lpDeriskPrice: user.liquidationPrice(
					position.marketIndex,
					undefined,
					undefined,
					'Initial',
					true
				),
			};
		});

	return newResult;
};

export const USER_COMMON_UTILS = {
	getOpenPositionData,
};
