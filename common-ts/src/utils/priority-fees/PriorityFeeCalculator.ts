import { LAMPORTS_PER_SOL } from '@solana/web3.js';

function calculateCUPriceForTargetSolValue(
	targetSolValue: number,
	txComputeUnits = DRIFT_TX_COMPUTE_UNIT_ESTIMATE
) {
	const targetFeeInSol = targetSolValue;
	const targetFeeInLamports = targetFeeInSol * LAMPORTS_PER_SOL;
	const targetFeeInMicroLamports = targetFeeInLamports * 10 ** 6;

	const targetMicroLamportsPerComputeUnit = Math.round(
		targetFeeInMicroLamports / txComputeUnits
	);

	return targetMicroLamportsPerComputeUnit;
}

function calculateCUPriceForTargetUsdValue(
	targetUsdValue: number,
	solPrice: number,
	txComputeUnits: number
) {
	const targetFeeInSol = targetUsdValue / solPrice;

	return calculateCUPriceForTargetSolValue(targetFeeInSol, txComputeUnits);
}

function getPriorityFeeInLamportsForComputeUnitPrice(
	computeUnitPrice: number,
	txComputeUnits = DRIFT_TX_COMPUTE_UNIT_ESTIMATE
) {
	const priorityFeeLamports = Math.round(
		(computeUnitPrice / 10 ** 6) * txComputeUnits
	); // Compute units are in microLamports (10**6) / computeUnit

	return priorityFeeLamports;
}

function getPriorityFeeInSolForComputeUnitPrice(
	computeUnitPrice: number,
	txComputeUnits = DRIFT_TX_COMPUTE_UNIT_ESTIMATE
) {
	return +(
		getPriorityFeeInLamportsForComputeUnitPrice(
			computeUnitPrice,
			txComputeUnits
		) / LAMPORTS_PER_SOL
	).toFixed(Math.log10(LAMPORTS_PER_SOL));
}

export const DRIFT_TX_COMPUTE_UNIT_ESTIMATE = 600_000;

// Non-relative acceptable maximum is 0.1 USD x THE_BOOST_MULTIPLIER
export const NONRELATIVE_MAX_ACCEPTABLE_PRIORITY_FEE_USD = 0.1;

// Relative acceptable maximum is 1 BP
export const ACCEPTABLE_MAX_RELATIVE_NOTIONAL_FEE_BPS = 1;
export const ACCEPTABLE_MAX_RELATIVE_NOTIONAL_FEE_MULTIPLIER =
	ACCEPTABLE_MAX_RELATIVE_NOTIONAL_FEE_BPS / 10 ** 4;

export const SANITY_CHECK_SOL_PRICE_MINIMUM = 10;
export const SANITY_CHECK_SOL_PRICE_MAXIMUM = 10_000;

export const SANITY_CHECK_ABS_MAX_FEE_IN_SOL = 1;
export const SANITY_CHECK_ABS_MAX_CU_PRICE = calculateCUPriceForTargetSolValue(
	SANITY_CHECK_ABS_MAX_FEE_IN_SOL,
	DRIFT_TX_COMPUTE_UNIT_ESTIMATE
);

export const FEE_CALCULATOR_RELATIVE_MAX_FEE_ENABLED = false;

const getSanityCheckedCUPrice = (cuPrice: number) => {
	return Math.min(cuPrice, SANITY_CHECK_ABS_MAX_CU_PRICE);
};

/**
 * The goal of this class is to encapsulate all logic around "priority fee calculation". The majority of the complexity is in calculating the dynamic priority fees, because the other settings are very simple.
 *
 * Priority Fees are determined by a "compute unit price". The compute unit price is denominated in "micro-lamports per compute unit". The end fee for the transactions is calculated as:
 * FEE_LAMPORTS = COMPUTE_UNIT_PRICE_MICRO_LAMPORTS * COMPUTE_UNITS * 10^6
 */
export class PriorityFeeCalculator {
	constructor() {}

