import { DriftClient } from '@drift-labs/sdk';
import { useCommonDriftStore } from '../stores';

export const useDriftClient = (): DriftClient | undefined => {
	return useCommonDriftStore((s) => s.driftClient.client);
};
