import {
	BN,
	BigNum,
	MarketType,
	OptionalOrderParams,
	OrderType,
	PRICE_PRECISION,
	PositionDirection,
	ZERO,
	deriveOracleAuctionParams,
	getMarketOrderParams,
	isVariant,
} from '@drift-labs/sdk';
import { AuctionParams, TradeOffsetPrice } from '../../types';
import { EMPTY_AUCTION_PARAMS } from '../../constants/trade';
import { getMarketOrderLimitPrice } from './price';

const getMarketAuctionParams = ({
	direction,
	startPriceFromSettings,
	endPriceFromSettings,
	limitPrice,
	duration,
	auctionStartPriceOffset,
	auctionEndPriceOffset,
	additionalEndPriceBuffer,
	forceUpToSlippage,
	bestBidPrice,
	bestAskPrice,
	ensureCrossingEndPrice,
}: {
	direction: PositionDirection;
	startPriceFromSettings: BN;
	endPriceFromSettings: BN;
	/**
	 * Limit price is the oracle limit price - market orders use the oracle order type under the hood on Drift UI
	 * So oracle limit price is the oracle price + oracle offset
	 */
	limitPrice: BN;
	duration: number;
	auctionStartPriceOffset: number;
	auctionEndPriceOffset: number;
	additionalEndPriceBuffer?: BN;
	forceUpToSlippage?: boolean;
	bestBidPrice?: BN;
	bestAskPrice?: BN;
	ensureCrossingEndPrice?: boolean;
}): AuctionParams => {
	let auctionStartPrice: BN;
	let auctionEndPrice: BN;
	let constrainedBySlippage: boolean;

	const auctionEndPriceBuffer = BigNum.from(PRICE_PRECISION).scale(
		Math.abs(auctionEndPriceOffset * 100),
		10000
	).val;

	const auctionStartPriceBuffer = BigNum.from(startPriceFromSettings).scale(
		Math.abs(auctionStartPriceOffset * 100),
		10000
	).val;

	if (isVariant(direction, 'long')) {
		auctionStartPrice = startPriceFromSettings.sub(auctionStartPriceBuffer);

		const worstPriceToUse = BN.max(
			endPriceFromSettings,
			startPriceFromSettings
		); // Handles edge cases like if the worst price on the book was better than the oracle price, and the settings are asking to be relative to the oracle price

		auctionEndPrice = PRICE_PRECISION.add(auctionEndPriceBuffer)
			.mul(worstPriceToUse)
			.div(PRICE_PRECISION);

		constrainedBySlippage = limitPrice.lt(auctionEndPrice);

		// if forceUpToSlippage is passed, use max slippage price as end price
		if (forceUpToSlippage) {
			auctionEndPrice = limitPrice;
			constrainedBySlippage = false;
		} else {
			// use BEST (limit price, auction end price) as end price
			auctionEndPrice = BN.min(limitPrice, auctionEndPrice);
		}

		// apply additional buffer if provided
		if (additionalEndPriceBuffer) {
			auctionEndPrice = auctionEndPrice.add(additionalEndPriceBuffer);
			constrainedBySlippage = limitPrice.lt(auctionEndPrice);
		}

		// if ensureCrossingEndPrice is passed, ensure auction end price crosses bestAskPrice
		if (ensureCrossingEndPrice && bestAskPrice) {
			auctionEndPrice = BN.max(
				auctionEndPrice,
				bestAskPrice.add(auctionEndPriceBuffer)
			);
		}

		auctionStartPrice = BN.min(auctionStartPrice, auctionEndPrice);
	} else {
		auctionStartPrice = startPriceFromSettings.add(auctionStartPriceBuffer);

		const worstPriceToUse = BN.min(
			endPriceFromSettings,
			startPriceFromSettings
		); // Handles edge cases like if the worst price on the book was better than the oracle price, and the settings are asking to be relative to the oracle price

		auctionEndPrice = PRICE_PRECISION.sub(auctionEndPriceBuffer)
			.mul(worstPriceToUse)
			.div(PRICE_PRECISION);

		constrainedBySlippage = limitPrice.gt(auctionEndPrice);

		// if forceUpToSlippage is passed, use max slippage price as end price
		if (forceUpToSlippage) {
			auctionEndPrice = limitPrice;
			constrainedBySlippage = false;
		} else {
			// use BEST (limit price, auction end price) as end price
			auctionEndPrice = BN.max(limitPrice, auctionEndPrice);
		}

		// apply additional buffer if provided
		if (additionalEndPriceBuffer) {
			auctionEndPrice = auctionEndPrice.sub(additionalEndPriceBuffer);
			constrainedBySlippage = limitPrice.gt(auctionEndPrice);
		}

		// if ensureCrossingEndPrice is passed, ensure auction end price crosses bestBidPrice
		if (ensureCrossingEndPrice && bestBidPrice) {
			auctionEndPrice = BN.min(
				auctionEndPrice,
				bestBidPrice.sub(auctionEndPriceBuffer)
			);
		}

		auctionStartPrice = BN.max(auctionStartPrice, auctionEndPrice);
	}

	return {
		auctionStartPrice,
		auctionEndPrice,
		auctionDuration: duration,
		constrainedBySlippage,
	};
};

