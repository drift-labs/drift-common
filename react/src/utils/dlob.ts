import { BN, BigNum, PRICE_PRECISION_EXP } from '@drift-labs/sdk';
import { L2WithOracle, RawL2Output } from '../types';

export const deserializeL2Response = (
	serializedOrderbook: RawL2Output
): L2WithOracle => {
	return {
		asks: serializedOrderbook.asks.map((ask) => ({
			price: new BN(ask.price),
			size: new BN(ask.size),
			sources: Object.entries(ask.sources).reduce((previous, [key, val]) => {
				return {
					...previous,
					[key]: new BN(val),
				};
			}, {}),
		})),
		bids: serializedOrderbook.bids.map((bid) => ({
			price: new BN(bid.price),
			size: new BN(bid.size),
			sources: Object.entries(bid.sources).reduce((previous, [key, val]) => {
				return {
					...previous,
					[key]: new BN(val),
				};
			}, {}),
		})),
		oraclePrice: BigNum.from(serializedOrderbook.oracle, PRICE_PRECISION_EXP)
			.val,
		slot: serializedOrderbook.slot,
	};
};
