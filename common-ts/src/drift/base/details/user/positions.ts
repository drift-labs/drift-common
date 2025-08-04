import {
	BASE_PRECISION_EXP,
	BN,
	BigNum,
	ContractType,
	DriftClient,
	MarketStatus,
	ONE,
	PRICE_PRECISION,
	PRICE_PRECISION_EXP,
	PerpPosition,
	PositionDirection,
	QUOTE_PRECISION_EXP,
	User,
	ZERO,
	calculateEntryPrice,
	calculateFeesAndFundingPnl,
} from '@drift-labs/sdk';
import { TRADING_COMMON_UTILS } from '../../../../common-ui-utils/trading';
import { ENUM_UTILS } from '../../../../utils';
import { MAX_PREDICTION_PRICE_BIG_NUM } from 'src/constants';

/**
 * Comprehensive position information derived from a PerpPosition at a specific reference price.
 * This interface contains all the key metrics needed for position display and analysis.
 */
export interface PriceBasedPositionInfo {
	/** Position entry price.*/
	entryPrice: BigNum;

	/** Absolute size of the position. */
	baseSize: BigNum;

	/** Notional value of the position at the reference price */
	notionalSize: BigNum;

	/**
	 * Position PnL in notional terms based on the reference price.
	 * This does NOT include funding PnL - only the price-based profit/loss.
	 */
	positionNotionalPnl: BigNum;

	/**
	 * Position PnL as a percentage.
	 * For prediction markets: calculated based on price movement relative to entry.
	 * For regular markets: calculated as (PnL / quote entry amount) * account leverage.
	 */
	positionPnlPercentage: number;

	/**
	 * Cumulative funding and fees PnL for this position.
	 * This is separate from positionNotionalPnl to allow granular PnL breakdown.
	 */
	fundingPnl: BigNum;

	/**
	 * Price at which the position would be liquidated.
	 * Returns zero if liquidation price cannot be calculated.
	 */
	liquidationPrice: BigNum;
}

/**
 * Derives the user-understandable position display information from a User's PerpPosition and the reference price.
 * The reference price can be the mark price or the oracle price.
 *
 * @param driftClient - The DriftClient instance.
 * @param user - The User instance.
 * @param perpPosition - The PerpPosition instance.
 * @param referencePrice - The reference price. This can be the mark price or the oracle price.
 * @param accountLeverage - The account leverage.
 *
 * @returns The PositionDisplayInfo object. Note that position pnl does not include funding pnl.
 */
export const getPriceBasedPositionInfo = (
	driftClient: DriftClient,
	user: User,
	perpPosition: PerpPosition,
	referencePrice: BN,
	accountLeverage?: number
): PriceBasedPositionInfo => {
	const { marketIndex } = perpPosition;
	const perpMarket = driftClient.getPerpMarketAccount(marketIndex);
	const referencePriceBigNum = BigNum.from(referencePrice, PRICE_PRECISION_EXP);

	// Base Size
	const baseSize = perpPosition.baseAssetAmount;
	const baseSizeBigNum = BigNum.from(baseSize.abs(), BASE_PRECISION_EXP);

	// Notional size
	const notionalSize = BigNum.from(
		user
			.getPerpPositionValue(marketIndex, {
				price: referencePrice,
			})
			.abs(),
		QUOTE_PRECISION_EXP
	);

	// Entry Price
	const entryPriceBN = calculateEntryPrice(perpPosition);
	const entryPriceBigNum = BigNum.from(entryPriceBN, PRICE_PRECISION_EXP);

	const isShortPosition = baseSize.isNeg();

	// Market and prediction market detection
	const isPredictionMarket = ENUM_UTILS.match(
		perpMarket.contractType,
		ContractType.PREDICTION
	);

	// Price calculations
	// Handle prediction market resolution prices
	if (isPredictionMarket) {
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

			referencePrice = price;
		}
	}

	// position pnl
	const positionNotionalPnlBN = TRADING_COMMON_UTILS.calculatePotentialProfit({
		currentPositionSize: baseSizeBigNum,
		currentPositionDirection: isShortPosition
			? PositionDirection.SHORT
			: PositionDirection.LONG,
		currentPositionEntryPrice: BigNum.from(entryPriceBN, PRICE_PRECISION_EXP),
		tradeDirection: isShortPosition
			? PositionDirection.LONG
			: PositionDirection.SHORT,
		exitBaseSize: baseSizeBigNum,
		exitPrice: referencePriceBigNum,
		takerFeeBps: 0,
	}).estimatedProfit.shiftTo(QUOTE_PRECISION_EXP).val;
	const positionNotionalPnlBigNum = BigNum.from(
		positionNotionalPnlBN,
		QUOTE_PRECISION_EXP
	);

	// funding pnl
	const fundingPnl = BigNum.from(
		calculateFeesAndFundingPnl(perpMarket, perpPosition),
		QUOTE_PRECISION_EXP
	);

	// Determine if this is a sell-side prediction market for price adjustment
	const isSellPredictionMarket = isPredictionMarket && isShortPosition;

	// Apply prediction market price adjustment for display
	const markPriceToUseForPredictionMarket = isSellPredictionMarket
		? MAX_PREDICTION_PRICE_BIG_NUM.sub(referencePriceBigNum).val
		: referencePrice;

	const positionPnlPercentage = isPredictionMarket
		? BigNum.from(markPriceToUseForPredictionMarket, PRICE_PRECISION_EXP)
				.sub(entryPriceBigNum)
				.mul(PRICE_PRECISION)
				.div(entryPriceBN)
				.toNum() *
		  100 *
		  (isShortPosition ? -1 : 1)
		: accountLeverage
		? (() => {
				const quoteAmount = perpPosition.quoteEntryAmount.abs();

				if (quoteAmount.eq(ZERO)) return 0;

				const pnlPct =
					positionNotionalPnlBigNum.val
						.mul(new BN(10000))
						.div(quoteAmount)
						.toNumber() / 100;
				return pnlPct * (accountLeverage || 1);
		  })()
		: 0;

	// Liquidation price
	const liqPrice = user.liquidationPrice(marketIndex);
	const liqPriceBigNum = BigNum.from(liqPrice, PRICE_PRECISION_EXP);

	return {
		baseSize: baseSizeBigNum,
		entryPrice: entryPriceBigNum,
		notionalSize,
		positionNotionalPnl: positionNotionalPnlBigNum,
		fundingPnl,
		positionPnlPercentage,
		liquidationPrice: liqPriceBigNum,
	};
};
