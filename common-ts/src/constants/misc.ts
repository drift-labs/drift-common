import { BASE_PRECISION_EXP, BigNum, LAMPORTS_EXP } from '@drift-labs/sdk';

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
export const NEW_ACCOUNT_BASE_RENT = new BigNum('31347840', LAMPORTS_EXP);

/**
 * Equal to NEW_ACCOUNT_DONATION + NEW_ACCOUNT_BASE_RENT
 */
export const NEW_ACCOUNT_BASE_COST =
	NEW_ACCOUNT_BASE_RENT.add(NEW_ACCOUNT_DONATION);

/**
 * Equal to 0.002
 */
export const IF_STAKE_ACCOUNT_BASE_RENT = BigNum.fromPrint(
	'0.002',
	BASE_PRECISION_EXP
);

/**
 * Equal to 0.02
 */
export const MIN_LEFTOVER_SOL = BigNum.fromPrint('0.02', BASE_PRECISION_EXP);

export const ONE_DAY_MS = 1000 * 60 * 60 * 24;
