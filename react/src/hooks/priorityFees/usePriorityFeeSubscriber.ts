import {
	FEE_SUBSCRIPTION_SLOT_LOOKBACK,
	PRIORITY_FEE_SUBSCRIPTION_ADDRESSES,
} from '../../constants/priorityFees';
import { useCommonDriftStore } from '../../stores/useCommonDriftStore';
import { PriorityFeeStrategy, PriorityFeeSubscriber } from '@drift-labs/sdk';
import { useEffect, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { usePriorityFeesPollingRate } from './usePriorityFeesPollingRate';

const createPriorityFeeSubscriber = (
	connection: Connection,
	frequencyMs: number,
	slotsToCheck: number,
	customStrategy: PriorityFeeStrategy,
	priorityFeeSubscriptionAddresses = PRIORITY_FEE_SUBSCRIPTION_ADDRESSES
) => {
	const priorityFeeSubscriber = new PriorityFeeSubscriber({
		connection,
		frequencyMs,
		addresses: priorityFeeSubscriptionAddresses,
		slotsToCheck,
		customStrategy,
	});

	return priorityFeeSubscriber;
};

export const usePriorityFeeSubscriber = (
	priorityFeeStrategy: PriorityFeeStrategy,
	priorityFeeSubscriptionAddresses?: PublicKey[]
) => {
	const connection = useCommonDriftStore((s) => s.connection);

	const subscriber = useRef<PriorityFeeSubscriber | undefined>(undefined);

	const pollingFrequencyMs = usePriorityFeesPollingRate();

	useEffect(() => {
		if (!connection || !pollingFrequencyMs || !priorityFeeStrategy) return;

		const priorityFeeSubscriber = createPriorityFeeSubscriber(
			connection,
			pollingFrequencyMs,
			FEE_SUBSCRIPTION_SLOT_LOOKBACK,
			priorityFeeStrategy,
			priorityFeeSubscriptionAddresses
		);

		subscriber.current = priorityFeeSubscriber;

		priorityFeeSubscriber.subscribe();

		return () => {
			priorityFeeSubscriber?.unsubscribe();
		};
	}, [connection, pollingFrequencyMs, priorityFeeStrategy]);

	return subscriber;
};