	/**
	 * The baseline dynamic priority fee is the "target" dynamic priority fee to use. It is based on the latest results on the priority fee subscriber, and some other contextual information. It does NOT have any sanity checks or human-UX bounds applied.
	 * @param latestSubscriberFeeResults
	 * @param recentTimeoutCount
	 * @param currentSlot
	 * @param latestOracleSlot
	 * @returns
	 */
	public static calculateBaselineDynamicPriorityFee(
		latestSubscriberFeeResult: number,
		recentTimeoutCount: number,
		boostMultiplier = 1,
		extraMulitiplier = 1
	) {
		// Calculate baseline fee using the average of the most recent subscriber fee results, to normalise swings in priority fee from block to block
		let baseLineFee = latestSubscriberFeeResult;

		// add the boost multiplier
		baseLineFee *= boostMultiplier;

		// add an extra multiplier (default to 1) that comes from env var, can be increased thru vercel during turbulence
		baseLineFee *= extraMulitiplier;

		// round
		baseLineFee = Math.round(baseLineFee);

		return getSanityCheckedCUPrice(baseLineFee);
	}

	/**
	 * This method returns the dynamic fee to use, bounded by the acceptable non-relative maximum fee in USD.
	 * @param baseLineDynamicFeeCUPrice
	 * @param solPrice
	 * @returns
	 */
	private static calculateUSDBoundedDynamicFeeToUse(
		baseLineDynamicFeeCUPrice: number,
		solPrice: number,
		boostMultiplier?: number
	) {
		const nonrelativeMaxAcceptableCUPrice =
			PriorityFeeCalculator.calculateCUPriceForTargetUsdValue(
				NONRELATIVE_MAX_ACCEPTABLE_PRIORITY_FEE_USD * boostMultiplier,
				solPrice
			);

		if (baseLineDynamicFeeCUPrice > nonrelativeMaxAcceptableCUPrice) {
			return nonrelativeMaxAcceptableCUPrice;
		}

		return baseLineDynamicFeeCUPrice;
	}

	private static calculateRelativeBoundedDynamicFeeTouse(
		notionalTxValue: number,
		solPrice: number,
		baseLineDynamicFeeCUPrice: number,
		boundedCuPrice: number
	) {
		const maxRelativeAcceptableFeeUsd =
			notionalTxValue * ACCEPTABLE_MAX_RELATIVE_NOTIONAL_FEE_MULTIPLIER;

		const maxRelativeAcceptableFeeCUPrice =
			PriorityFeeCalculator.calculateCUPriceForTargetUsdValue(
				maxRelativeAcceptableFeeUsd,
				solPrice
			);

		// We should only consider the relative acceptable fee if the target baseline fee is greater than the absolute max allowed => this is the only time that the fees on chain are spiking and the user might be willing to pay more
		if (
			baseLineDynamicFeeCUPrice > boundedCuPrice &&
			maxRelativeAcceptableFeeCUPrice > boundedCuPrice
		) {
			/**
			 * USE RELATIVE FEES
			 *
			 * We return the minimum of the target basline fee or the acceptable relative fee.
			 */
			return Math.min(
				maxRelativeAcceptableFeeCUPrice,
				baseLineDynamicFeeCUPrice
			);
		}

		// Use the minimum of the target baseline fee or the acceptable absolute fee
		return boundedCuPrice;
	}

