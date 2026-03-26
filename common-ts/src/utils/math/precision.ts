import { BN, SpotMarketConfig } from '@drift-labs/sdk';

export const TRADE_PRECISION = 6;

export const truncateInputToPrecision = (
	input: string,
	marketPrecisionExp: SpotMarketConfig['precisionExp']
) => {
	const decimalPlaces = input.split('.')[1]?.length ?? 0;
	const maxDecimals = marketPrecisionExp.toNumber();

	if (decimalPlaces > maxDecimals) {
		return input.slice(0, input.length - (decimalPlaces - maxDecimals));
	}

	return input;
};

export const roundToStepSize = (value: string, stepSize?: number) => {
	const stepSizeExp = stepSize?.toString().split('.')[1]?.length ?? 0;
	const truncatedValue = truncateInputToPrecision(value, new BN(stepSizeExp));

	if (truncatedValue.charAt(truncatedValue.length - 1) === '.') {
		return truncatedValue.slice(0, -1);
	}

	return truncatedValue;
};

export const roundToStepSizeIfLargeEnough = (
	value: string,
	stepSize?: number
) => {
	const parsedValue = parseFloat(value);
	if (isNaN(parsedValue) || stepSize === 0 || !value || parsedValue === 0) {
		return value;
	}

	return roundToStepSize(value, stepSize);
};

export const valueIsBelowStepSize = (value: string, stepSize: number) => {
	const parsedValue = parseFloat(value);

	if (isNaN(parsedValue)) return false;

	return parsedValue < stepSize;
};

/**
 * NOTE: Do not use modulo alone to check if numbers fit evenly.
 * Due to floating point precision issues this can return incorrect results.
 * i.e. 5.1 % 0.1 = 0.09999999999999959 (should be 0)
 * tells me 5.1 / 0.1 = 50.99999999999999
 */
export const numbersFitEvenly = (
	numberOne: number,
	numberTwo: number
): boolean => {
	if (isNaN(numberOne) || isNaN(numberTwo)) return false;
	if (numberOne === 0 || numberTwo === 0) return true;

	return (
		Number.isInteger(Number((numberOne / numberTwo).toFixed(9))) ||
		numberOne % numberTwo === 0
	);
};

/**
 * Check if numbers divide exactly, accounting for floating point division annoyingness
 * @param numerator
 * @param denominator
 * @returns
 */
export const dividesExactly = (numerator: number, denominator: number) => {
	const division = numerator / denominator;
	const remainder = division % 1;

	if (remainder === 0) return true;

	// Because of floating point weirdness, we're just going to assume that if the remainder after dividing is less than 1/10^6 then the numbers do divide exactly
	if (Math.abs(remainder - 1) < 1 / 10 ** 6) return true;

	return false;
};
