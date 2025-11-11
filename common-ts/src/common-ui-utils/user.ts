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
	PublicKey,
	QUOTE_PRECISION_EXP,
	QUOTE_SPOT_MARKET_INDEX,
	User,
	ZERO,
	calculateClaimablePnl,
	calculateCostBasis,
	calculateEntryPrice,
	calculateFeesAndFundingPnl,
	calculatePositionPNL,
	getUserAccountPublicKeySync,
	calculateUnsettledFundingPnl,
	isOracleValid,
	AMM_RESERVE_PRECISION,
} from '@drift-labs/sdk';
import { OpenPosition, UIMarket } from '../types';
import { TRADING_UTILS } from './trading';
import { ENUM_UTILS } from '../utils';

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

			let estExitPrice = user.getPositionEstimatedExitPriceAndPnl(
				position,
				position.baseAssetAmount
			)[0];

			const entryPrice = calculateEntryPrice(position);

			const isShort = position.baseAssetAmount.isNeg();

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

			// if for any reason oracle or mark price blips to 0, fallback to the other one so we don't show a crazy pnl
			if (markPrice.lte(ZERO) && oraclePrice.gt(ZERO)) {
				markPrice = oraclePrice;
			}

			if (oraclePrice.lte(ZERO) && markPrice.gt(ZERO)) {
				oraclePrice = markPrice;
			}

			const pnlVsMark = TRADING_UTILS.calculatePotentialProfit({
				currentPositionSize: BigNum.from(
					position.baseAssetAmount.abs(),
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
					position.baseAssetAmount.abs(),
					BASE_PRECISION_EXP
				),
				exitPrice: BigNum.from(markPrice, PRICE_PRECISION_EXP),
				takerFeeBps: 0,
			}).estimatedProfit.shiftTo(QUOTE_PRECISION_EXP).val;

			const pnlVsOracle = TRADING_UTILS.calculatePotentialProfit({
				currentPositionSize: BigNum.from(
					position.baseAssetAmount.abs(),
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
					position.baseAssetAmount.abs(),
					BASE_PRECISION_EXP
				),
				exitPrice: BigNum.from(oraclePrice, PRICE_PRECISION_EXP),
				takerFeeBps: 0,
			}).estimatedProfit.shiftTo(QUOTE_PRECISION_EXP).val;

			return {
				marketIndex: position.marketIndex,
				marketSymbol: perpMarketConfig.symbol,
				direction: isShort ? 'short' : 'long',
				notional: position.baseAssetAmount
					.abs()
					.mul(markPrice)
					.div(AMM_RESERVE_PRECISION),
				baseSize: position.baseAssetAmount,
				markPrice,
				entryPrice,
				exitPrice: estExitPrice,
				liqPrice: user.liquidationPrice(position.marketIndex, ZERO),
				quoteAssetNotionalAmount: position.quoteAssetAmount,
				quoteEntryAmount: position.quoteEntryAmount,
				quoteBreakEvenAmount: position.quoteBreakEvenAmount,
				pnlVsMark,
				pnlVsOracle,
				unsettledPnl: calculateClaimablePnl(
					perpMarket,
					usdcSpotMarket,
					position,
					oraclePriceData
				),
				unsettledFundingPnl: calculateUnsettledFundingPnl(perpMarket, position),
				// Includes both settled and unsettled funding as well as fees
				feesAndFundingPnl: calculateFeesAndFundingPnl(perpMarket, position),
				totalUnrealizedPnl: calculatePositionPNL(
					perpMarket,
					position,
					true,
					oraclePriceData
				),
				unrealizedFundingPnl: user.getUnrealizedFundingPNL(
					position.marketIndex
				),
				lastCumulativeFundingRate: position.lastCumulativeFundingRate,
				openOrders: position.openOrders,
				costBasis: calculateCostBasis(position),
				realizedPnl: position.settledPnl,
				pnlIsClaimable: isOracleValid(
					perpMarket,
					oraclePriceData,
					oracleGuardRails,
					perpMarket.amm.lastUpdateSlot?.toNumber()
				),
				lpShares: position.lpShares,
				remainderBaseAmount: position.remainderBaseAssetAmount ?? 0,
				lpDeriskPrice: user.liquidationPrice(
					position.marketIndex,
					undefined,
					undefined,
					'Initial',
					true
				),
				maxMarginRatio: position.maxMarginRatio,
			};
		});

	return newResult;
};

