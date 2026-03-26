import { BigNum, BN } from '@drift-labs/sdk';

export const roundBigNumToDecimalPlace = (
	bignum: BigNum,
	decimalPlaces: number
): BigNum => {
	const factor = Math.pow(10, decimalPlaces);
	const newNum = Math.round(bignum.toNum() * factor) / factor;
	return BigNum.fromPrint(newNum.toString(), bignum.precision);
};

export const getBigNumRoundedToStepSize = (baseSize: BigNum, stepSize: BN) => {
	const baseSizeRounded = baseSize.div(stepSize).mul(stepSize);
	return baseSizeRounded;
};
