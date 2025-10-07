export function getNetworkTimeoutMultiplier(): number {
	if (typeof navigator === 'undefined') return 1;
	const nav = navigator as unknown as {
		connection?: { downlink?: number };
	};
	const downlink = nav.connection?.downlink;
	if (downlink === undefined || downlink <= 0) return 1;
	const baselineMbps = 25;
	const ratio = baselineMbps / downlink;
	return Math.max(1, Math.min(2, ratio));
}
