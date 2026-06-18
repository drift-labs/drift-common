export async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const timedPromise = async <T>(promise: Promise<T>) => {
	const start = Date.now();
	const promiseResult = await promise;

	return {
		promiseTime: Date.now() - start,
		promiseResult,
	};
};
