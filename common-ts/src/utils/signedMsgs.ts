import { SLOT_TIME_ESTIMATE_MS } from '@drift-labs/sdk';
import { getNetworkTimeoutMultiplier } from './network';

export function getSwiftConfirmationTimeoutMs(
	auctionDurationSlots: number
): number {
	const baseMs = ((auctionDurationSlots ?? 0) + 15) * SLOT_TIME_ESTIMATE_MS;
	return baseMs * getNetworkTimeoutMultiplier();
}
