import {
	BN,
	PRICE_PRECISION,
	PositionDirection,
	ZERO,
	isVariant,
} from '@drift-labs/sdk';
import { UIOrderType } from '../../types';

const getMarketOrderLimitPrice = ({
	direction,
	baselinePrice,
	slippageTolerance,
}: {
	direction: PositionDirection;
	baselinePrice: BN;
	slippageTolerance: number;
}): BN => {
	let limitPrice;

	if (!baselinePrice) return ZERO;

	if (slippageTolerance === 0) return baselinePrice;

	// infinite slippage capped at 15% currently
	if (slippageTolerance == undefined) slippageTolerance = 15;

	// if manually entered, cap at 99%
	if (slippageTolerance > 99) slippageTolerance = 99;

	let limitPricePctDiff;
	if (isVariant(direction, 'long')) {
		limitPricePctDiff = PRICE_PRECISION.add(
			new BN(slippageTolerance * PRICE_PRECISION.toNumber()).div(new BN(100))
		);
		limitPrice = baselinePrice.mul(limitPricePctDiff).div(PRICE_PRECISION);
	} else {
		limitPricePctDiff = PRICE_PRECISION.sub(
			new BN(slippageTolerance * PRICE_PRECISION.toNumber()).div(new BN(100))
		);
		limitPrice = baselinePrice.mul(limitPricePctDiff).div(PRICE_PRECISION);
	}

	return limitPrice;
};

/**
 * Check if the order type is a market order or oracle market order
 */
const checkIsMarketOrderType = (orderType: UIOrderType) => {
	return orderType === 'market' || orderType === 'oracle';
};

export { getMarketOrderLimitPrice, checkIsMarketOrderType };
