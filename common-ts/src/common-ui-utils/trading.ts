import { BN, BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';

const calculatePnlPctFromPosition = (
	pnl: BN,
	quoteEntryAmount: BN,
	leverage?: number
): number => {
	return (
		BigNum.from(pnl, QUOTE_PRECISION_EXP)
			.shift(5)
			.div(BigNum.from(quoteEntryAmount.abs(), QUOTE_PRECISION_EXP))
			.toNum() *
		100 *
		(leverage ?? 1)
	);
};

export const TRADING_COMMON_UTILS = {
	calculatePnlPctFromPosition,
};
