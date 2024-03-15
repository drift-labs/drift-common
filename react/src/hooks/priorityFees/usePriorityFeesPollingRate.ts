import { useCommonDriftStore } from '../../stores';

export const usePriorityFeesPollingRate = () => {
	const pollingMultiplier = useCommonDriftStore((s) => s.pollingMultiplier);
	const basePollingRateMs = useCommonDriftStore((s) => s.env.basePollingRateMs);
	const priorityFeePollingMultiplier = useCommonDriftStore(
		(s) => s.env.priorityFeePollingMultiplier
	);

	const pollingFrequencyMs =
		basePollingRateMs *
		Math.max(pollingMultiplier, priorityFeePollingMultiplier);

	return pollingFrequencyMs;
};
