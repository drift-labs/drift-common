import {
	PriorityFeeStrategy,
	SolanaPriorityFeeResponse,
} from '@drift-labs/sdk';
import {
	BOOSTED_MULITPLIER,
	FEE_SUBSCRIPTION_SLOT_LOOKBACK,
	PRIORITY_FEE_SUBSCRIPTION_ADDRESS_STRINGS,
	TURBO_MULTIPLIER,
} from '../../constants/priorityFees';
import { FeeType, usePriorityFeeStore } from './usePriorityFeeStore';
import { useHeliusPriorityFees } from './useHeliusPriorityFees';
import { usePriorityFeeSubscriber } from './usePriorityFeeSubscriber';
import {
	PriorityFeeCalculator,
	SANITY_CHECK_ABS_MAX_FEE_IN_SOL,
} from '@drift/common';
import { useCallback, useEffect, useRef } from 'react';
import { useImmediateInterval } from '../../hooks/useImmediateInterval';
import { usePriorityFeesPollingRate } from '../../hooks/priorityFees/usePriorityFeesPollingRate';

const RECENT_SAMPLES: number[][] = []; // array of slots, each slot is an array of priority fees
let LAST_SEEN_SLOT_IN_SAMPLES = 0;

/**
 * Custom priority fee strategy that calculates the priority fee based on the recent samples.
 * New samples are provided to the calculate function, and the strategy uses the given percentile of
 * the the last 10 batches of recent samples as a benchmark for the priority fee to be used.
 */
const createPercentilePriorityFeeStrategy = (
	targetPercentile: number
): PriorityFeeStrategy => {
	const percentilePriorityFeeStrategy: PriorityFeeStrategy = {
		calculate(newSamples: SolanaPriorityFeeResponse[]) {
			if (!newSamples?.length) return 0;

			const filteredSamples = newSamples.filter(
				(sample) => sample.slot > LAST_SEEN_SLOT_IN_SAMPLES
			);

			RECENT_SAMPLES.unshift(newSamples.map((s) => s.prioritizationFee));
			RECENT_SAMPLES.splice(FEE_SUBSCRIPTION_SLOT_LOOKBACK);

			const allRecentSamplesAscendingSorted = RECENT_SAMPLES.flat().sort(
				(a, b) => {
					return a - b;
				}
			);

			const targetPercentileIndex = Math.min(
				allRecentSamplesAscendingSorted.length - 1,
				Math.ceil(
					(allRecentSamplesAscendingSorted.length / 100) * targetPercentile
				)
			);

			const shouldSplitWithBelow =
				targetPercentile < 100 &&
				targetPercentileIndex >= allRecentSamplesAscendingSorted.length - 1; // If the number of samples being returned are sufficiently small then in practise the target percentile is just selecting the MAX priority fee every time. For some safety, average top two instead when we get this case.

			const pFee = shouldSplitWithBelow
				? (allRecentSamplesAscendingSorted[targetPercentileIndex] +
						allRecentSamplesAscendingSorted[targetPercentileIndex - 1]) /
				  2
				: allRecentSamplesAscendingSorted[targetPercentileIndex];

			LAST_SEEN_SLOT_IN_SAMPLES = Math.max(
				...filteredSamples.map((sample) => sample.slot)
			);

			return pFee;
		},
	};

	return percentilePriorityFeeStrategy;
};

