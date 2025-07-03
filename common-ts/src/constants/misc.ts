import { BigNum, LAMPORTS_EXP } from '@drift-labs/sdk';

export const USDC_SPOT_MARKET_INDEX = 0;

export const MAIN_POOL_ID = 0;
export const JLP_POOL_ID = 1;
export const LST_POOL_ID = 2;
export const EXPONENT_POOL_ID = 3;
export const SACRED_POOL_ID = 4;

/**
 * Equal to 0.01
 */
export const NEW_ACCOUNT_DONATION = BigNum.fromPrint('0.0001', LAMPORTS_EXP);

/**
 * Equal to 0.035
 */
export const NEW_ACCOUNT_BASE_RENT = new BigNum('31347840', LAMPORTS_EXP);

export const SWIFT_ACCOUNT_BASE_RENT = new BigNum('2756160', LAMPORTS_EXP);

/**
 * Equal to NEW_ACCOUNT_DONATION + NEW_ACCOUNT_BASE_RENT
 */
export const NEW_ACCOUNT_BASE_COST = NEW_ACCOUNT_BASE_RENT.add(
	NEW_ACCOUNT_DONATION
).add(SWIFT_ACCOUNT_BASE_RENT);

/**
 * Equal to 0.002
 */
export const IF_STAKE_ACCOUNT_BASE_RENT = BigNum.fromPrint(
	'0.002',
	LAMPORTS_EXP
);

/**
 * Equal to 0.01 SOL
 */
export const MIN_LEFTOVER_SOL = BigNum.fromPrint('0.01', LAMPORTS_EXP);

export const ONE_DAY_MS = 1000 * 60 * 60 * 24;
