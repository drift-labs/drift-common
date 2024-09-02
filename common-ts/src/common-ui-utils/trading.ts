import {
	BN,
	BigNum,
	PRICE_PRECISION_EXP,
	PositionDirection,
	QUOTE_PRECISION_EXP,
	ZERO,
	isVariant,
} from '@drift-labs/sdk';

const calculatePnlPctFromPosition = (
	pnl: BN,
	quoteEntryAmount: BN,
	leverage?: number
): number => {
	if (!quoteEntryAmount || quoteEntryAmount.eq(ZERO)) return 0;

	const leverageAdjustedEntryAmount = BigNum.from(
		quoteEntryAmount.abs(),
		QUOTE_PRECISION_EXP
	).div(new BN(Math.max(1, leverage || 1)));

	return (
		BigNum.from(pnl, QUOTE_PRECISION_EXP)
			.shift(5)
			.div(leverageAdjustedEntryAmount)
			.toNum() * 100
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
	slippageTolerance: number;
	takerFeeBps: number;
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

	// For market orders, include worst-case slippage tolerance
	if (props.isMarketOrder) {
		const notionalSlippageAmount = notionalSizeAtExit.scale(
			props.slippageTolerance / 100,
			1
		);
		notionalSizeAtExit = notionalSizeAtExit.sub(notionalSlippageAmount);
	}

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

export const TRADING_COMMON_UTILS = {
	calculatePnlPctFromPosition,
	calculatePotentialProfit,
};
