import { BigNum } from '@velocity-exchange/sdk';

export const isNotionalDust = (val: BigNum) => {
	return !val.eqZero() && val.abs().toNum() < 0.01;
};
