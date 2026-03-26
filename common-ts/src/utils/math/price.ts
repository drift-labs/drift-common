import {
	AMM_RESERVE_PRECISION_EXP,
	AMM_TO_QUOTE_PRECISION_RATIO,
	BASE_PRECISION,
	BASE_PRECISION_EXP,
	BigNum,
	BN,
	OrderActionRecord,
	PRICE_PRECISION,
	PRICE_PRECISION_EXP,
	QUOTE_PRECISION,
} from '@drift-labs/sdk';
import { UISerializableOrderActionRecord } from '../../serializableTypes';

/**
 * Returns the average price for a given base amount and quote amount.
 * @param quoteAmount
 * @param baseAmount
 * @returns PRICE_PRECISION
 */
export const getPriceForBaseAndQuoteAmount = (
	quoteAmount: BN,
	baseAmount: BN
) => {
	return quoteAmount
		.mul(PRICE_PRECISION)
		.mul(BASE_PRECISION)
		.div(QUOTE_PRECISION)
		.div(BigNum.from(baseAmount, BASE_PRECISION_EXP).val);
};

export const getPriceForOrderRecord = (
	orderRecord: Pick<
		OrderActionRecord,
		'quoteAssetAmountFilled' | 'baseAssetAmountFilled'
	>
) => {
	return getPriceForBaseAndQuoteAmount(
		// @ts-ignore
		orderRecord.quoteAssetAmountFilled,
		// @ts-ignore
		orderRecord.baseAssetAmountFilled
	);
};

export const getPriceForUIOrderRecord = (
	orderRecord: Pick<
		UISerializableOrderActionRecord,
		'quoteAssetAmountFilled' | 'baseAssetAmountFilled'
	>
) => {
	return orderRecord.quoteAssetAmountFilled
		.shiftTo(AMM_RESERVE_PRECISION_EXP)
		.shift(PRICE_PRECISION_EXP)
		.div(orderRecord.baseAssetAmountFilled.shiftTo(BASE_PRECISION_EXP))
		.shiftTo(PRICE_PRECISION_EXP);
};

export const calculateAverageEntryPrice = (
	quoteAssetAmount: BigNum,
	baseAssetAmount: BigNum
): BigNum => {
	if (baseAssetAmount.eqZero()) return BigNum.zero();

	return BigNum.from(
		quoteAssetAmount.val
			.mul(PRICE_PRECISION)
			.mul(AMM_TO_QUOTE_PRECISION_RATIO)
			.div(baseAssetAmount.shiftTo(BASE_PRECISION_EXP).val)
			.abs(),
		PRICE_PRECISION_EXP
	);
};
