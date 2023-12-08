import { BASE_PRECISION_EXP, BigNum } from '@drift-labs/sdk';

export const USDC_SPOT_MARKET_INDEX = 0;

/**
 * Equal to 0.01
 */
export const NEW_ACCOUNT_DONATION = BigNum.fromPrint(
	'0.01',
	BASE_PRECISION_EXP
);

/**
 * Equal to 0.035
 */
export const NEW_ACCOUNT_BASE_RENT = BigNum.fromPrint(
	'0.035',
	BASE_PRECISION_EXP
);

/**
 * Equal to NEW_ACCOUNT_DONATION + NEW_ACCOUNT_BASE_RENT
 */
export const NEW_ACCOUNT_BASE_COST =
	NEW_ACCOUNT_BASE_RENT.add(NEW_ACCOUNT_DONATION);

/**
 * Equal to 0.02
 */
export const MIN_LEFTOVER_SOL = BigNum.fromPrint('0.02', BASE_PRECISION_EXP);
