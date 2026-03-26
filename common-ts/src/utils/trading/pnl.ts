import {
	BigNum,
	PRICE_PRECISION_EXP,
	PositionDirection,
	QUOTE_PRECISION_EXP,
	ZERO,
	isVariant,
} from '@drift-labs/sdk';
import { OpenPosition } from '../../types';
import { convertMarginRatioToLeverage } from './leverage';

const calculatePnlPctFromPosition = (
	pnl: import('@drift-labs/sdk').BN,
	position: OpenPosition,
	marginUsed?: import('@drift-labs/sdk').BN
): number => {
	if (!position?.quoteEntryAmount || position?.quoteEntryAmount.eq(ZERO))
		return 0;

	let marginUsedNum: number;

	if (marginUsed) {
		marginUsedNum = BigNum.from(marginUsed, QUOTE_PRECISION_EXP).toNum();
	} else {
		const leverage = convertMarginRatioToLeverage(position.maxMarginRatio) ?? 1;
		const quoteEntryAmountNum = BigNum.from(
			position.quoteEntryAmount.abs(),
			QUOTE_PRECISION_EXP
		).toNum();

		if (leverage <= 0 || quoteEntryAmountNum <= 0) {
			marginUsedNum = 0;
		} else {
			marginUsedNum = quoteEntryAmountNum / leverage;
		}
	}

	if (marginUsedNum <= 0) {
		return 0;
	}

	return (
		BigNum.from(pnl, QUOTE_PRECISION_EXP)
			.shift(5)
			.div(BigNum.fromPrint(`${marginUsedNum}`, QUOTE_PRECISION_EXP))
			.toNum() * 100
	);
};

export const POTENTIAL_PROFIT_DEFAULT_STATE = {
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

export { calculatePnlPctFromPosition, calculatePotentialProfit };
