import { BigNum } from '@drift-labs/sdk';
import { AuctionParams } from '../../types';
import { EMPTY_AUCTION_PARAMS } from '../../constants/trade';
import { UISerializableOrder } from '../../serializableTypes';

export const getLimitPriceFromOracleOffset = (
	order: UISerializableOrder,
	oraclePrice: BigNum
): BigNum => {
	if (
		(order.price && !order.price.eqZero()) ||
		!order.oraclePriceOffset ||
		order.oraclePriceOffset.eqZero() ||
		!oraclePrice ||
		oraclePrice?.eqZero()
	) {
		return order.price;
	}
	return oraclePrice.add(order.oraclePriceOffset);
};

export function isAuctionEmpty(auctionParams: AuctionParams) {
	return (
		auctionParams.auctionStartPrice ===
			EMPTY_AUCTION_PARAMS.auctionStartPrice &&
		auctionParams.auctionEndPrice === EMPTY_AUCTION_PARAMS.auctionEndPrice &&
		auctionParams.auctionDuration === EMPTY_AUCTION_PARAMS.auctionDuration
	);
}
