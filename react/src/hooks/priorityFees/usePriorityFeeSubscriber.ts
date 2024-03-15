import { useDebounce } from 'react-use';
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
	const driftClient = useCommonDriftStore((s) => s.driftClient.client);

	const subscriber = useRef<PriorityFeeSubscriber>();

	const pollingFrequencyMs = usePriorityFeesPollingRate();

	useDebounce(
		() => {
			if (!connection) return;
			if (!driftClient) return;

			(async () => {
				const priorityFeeSubscriber = createPriorityFeeSubscriber(
					connection,
					pollingFrequencyMs,
					FEE_SUBSCRIPTION_SLOT_LOOKBACK,
					priorityFeeStrategy,
					priorityFeeSubscriptionAddresses
				);

				subscriber.current = priorityFeeSubscriber;

				await priorityFeeSubscriber.subscribe();
			})();

			return () => {
				subscriber.current?.unsubscribe();
			};
		},
		1000,
		[connection, driftClient, pollingFrequencyMs]
	);

	useEffect(() => {
		if (subscriber.current) {
			(async () => {
				await subscriber.current!.unsubscribe();
				subscriber.current!.frequencyMs = pollingFrequencyMs;
				await subscriber.current!.subscribe();
			})();
		}
	}, [pollingFrequencyMs]);

	return subscriber;
};
