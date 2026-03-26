import { BigNum } from '@drift-labs/sdk';

export const isNotionalDust = (val: BigNum) => {
	return !val.eqZero() && val.abs().toNum() < 0.01;
};
