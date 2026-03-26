export async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const timedPromise = async <T>(promise: T) => {
	const start = Date.now();
	const promiseResult = await promise;

	return {
		promiseTime: Date.now() - start,
		promiseResult,
	};
};

export { timedPromise };
