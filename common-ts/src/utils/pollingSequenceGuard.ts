export const LATE_POLLING_RESPONSE = Symbol('Late polling response');

/**
 * Utility class which makes sure that asyncronous responses get rejected when we expect them to return in the same sequence that we request them but they don't
 */
export class PollingSequenceGuard {
	static pollingCounts = new Map<string | symbol, number>();
	static LATE_POLLING_RESPONSE = LATE_POLLING_RESPONSE;
	static async fetch<T>(
		key: string | symbol,
		cb: () => Promise<T>
	): Promise<T> {
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
