import { SLOT_TIME_ESTIMATE_MS } from '@drift-labs/sdk';

export function getSwiftConfirmationTimeoutMs(
	slotsTillAuctionEnd: number,
	multiplier?: number
): number {
	const baseMs = ((slotsTillAuctionEnd ?? 0) + 15) * SLOT_TIME_ESTIMATE_MS;
	return baseMs * (multiplier ?? 1);
}
