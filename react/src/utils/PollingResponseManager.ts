export const LATE_POLLING_RESPONSE = Symbol('Late polling response');

/**
 * Utility class which makes sure that polling responses get rejected
 * if they arrive later than a response we've already received.
 */
export class PollingResponseManager {
	private static pollingCounts = new Map<string | symbol, number>();

	static LATE_RESPONSE_REJECTION = LATE_POLLING_RESPONSE;

	static async poll(key: string | symbol, cb: () => Promise<any>) {
		const newCount = (this.pollingCounts.get(key) ?? 0) + 1;

		const promise = await cb();

		const latestCount = this.pollingCounts.get(key) ?? 0;

		if (latestCount > newCount) {
			return Promise.reject(LATE_POLLING_RESPONSE);
		}

		this.pollingCounts.set(key, newCount);

		return promise;
	}
}
