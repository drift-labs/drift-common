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
				positionFlag: position.positionFlag,
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

export const USER_UTILS = {
	getOpenPositionData,
	checkIfUserAccountExists,
};
