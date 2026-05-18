import {
	BN,
	ContractTier,
	isOneOfVariant,
	PERCENTAGE_PRECISION,
} from '@velocity-exchange/sdk';

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
