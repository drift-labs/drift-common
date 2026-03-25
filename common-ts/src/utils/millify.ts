/**
 * There is a "millify" npm library but it is multiple kilobytes and opens space
 * for security vulnerabilities. Easier to just roll our own as it's not complicated.
 */

interface MillifyOptions {
	precision?: number;
	decimals?: number;
	notation?: 'scientific' | 'financial';
	trimEndingZeroes?: boolean;
}

const FINANCIAL_UNITS = ['', 'K', 'M', 'B', 'T', 'Q'];
const SCIENTIFIC_UNITS = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

export default function millify(
	value: number,
	options?: MillifyOptions
): string {
	const precision = options?.precision ?? 6;
	const trimEndingZeroes = options?.trimEndingZeroes ?? false;

	if (isNaN(value)) return '0';

	const isNegative = value < 0;
	const absoluteValue = Math.abs(value);

	const units =
		(options?.notation ?? 'financial') === 'financial'
			? FINANCIAL_UNITS
			: SCIENTIFIC_UNITS;

	if (absoluteValue < 1000) {
		const formattedValue = absoluteValue.toPrecision(precision);
		const trimmedValue = trimEndingZeroes
			? parseFloat(formattedValue).toString()
			: formattedValue;
		return `${isNegative ? '-' : ''}${trimmedValue}`;
	}

	const unitIndex = Math.min(
		Math.floor(Math.log10(absoluteValue) / 3),
		units.length - 1
	);

	const scaledValue = absoluteValue / Math.pow(1000, unitIndex);
	const valueWithDecimals =
		options?.decimals !== undefined
			? scaledValue.toFixed(options.decimals)
			: scaledValue.toPrecision(precision);

	const trimmedValue = trimEndingZeroes
		? parseFloat(valueWithDecimals).toString()
		: valueWithDecimals;

	return `${isNegative ? '-' : ''}${trimmedValue}${units[unitIndex]}`;
}