export const useSyncPriorityFeeStore = ({
	heliusRpcUrl,
	feeSubscriptionAddressStrings = PRIORITY_FEE_SUBSCRIPTION_ADDRESS_STRINGS,
	targetFeePercentile,
	userPriorityFeeType,
	userCustomMaxPriorityFeeCap,
	userCustomPriorityFee,
}: {
	heliusRpcUrl: string;
	feeSubscriptionAddressStrings?: string[];
	targetFeePercentile: number;
	userPriorityFeeType: FeeType;
	userCustomMaxPriorityFeeCap: number;
	userCustomPriorityFee: number;
}) => {
	const percentilePriorityFeeStrategy =
		createPercentilePriorityFeeStrategy(targetFeePercentile);

	const pollingFrequencyMs = usePriorityFeesPollingRate();
	const setPriorityFeeStore = usePriorityFeeStore((s) => s.set);
	const heliusFeeSampleRef = useHeliusPriorityFees(
		true,
		pollingFrequencyMs,
		heliusRpcUrl,
		feeSubscriptionAddressStrings,
		targetFeePercentile
	);
	const priorityFeeSubscriberRef = usePriorityFeeSubscriber(
		percentilePriorityFeeStrategy
	);

	const latestSubscriberFeeSample = useRef<number>();

	const updateRecentSubscriberFeeHistory = useCallback(() => {
		if (!priorityFeeSubscriberRef.current) {
			return;
		}

		const latestSubscriberFeeResult =
			priorityFeeSubscriberRef.current.lastCustomStrategyResult;

		latestSubscriberFeeSample.current = latestSubscriberFeeResult;
	}, [priorityFeeSubscriberRef.current]);

	useImmediateInterval(updateRecentSubscriberFeeHistory, pollingFrequencyMs);

	const getDynamicCUPrice = (boostMultiplier?: number) => {
		let cuPriceSampleToUse = Math.max(
			latestSubscriberFeeSample?.current ?? 0,
			heliusFeeSampleRef.current
		);

		if (isNaN(cuPriceSampleToUse)) {
			// Fallback for safety
			cuPriceSampleToUse = 0;
		}

		const dynamicCUPriceTouse =
			PriorityFeeCalculator.calculateDynamicCUPriceToUse({
				latestFeeSample: cuPriceSampleToUse,
				boostMultiplier: boostMultiplier,
			});

		return dynamicCUPriceTouse;
	};

	const getPriorityFeeToUse = useCallback(
		(computeUnitsLimit?: number, feeTypeOverride?: FeeType) => {
			const priorityFeeSetting = feeTypeOverride ?? userPriorityFeeType;

			let cuPriceToUse: number = 0;

			if (priorityFeeSetting === 'custom') {
				cuPriceToUse = PriorityFeeCalculator.calculateCUPriceForTargetSolValue(
					userCustomPriorityFee ?? 0,
					computeUnitsLimit
				);
			}

			if (priorityFeeSetting === 'dynamic') {
				cuPriceToUse = getDynamicCUPrice();
			}

			if (priorityFeeSetting === 'boosted') {
				cuPriceToUse = getDynamicCUPrice(BOOSTED_MULITPLIER);
			}

			if (priorityFeeSetting === 'turbo') {
				cuPriceToUse = getDynamicCUPrice(TURBO_MULTIPLIER);
			}

			if (isNaN(cuPriceToUse)) {
				cuPriceToUse = 0;
			}

			// apply the user max cap if not a custom fixed fee
			if (userPriorityFeeType !== 'custom') {
				const feeCapToComputeUnits =
					PriorityFeeCalculator.calculateCUPriceForTargetSolValue(
						userCustomMaxPriorityFeeCap,
						computeUnitsLimit
					);

				cuPriceToUse = Math.min(cuPriceToUse, feeCapToComputeUnits);
			} else {
				const sanityCheckMaxFee =
					PriorityFeeCalculator.calculateCUPriceForTargetSolValue(
						SANITY_CHECK_ABS_MAX_FEE_IN_SOL,
						computeUnitsLimit
					);

				// shouldnt be possible
				cuPriceToUse = Math.min(cuPriceToUse, sanityCheckMaxFee);
			}

			const priorityFeeInSol =
				PriorityFeeCalculator.getPriorityFeeInSolForComputeUnitPrice(
					cuPriceToUse,
					computeUnitsLimit
				);

			return { priorityFeeInSol, computeUnitsPrice: cuPriceToUse };
		},
		[userPriorityFeeType, userCustomPriorityFee, userCustomMaxPriorityFeeCap]
	);

	useEffect(() => {
		setPriorityFeeStore((s) => {
			s.ready = true;
			s.getPriorityFeeToUse = getPriorityFeeToUse;
		});
	}, [getPriorityFeeToUse]);
};