const checkIfUserAccountExists = async (
	driftClient: DriftClient,
	config:
		| {
				type: 'userPubKey';
				userPubKey: PublicKey;
		  }
		| {
				type: 'subAccountId';
				subAccountId: number;
				authority: PublicKey;
		  }
) => {
	let userPubKey: PublicKey;

	if (config.type === 'userPubKey') {
		userPubKey = config.userPubKey;
	} else {
		userPubKey = getUserAccountPublicKeySync(
			driftClient.program.programId,
			config.authority,
			config.subAccountId
		);
	}

	const accountInfo = await driftClient.connection.getAccountInfo(userPubKey);

	return accountInfo !== null;
};

/**
 * A user's max leverage for a market is stored on-chain in the `PerpPosition` struct of the `UserAccount`.
 * There are a few scenarios for how a market's max leverage is defined:
 *
 * 1. When the user does not have a position ("empty" or not) in the market in their `UserAccount` data,
 * and creates an order for the market, an "empty" `PerpPosition` will be added to the `UserAccount` data,
 * and will contain the max margin ratio set by the user. Note that the `UserAccount` data can store up
 * to 8 `PerpPosition` structs, and most of the time the majority of the `PerpPosition` structs will be
 * "empty" if the user does not have the max 8 perp positions open.
 *
 * 2. When the user has a position ("empty" or not), the max margin ratio is retrieved from the `PerpPosition` struct.
 *
 * 3. When the user does not have a position ("empty" or not), it is expected of the UI to store and persist
 * the max leverage in the UI client.
 *
 * 4. In cases where the user has a position before the market max leverage feature was shipped, the
 * position is not expected to have a max margin ratio set, and the UI should display the regular max
 * leverage for the market, unless the user is already in High Leverage Mode, in which case the UI should
 * display the high leverage max leverage for the market (if any).
 */
const getUserMaxLeverageForMarket = (
	user: User | undefined,
	marketIndex: number,
	marketLeverageDetails: {
		regularMaxLeverage: number;
		highLeverageMaxLeverage: number;
		hasHighLeverage: boolean;
	},
	uiSavedMaxLeverage?: number
) => {
	// if no saved max leverage is provided, return the regular max leverage for the market
	const DEFAULT_MAX_LEVERAGE =
		uiSavedMaxLeverage ?? marketLeverageDetails.regularMaxLeverage;

	if (!user) {
		return DEFAULT_MAX_LEVERAGE;
	}

	const openOrClosedPosition = user.getPerpPosition(marketIndex); // this position does not have to be open, it can be a closed position (a.k.a "empty") but has max margin ratio set.

	if (!openOrClosedPosition) {
		return DEFAULT_MAX_LEVERAGE;
	}

	const positionHasMaxMarginRatioSet = !!openOrClosedPosition.maxMarginRatio;

	if (positionHasMaxMarginRatioSet) {
		return parseFloat(
			((1 / openOrClosedPosition.maxMarginRatio) * 10000).toFixed(2)
		);
	} else {
		const isOpenPositionWithoutMaxMarginRatio =
			!openOrClosedPosition.baseAssetAmount.eq(ZERO);

		if (isOpenPositionWithoutMaxMarginRatio) {
			// user has an existing position from before PML ship (this means no max margin ratio set onchain)
			// display max leverage for the leverage mode their account is in
			const isUserInHighLeverageMode = user.isHighLeverageMode('Initial');
			const grandfatheredMaxLev = isUserInHighLeverageMode
				? marketLeverageDetails.hasHighLeverage
					? marketLeverageDetails.highLeverageMaxLeverage
					: marketLeverageDetails.regularMaxLeverage
				: marketLeverageDetails.regularMaxLeverage;
			return grandfatheredMaxLev;
		} else {
			// user has closed position with no margin ratio set, return default value
			return DEFAULT_MAX_LEVERAGE;
		}
	}
};

export const USER_UTILS = {
	getOpenPositionData,
	checkIfUserAccountExists,
	getUserMaxLeverageForMarket,
};