	/**
	 ** AN EXPLANATION FOR DYNAMIC FEE CALCULATION:
	 *
	 * The heuristic:
	 * - Users want their drift txs to go through quickly, so we're going to be aggressive with them. The "baseline" dynamic fee calculation should be targetting this based on the state of the network - although it doesn't have any "human" ux heuristics as part of it's calculation. Once we have the baseline fee, we adjust it based on the following "human" assumptions:
	 *
	 * - There is an absolute maximum fee that people are happy to pay when there is no attached notional value : (ABSOLUTE_MAX_ACCEPTABLE_PRIORITY_FEE_USD)
	 *
	 * - There is a sanity check maximum fee (SANITY_CHECK_ABSOLUTE_MAX_FEE_USD)
	 *
	 * If there is a notional value to the transaction there is a relative maximum fee that people are happy to pay if the chain is very busy. (ACCEPTABLE_MAX_RELATIVE_NOTIONAL_FEE_MULTIPLIER)
	 *
	 * Wrapping up the above an explaining exactly how we calculate a dynamic fee:
	 * - We have the input sample of the current on-chain fees
	 * -- ^ this is the "baseline" fee. But we also apply a multiplier to it if relevant.
	 * - We Bound this fee by the acceptable fee in USD that we're willing to pay. The acceptable fee is also subject to the multiplier.
	 * - IF RELATIVE FEES ARE ENABLED: We run the bounded fee through the relative fee calculation. The relative fee calculation should increase the fee only if the baseline fee was higher than the bounded fee (suggesting network activity is very high)
	 * @param baseLineDynamicFeeCUPrice
	 * @param solPrice
	 * @param notionalTxValue
	 * @returns
	 */
	public static calculateDynamicPriorityFeeToUse({
		latestFeeSample,
		recentTimeoutCount,
		solPrice,
		notionalTxValue,
		boostMultiplier = 1,
		extraMulitiplier = 1,
	}: {
		latestFeeSample: number;
		recentTimeoutCount: number;
		solPrice: number;
		notionalTxValue?: number;
		boostMultiplier?: number;
		extraMulitiplier?: number; // An extra multiplier to help with dynamically adjusting the fees. E.g. a value stored in vercel environment config
	}) {
		const baseLineDynamicFeeCUPrice = this.calculateBaselineDynamicPriorityFee(
			latestFeeSample,
			recentTimeoutCount,
			boostMultiplier,
			extraMulitiplier
		);

		if (
			solPrice < SANITY_CHECK_SOL_PRICE_MINIMUM ||
			solPrice > SANITY_CHECK_SOL_PRICE_MAXIMUM
		) {
			// If the sol price is outside of the sanity check bounds, then we fall back to use the baseline fees because they are still based on on-chain priority fee results
			return baseLineDynamicFeeCUPrice;
		}

		const boundedCuPrice = this.calculateUSDBoundedDynamicFeeToUse(
			baseLineDynamicFeeCUPrice,
			solPrice,
			boostMultiplier
		);

		let cuPriceToUse: number;

		// If there is no notional price. Then return the CUPrice based on absolute acceptable values
		if (!notionalTxValue || !FEE_CALCULATOR_RELATIVE_MAX_FEE_ENABLED) {
			cuPriceToUse = boundedCuPrice;
		} else {
			cuPriceToUse = this.calculateRelativeBoundedDynamicFeeTouse(
				notionalTxValue,
				solPrice,
				baseLineDynamicFeeCUPrice,
				boundedCuPrice
			);
		}

		// Cut off the fee at the sanity check absolute max fee
		return getSanityCheckedCUPrice(cuPriceToUse);
	}

	public static getPriorityFeeInSolForComputeUnitPrice(
		computeUnitPrice: number,
		txComputeUnits?: number
	) {
		return getPriorityFeeInSolForComputeUnitPrice(
			computeUnitPrice,
			txComputeUnits
		);
	}

	public static calculatePriorityFeeInUsd(
		computeUnitPrice: number,
		solPrice: number
	) {
		return getPriorityFeeInSolForComputeUnitPrice(computeUnitPrice) * solPrice;
	}

	public static calculateCUPriceForTargetSolValue(
		targetSolValue: number,
		txComputeUnits?: number
	) {
		return calculateCUPriceForTargetSolValue(targetSolValue, txComputeUnits);
	}

	/**
	 * TARGET_LAMPORTS = (TARGET_USD / SOL_PRICE) * 10^9
	 *
	 * TO SOLVE FOR COMPUTE UNIT PRICE:
	 * LAMPORTS = (CU_PRICE / 10^6) x CU_ESTIMATE
	 * LAMPORTS * 10^6 / CU_ESTIMATE = CU_PRICE
	 *
	 * @param targetUsdValue
	 * @param solPrice
	 * @returns
	 */
	public static calculateCUPriceForTargetUsdValue(
		targetUsdValue: number,
		solPrice: number,
		txComputeUnits = DRIFT_TX_COMPUTE_UNIT_ESTIMATE
	) {
		return getSanityCheckedCUPrice(
			calculateCUPriceForTargetUsdValue(
				targetUsdValue,
				solPrice,
				txComputeUnits
			)
		);
	}

	public static calculateMaxAbsolutePriceInSol(solPrice: number) {
		const targetCUPrice = calculateCUPriceForTargetUsdValue(
			NONRELATIVE_MAX_ACCEPTABLE_PRIORITY_FEE_USD,
			solPrice,
			DRIFT_TX_COMPUTE_UNIT_ESTIMATE
		);

		const solValue = getPriorityFeeInSolForComputeUnitPrice(targetCUPrice);

		return solValue;
	}
}
