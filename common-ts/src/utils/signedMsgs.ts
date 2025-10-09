import { SLOT_TIME_ESTIMATE_MS } from '@drift-labs/sdk';

export function getSwiftConfirmationTimeoutMs(
	auctionDurationSlots: number,
	multiplier: number
): number {
	const baseMs = ((auctionDurationSlots ?? 0) + 15) * SLOT_TIME_ESTIMATE_MS;
	return baseMs * multiplier;
}
