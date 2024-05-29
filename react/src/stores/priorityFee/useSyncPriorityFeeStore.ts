import {
	PriorityFeeCalculator,
	PriorityFeeStrategyFactory,
	SANITY_CHECK_ABS_MAX_FEE_IN_SOL,
} from '@drift/common';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
	BOOSTED_MULITPLIER,
	FEE_SUBSCRIPTION_SLOT_LOOKBACK,
	PRIORITY_FEE_SUBSCRIPTION_ADDRESS_STRINGS,
	TURBO_MULTIPLIER,
} from '../../constants/priorityFees';
import { usePriorityFeesPollingRate } from '../../hooks/priorityFees/usePriorityFeesPollingRate';
import { useImmediateInterval } from '../../hooks/useImmediateInterval';
import { useHeliusPriorityFees } from './useHeliusPriorityFees';
import { FeeType, usePriorityFeeStore } from './usePriorityFeeStore';
import { usePriorityFeeSubscriber } from '../../hooks/priorityFees/usePriorityFeeSubscriber';

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
	userCustomPriorityFee: number | null;
}) => {
	const percentilePriorityFeeStrategy = useMemo(
		() =>
			PriorityFeeStrategyFactory.movingWindowTargetPercentileStrategy(
				targetFeePercentile,
				FEE_SUBSCRIPTION_SLOT_LOOKBACK
			),
		[targetFeePercentile]
	);

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

	const latestSubscriberFeeSample = useRef<number>(0);

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
		if (latestSubscriberFeeSample.current > 0 && getPriorityFeeToUse) {
			setPriorityFeeStore((s) => {
				s.ready = true;
				s.getPriorityFeeToUse = getPriorityFeeToUse;
			});
		}
	}, [getPriorityFeeToUse, latestSubscriberFeeSample.current]);
};
