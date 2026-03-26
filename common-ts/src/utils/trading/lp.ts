import {
	AMM_RESERVE_PRECISION_EXP,
	BN,
	BigNum,
	DriftClient,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';

/* LP Utils */
const getLpSharesAmountForQuote = (
	driftClient: DriftClient,
	marketIndex: number,
	quoteAmount: BN
): BigNum => {
	const tenMillionBigNum = BigNum.fromPrint('10000000', QUOTE_PRECISION_EXP);

	const pricePerLpShare = BigNum.from(
		driftClient.getQuoteValuePerLpShare(marketIndex),
		QUOTE_PRECISION_EXP
	);

	return BigNum.from(quoteAmount, QUOTE_PRECISION_EXP)
		.scale(
			tenMillionBigNum.toNum(),
			pricePerLpShare.mul(tenMillionBigNum).toNum()
		)
		.shiftTo(AMM_RESERVE_PRECISION_EXP);
};

const getQuoteValueForLpShares = (
	driftClient: DriftClient,
	marketIndex: number,
	sharesAmount: BN
): BigNum => {
	const pricePerLpShare = BigNum.from(
		driftClient.getQuoteValuePerLpShare(marketIndex),
		QUOTE_PRECISION_EXP
	).shiftTo(AMM_RESERVE_PRECISION_EXP);
	const lpSharesBigNum = BigNum.from(sharesAmount, AMM_RESERVE_PRECISION_EXP);
	return lpSharesBigNum.mul(pricePerLpShare).shiftTo(QUOTE_PRECISION_EXP);
};

export { getLpSharesAmountForQuote, getQuoteValueForLpShares };