/**
 * Helper function which derived market order params from the CORE data that is used to create them.
 * @param param0
 * @returns
 */
const deriveMarketOrderParams = ({
	marketType,
	marketIndex,
	direction,
	maxLeverageSelected,
	maxLeverageOrderSize,
	baseAmount,
	reduceOnly,
	allowInfSlippage,
	oraclePrice,
	bestPrice,
	entryPrice,
	worstPrice,
	markPrice,
	auctionDuration,
	auctionStartPriceOffset,
	auctionEndPriceOffset,
	auctionStartPriceOffsetFrom,
	auctionEndPriceOffsetFrom,
	auctionPriceCaps,
	slippageTolerance,
	isOracleOrder,
	additionalEndPriceBuffer,
	forceUpToSlippage,
	bestBidPrice,
	bestAskPrice,
	ensureCrossingEndPrice,
}: {
	marketType: MarketType;
	marketIndex: number;
	direction: PositionDirection;
	maxLeverageSelected: boolean;
	maxLeverageOrderSize: BN;
	baseAmount: BN;
	reduceOnly: boolean;
	allowInfSlippage: boolean;
	oraclePrice: BN;
	bestPrice: BN;
	entryPrice: BN;
	worstPrice: BN;
	markPrice: BN;
	auctionDuration: number;
	auctionStartPriceOffset: number;
	auctionEndPriceOffset: number;
	auctionPriceCaps?: {
		min: BN;
		max: BN;
	};
	auctionStartPriceOffsetFrom: TradeOffsetPrice;
	auctionEndPriceOffsetFrom: TradeOffsetPrice;
	slippageTolerance: number;
	isOracleOrder?: boolean;
	additionalEndPriceBuffer?: BN;
	forceUpToSlippage?: boolean;
	bestBidPrice?: BN;
	bestAskPrice?: BN;
	ensureCrossingEndPrice?: boolean;
}): OptionalOrderParams & { constrainedBySlippage?: boolean } => {
	const priceObject = getPriceObject({
		oraclePrice,
		markPrice,
		bestOffer: bestPrice,
		entryPrice,
		worstPrice,
		direction,
	});

	// max slippage price
	let limitPrice = getMarketOrderLimitPrice({
		direction,
		baselinePrice: priceObject[auctionStartPriceOffsetFrom],
		slippageTolerance: allowInfSlippage ? undefined : slippageTolerance,
	});

	if (additionalEndPriceBuffer) {
		limitPrice = isVariant(direction, 'long')
			? limitPrice.add(additionalEndPriceBuffer)
			: limitPrice.sub(additionalEndPriceBuffer);
	}

	const auctionParams = getMarketAuctionParams({
		direction,
		startPriceFromSettings: priceObject[auctionStartPriceOffsetFrom],
		endPriceFromSettings: priceObject[auctionEndPriceOffsetFrom],
		limitPrice,
		duration: auctionDuration,
		auctionStartPriceOffset: auctionStartPriceOffset,
		auctionEndPriceOffset: auctionEndPriceOffset,
		additionalEndPriceBuffer,
		forceUpToSlippage,
		bestBidPrice,
		bestAskPrice,
		ensureCrossingEndPrice,
	});

	let orderParams = getMarketOrderParams({
		marketType,
		marketIndex,
		direction,
		baseAssetAmount: maxLeverageSelected ? maxLeverageOrderSize : baseAmount,
		reduceOnly,
		price: allowInfSlippage ? undefined : limitPrice,
		...auctionParams,
	});

	if (isOracleOrder) {
		// wont work if oracle is zero
		if (!oraclePrice.eq(ZERO)) {
			const oracleAuctionParams = deriveOracleAuctionParams({
				direction: direction,
				oraclePrice,
				auctionStartPrice: auctionParams.auctionStartPrice,
				auctionEndPrice: auctionParams.auctionEndPrice,
				limitPrice: auctionParams.auctionEndPrice,
				auctionPriceCaps: auctionPriceCaps,
			});

			orderParams = {
				...orderParams,
				...oracleAuctionParams,
				price: undefined,
				orderType: OrderType.ORACLE,
			};
		}
	}

	return orderParams;
};

