import {
	BASE_PRECISION_EXP,
	BigNum,
	BN,
	PerpMarketAccount,
	QUOTE_PRECISION_EXP,
	SpotMarketAccount,
} from '@drift-labs/sdk';

/**
 * Converts a size and precision exponent to the number of decimals in the size.
 * Size can refer to the step size or the tick size of a market.
 */
export const getDecimalsFromSize = (size: BN, precisionExp: BN) => {
	const formattedSize = BigNum.from(size, precisionExp).prettyPrint();
	if (formattedSize.includes('.')) {
		return formattedSize.split('.')[1].length;
	}
	return 0;
};

export const getPerpMarketSizes = (perpMarketAccount: PerpMarketAccount) => {
	const stepSize = perpMarketAccount.amm.orderStepSize;
	const tickSize = perpMarketAccount.amm.orderTickSize;

	return {
		stepSizeDecimals: getDecimalsFromSize(stepSize, BASE_PRECISION_EXP),
		tickSizeDecimals: getDecimalsFromSize(tickSize, QUOTE_PRECISION_EXP),
	};
};

export const getSpotMarketSizes = (spotMarketAccount: SpotMarketAccount) => {
	const stepSize = spotMarketAccount.orderStepSize;
	const tickSize = spotMarketAccount.orderTickSize;

	return {
		stepSizeDecimals: getDecimalsFromSize(stepSize, BASE_PRECISION_EXP),
		tickSizeDecimals: getDecimalsFromSize(tickSize, QUOTE_PRECISION_EXP),
	};
};
