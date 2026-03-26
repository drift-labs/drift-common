import {
	BN,
	ContractTier,
	DriftClient,
	isOneOfVariant,
	MarketType,
	OrderParamsBitFlag,
	PERCENTAGE_PRECISION,
	User,
} from '@drift-labs/sdk';
import { getMaxLeverageForMarket } from '../markets/leverage';

export type HighLeverageOptions = {
	numOfOpenHighLeverageSpots?: number; // if not provided, the method will assume that there is spots open
	enterHighLeverageModeBufferPct?: number;
};

export function getPerpAuctionDuration(
	priceDiff: BN,
	price: BN,
	contractTier: ContractTier
): number {
	const percentDiff = priceDiff.mul(PERCENTAGE_PRECISION).div(price);

	const slotsPerBp = isOneOfVariant(contractTier, ['a', 'b'])
		? new BN(100)
		: new BN(60);

	const rawSlots = percentDiff
		.mul(slotsPerBp)
		.div(PERCENTAGE_PRECISION.divn(100));

	const clamped = BN.min(BN.max(rawSlots, new BN(5)), new BN(180));

	return clamped.toNumber();
}

/**
 * Mainly checks if the user will be entering high leverage mode through this order.
 */
export function getPerpOrderParamsBitFlags(
	marketIndex: number,
	driftClient: DriftClient,
	userAccount: User,
	attemptedLeverage: number,
	highLeverageOptions?: {
		numOfOpenHighLeverageSpots?: number; // if not provided, the method will assume that there is spots open
	}
): number | undefined {
	if (attemptedLeverage < 5) {
		// there is no high leverage mode leverage that is higher than 4
		return undefined;
	}

	const { numOfOpenHighLeverageSpots = Number.MAX_SAFE_INTEGER } =
		highLeverageOptions || {};

	if (numOfOpenHighLeverageSpots <= 0) {
		return undefined;
	}

	const {
		hasHighLeverage: isMarketAHighLeverageMarket,
		maxLeverage: regularMaxLeverage,
	} = getMaxLeverageForMarket(MarketType.PERP, marketIndex, driftClient);

	if (!isMarketAHighLeverageMarket) {
		return undefined;
	}

	// Check if user is already in high leverage mode
	if (userAccount.isHighLeverageMode('Initial')) {
		return undefined;
	}

	if (attemptedLeverage > regularMaxLeverage) {
		return OrderParamsBitFlag.UpdateHighLeverageMode;
	}

	return undefined;
}
