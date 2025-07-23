import {
	BN,
	BigNum,
	PRICE_PRECISION_EXP,
	PositionDirection,
	QUOTE_PRECISION_EXP,
	User,
	ZERO,
	isVariant,
} from '@drift-labs/sdk';
import { UIOrderType } from 'src/types';

const calculatePnlPctFromPosition = (
	pnl: BN,
	quoteEntryAmount: BN,
	leverage?: number
): number => {
	if (!quoteEntryAmount || quoteEntryAmount.eq(ZERO)) return 0;

	return (
		BigNum.from(pnl, QUOTE_PRECISION_EXP)
			.shift(5)
			.div(BigNum.from(quoteEntryAmount.abs(), QUOTE_PRECISION_EXP))
			.toNum() *
		100 *
		(leverage ?? 1)
	);
};

const POTENTIAL_PROFIT_DEFAULT_STATE = {
	estimatedProfit: BigNum.zero(PRICE_PRECISION_EXP),
	estimatedProfitBeforeFees: BigNum.zero(PRICE_PRECISION_EXP),
	estimatedTakerFee: BigNum.zero(PRICE_PRECISION_EXP),
	notionalSizeAtEntry: BigNum.zero(PRICE_PRECISION_EXP),
	notionalSizeAtExit: BigNum.zero(PRICE_PRECISION_EXP),
};

const calculatePotentialProfit = (props: {
	currentPositionSize: BigNum;
	currentPositionDirection: PositionDirection;
	currentPositionEntryPrice: BigNum;
	tradeDirection: PositionDirection;
	/**
	 * Amount of position being closed in base asset size
	 */
	exitBaseSize: BigNum;
	/**
	 * Either the user's limit price (for limit orders) or the estimated exit price (for market orders)
	 */
	exitPrice: BigNum;
	takerFeeBps: number;
	slippageTolerance?: number;
	isMarketOrder?: boolean;
}): {
	estimatedProfit: BigNum;
	estimatedProfitBeforeFees: BigNum;
	estimatedTakerFee: BigNum;
	notionalSizeAtEntry: BigNum;
	notionalSizeAtExit: BigNum;
} => {
	let estimatedProfit = BigNum.zero(PRICE_PRECISION_EXP);
	let estimatedProfitBeforeFees = BigNum.zero(PRICE_PRECISION_EXP);
	let estimatedTakerFee = BigNum.zero(PRICE_PRECISION_EXP);
	let notionalSizeAtEntry = BigNum.zero(PRICE_PRECISION_EXP);
	let notionalSizeAtExit = BigNum.zero(PRICE_PRECISION_EXP);

	const isClosingLong =
		isVariant(props.currentPositionDirection, 'long') &&
		isVariant(props.tradeDirection, 'short');
	const isClosingShort =
		isVariant(props.currentPositionDirection, 'short') &&
		isVariant(props.tradeDirection, 'long');

	if (!isClosingLong && !isClosingShort) return POTENTIAL_PROFIT_DEFAULT_STATE;
	if (!props.exitBaseSize) return POTENTIAL_PROFIT_DEFAULT_STATE;

	if (
		props.exitBaseSize.eqZero() ||
		props.currentPositionSize.lt(props.exitBaseSize)
	) {
		return POTENTIAL_PROFIT_DEFAULT_STATE;
	}

	const baseSizeBeingClosed = props.exitBaseSize.lte(props.currentPositionSize)
		? props.exitBaseSize
		: props.currentPositionSize;

	// Notional size of amount being closed at entry and exit
	notionalSizeAtEntry = baseSizeBeingClosed.mul(
		props.currentPositionEntryPrice.shiftTo(baseSizeBeingClosed.precision)
	);
	notionalSizeAtExit = baseSizeBeingClosed.mul(
		props.exitPrice.shiftTo(baseSizeBeingClosed.precision)
	);

	if (isClosingLong) {
		estimatedProfitBeforeFees = notionalSizeAtExit.sub(notionalSizeAtEntry);
	} else if (isClosingShort) {
		estimatedProfitBeforeFees = notionalSizeAtEntry.sub(notionalSizeAtExit);
	}

	// subtract takerFee if applicable
	if (props.takerFeeBps > 0) {
		const takerFeeDenominator = Math.floor(100 / (props.takerFeeBps * 0.01));
		estimatedTakerFee = notionalSizeAtExit.scale(1, takerFeeDenominator);
		estimatedProfit = estimatedProfitBeforeFees.sub(
			estimatedTakerFee.shiftTo(estimatedProfitBeforeFees.precision)
		);
	} else {
		estimatedProfit = estimatedProfitBeforeFees;
	}

	return {
		estimatedProfit,
		estimatedProfitBeforeFees,
		estimatedTakerFee,
		notionalSizeAtEntry,
		notionalSizeAtExit,
	};
};

