import { useEffect, useRef } from 'react';
import { useIdle } from 'react-use';
import useDriftClientIsReady from './useDriftClientIsReady';
import { PollingDriftClientAccountSubscriber } from '@drift-labs/sdk';
import { useCommonDriftStore } from '../stores';

const IDLE_1_MIN_POLLING_RATE = 10000;
const IDLE_10_MIN_POLLING_RATE = 60000;

/**
 * Switches the polling rate of the bulkAccountLoader based on idle time of the user
 */
const useIdlePollingRateSwitcher = () => {
	const idle1Minute = useIdle(60e3);
	const idle10Minutes = useIdle(600e3);
	const wasIdle = useRef(false);
	const driftClient = useCommonDriftStore((s) => s.driftClient.client);
	const driftClientIsReady = useDriftClientIsReady();
	const env = useCommonDriftStore((s) => s.env);

	const BASE_POLLING_RATE = env.basePollingRateMs;

	useEffect(() => {
		if (!driftClientIsReady || !driftClient) return;

		if (
			driftClient.accountSubscriber instanceof
			PollingDriftClientAccountSubscriber
		) {
			if (idle10Minutes) {
				wasIdle.current = true;
				driftClient.accountSubscriber.updateAccountLoaderPollingFrequency(
					IDLE_10_MIN_POLLING_RATE
				);
			} else if (idle1Minute) {
				wasIdle.current = true;
				driftClient.accountSubscriber.updateAccountLoaderPollingFrequency(
					IDLE_1_MIN_POLLING_RATE
				);
			} else if (wasIdle.current) {
				wasIdle.current = false;
				driftClient.accountSubscriber.updateAccountLoaderPollingFrequency(
					BASE_POLLING_RATE
				);
			}
		}
	}, [idle1Minute, idle10Minutes, driftClientIsReady, BASE_POLLING_RATE]);
};

export default useIdlePollingRateSwitcher;
