import { useEffect, useRef } from 'react';
import { useIdle } from 'react-use';
import { useDriftClientIsReady } from './useDriftClientIsReady';
import { PollingDriftClientAccountSubscriber } from '@drift-labs/sdk';
import { useCommonDriftStore } from '../stores';

const IDLE_1_MIN_POLLING_RATE = 10000;
const IDLE_10_MIN_POLLING_RATE = 60000;

const IDLE_1_MIN_POLLING_MULTIPLIER = 10;
const IDLE_10_MIN_POLLING_MULTIPLIER = 60;

/**
 * Switches the polling rate of the bulkAccountLoader based on idle time of the user
 */
const useIdlePollingRateSwitcher = () => {
	const idle1Minute = useIdle(60e3);
	const idle10Minutes = useIdle(600e3);
	const wasIdle = useRef(false);
	const setCommonDriftStore = useCommonDriftStore((s) => s.set);
	const driftClient = useCommonDriftStore((s) => s.driftClient.client);
	const driftClientIsReady = useDriftClientIsReady();
	const basePollingRateMs = useCommonDriftStore((s) => s.env.basePollingRateMs);

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
				setCommonDriftStore((s) => {
					s.pollingMultiplier = IDLE_10_MIN_POLLING_MULTIPLIER;
				});
			} else if (idle1Minute) {
				wasIdle.current = true;
				driftClient.accountSubscriber.updateAccountLoaderPollingFrequency(
					IDLE_1_MIN_POLLING_RATE
				);
				setCommonDriftStore((s) => {
					s.pollingMultiplier = IDLE_1_MIN_POLLING_MULTIPLIER;
				});
			} else if (wasIdle.current) {
				wasIdle.current = false;
				driftClient.accountSubscriber.updateAccountLoaderPollingFrequency(
					basePollingRateMs
				);
				setCommonDriftStore((s) => {
					s.pollingMultiplier = 1;
				});
			}
		}
	}, [idle1Minute, idle10Minutes, driftClientIsReady, basePollingRateMs]);
};

export default useIdlePollingRateSwitcher;