const getLimitAuctionParams = ({
	direction,
	inputPrice,
	startPriceFromSettings,
	duration,
	auctionStartPriceOffset,
	oraclePriceBands,
}: {
	direction: PositionDirection;
	inputPrice: BigNum;
	startPriceFromSettings: BN;
	duration: number;
	auctionStartPriceOffset: number;
	oraclePriceBands?: [BN, BN];
}): AuctionParams => {
	let limitAuctionParams = EMPTY_AUCTION_PARAMS;

	const auctionStartPriceBuffer = inputPrice.scale(
		Math.abs(auctionStartPriceOffset * 100),
		10000
	).val;

	if (
		isVariant(direction, 'long') &&
		startPriceFromSettings &&
		startPriceFromSettings.lt(inputPrice.val) &&
		startPriceFromSettings.gt(ZERO)
	) {
		limitAuctionParams = {
			auctionStartPrice: startPriceFromSettings.sub(auctionStartPriceBuffer),
			auctionEndPrice: inputPrice.val,
			auctionDuration: duration,
		};
	} else if (
		isVariant(direction, 'short') &&
		startPriceFromSettings &&
		startPriceFromSettings.gt(ZERO) &&
		startPriceFromSettings.gt(inputPrice.val)
	) {
		limitAuctionParams = {
			auctionStartPrice: startPriceFromSettings.add(auctionStartPriceBuffer),
			auctionEndPrice: inputPrice.val,
			auctionDuration: duration,
		};
	}

	if (oraclePriceBands && limitAuctionParams.auctionDuration) {
		const [minPrice, maxPrice] = oraclePriceBands;

		// start and end price cant be outside of the oracle price bands
		limitAuctionParams.auctionStartPrice = BN.max(
			BN.min(limitAuctionParams.auctionStartPrice, maxPrice),
			minPrice
		);

		limitAuctionParams.auctionEndPrice = BN.max(
			BN.min(limitAuctionParams.auctionEndPrice, maxPrice),
			minPrice
		);
	}

	return limitAuctionParams;
};

const getPriceObject = ({
	oraclePrice,
	bestOffer,
	entryPrice,
	worstPrice,
	markPrice,
	direction,
}: {
	oraclePrice: BN;
	bestOffer: BN;
	entryPrice: BN;
	worstPrice: BN;
	markPrice: BN;
	direction: PositionDirection;
}) => {
	let best: BN;

	const nonZeroOptions = [oraclePrice, bestOffer, markPrice].filter(
		(price) => price !== undefined && price?.gt(ZERO)
	);

	if (nonZeroOptions.length === 0) {
		// console.error('Unable to create valid auction params');
		return {
			oracle: ZERO,
			bestOffer: ZERO,
			entry: ZERO,
			best: ZERO,
			worst: ZERO,
			mark: ZERO,
		};
	}

	if (isVariant(direction, 'long')) {
		best = nonZeroOptions.reduce((a, b) => (a.lt(b) ? a : b)); // lowest price
	} else {
		best = nonZeroOptions.reduce((a, b) => (a.gt(b) ? a : b)); // highest price
	}

	// if zero values come through, fallback to nonzero value
	return {
		oracle: oraclePrice?.gt(ZERO) ? oraclePrice : best,
		bestOffer: bestOffer?.gt(ZERO) ? bestOffer : best,
		entry: entryPrice,
		best,
		worst: worstPrice,
		mark: markPrice?.gt(ZERO) ? markPrice : best,
	};
};

export {
	getMarketAuctionParams,
	deriveMarketOrderParams,
	getLimitAuctionParams,
	getPriceObject,
};