/**
 * Check if the order type is a market order or oracle market order
 */
const checkIsMarketOrderType = (orderType: UIOrderType) => {
	return orderType === 'market' || orderType === 'oracle';
};

/**
 * Calculate the liquidation price of a position after a trade. Requires DriftClient to be subscribed.
 * If the order type is limit order, a limit price must be provided.
 */
const calculateLiquidationPriceAfterPerpTrade = ({
	estEntryPrice,
	orderType,
	perpMarketIndex,
	tradeBaseSize,
	isLong,
	userClient,
	oraclePrice,
	limitPrice,
	offsetCollateral,
	precision = 2,
	isEnteringHighLeverageMode,
	capLiqPrice,
}: {
	estEntryPrice: BN;
	orderType: UIOrderType;
	perpMarketIndex: number;
	tradeBaseSize: BN;
	isLong: boolean;
	userClient: User;
	oraclePrice: BN;
	limitPrice?: BN;
	offsetCollateral?: BN;
	precision?: number;
	isEnteringHighLeverageMode?: boolean;
	capLiqPrice?: boolean;
}) => {
	const ALLOWED_ORDER_TYPES: UIOrderType[] = [
		'limit',
		'market',
		'oracle',
		'stopMarket',
		'stopLimit',
		'oracleLimit',
	];

	if (!ALLOWED_ORDER_TYPES.includes(orderType)) {
		console.error(
			'Invalid order type for perp trade liquidation price calculation',
			orderType
		);
		return 0;
	}

	if (orderType === 'limit' && !limitPrice) {
		console.error(
			'Limit order must have a limit price for perp trade liquidation price calculation'
		);
		return 0;
	}

	const signedBaseSize = isLong ? tradeBaseSize : tradeBaseSize.neg();
	const priceToUse = [
		'limit',
		'stopMarket',
		'stopLimit',
		'oracleLimit',
	].includes(orderType)
		? limitPrice
		: estEntryPrice;

	const liqPriceBn = userClient.liquidationPrice(
		perpMarketIndex,
		signedBaseSize,
		priceToUse,
		undefined,
		undefined, // we can exclude open orders since open orders will be cancelled first (which results in reducing account leverage) before actual liquidation
		offsetCollateral,
		isEnteringHighLeverageMode
	);

	if (liqPriceBn.isNeg()) {
		// means no liquidation price
		return 0;
	}

	// cap liq price at the oracle price for ui
	// ie: long order shouldn't have a liq price above oracle price
	const cappedLiqPriceBn = capLiqPrice
		? isLong
			? BN.min(liqPriceBn, oraclePrice)
			: BN.max(liqPriceBn, oraclePrice)
		: liqPriceBn;

	const liqPriceBigNum = BigNum.from(cappedLiqPriceBn, PRICE_PRECISION_EXP);

	const liqPriceNum =
		Math.round(liqPriceBigNum.toNum() * 10 ** precision) / 10 ** precision;

	return liqPriceNum;
};

export const TRADING_COMMON_UTILS = {
	calculatePnlPctFromPosition,
	calculatePotentialProfit,
	calculateLiquidationPriceAfterPerpTrade,
	checkIsMarketOrderType,
};
