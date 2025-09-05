import { describe, expect, test, jest } from '@jest/globals';
import { CallbackLimiter, sleep } from '../../src/utils';

jest.useRealTimers();

//
describe('utils-tests', () => {
	test('callback-limiter', async () => {
		const callbackLimiter = new CallbackLimiter();

		const testCallback = async () => {
			await sleep(1000);
			return;
		};

		// Test case one
		//// Run test callback once
		(async () => {
			const results = [];
			const skips = [];
			const tests = new Array(1);

			for (const _ of tests) {
				const result = await callbackLimiter.send(testCallback);

				if (result.status === 'RESULT') {
					results.push(1);
				} else {
					skips.push(1);
				}
			}

			expect(results.length).toEqual(1);
			expect(skips.length).toEqual(0);
		})();

		await sleep(2000);

		// Test case two
		//// Run test callback 4 times
		(async () => {
			const results = [];
			const skips = [];
			const tests = new Array(4);

			for (const _ of tests) {
				const result = await callbackLimiter.send(testCallback);

				if (result.status === 'RESULT') {
					results.push(1);
				} else {
					skips.push(1);
				}
			}

			expect(results.length).toEqual(1);
			expect(skips.length).toEqual(3);
		})();

		// Test case three
		//// Run test callback twice, with a sleep between
		(async () => {
			const results = [];
			const skips = [];
			const tests = new Array(2);

			for (const _ of tests) {
				const result = await callbackLimiter.send(testCallback);

				if (result.status === 'RESULT') {
					results.push(1);
				} else {
					skips.push(1);
				}

				await sleep(2000);
			}

			expect(results.length).toEqual(2);
			expect(skips.length).toEqual(0);
		})();
	});
});
