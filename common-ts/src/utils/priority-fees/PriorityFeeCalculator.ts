import { LAMPORTS_PER_SOL } from '@solana/web3.js';

function calculateCUPriceForTargetSolValue(
	targetSolValue: number,
	txComputeUnits = DRIFT_TX_COMPUTE_UNIT_ESTIMATE
) {
	const targetFeeInLamports = targetSolValue * LAMPORTS_PER_SOL;
	const targetFeeInMicroLamports = targetFeeInLamports * 10 ** 6;

	const targetMicroLamportsPerComputeUnit = Math.round(
		targetFeeInMicroLamports / txComputeUnits
	);

	return targetMicroLamportsPerComputeUnit;
}

export const DRIFT_TX_COMPUTE_UNIT_ESTIMATE = 600_000;

export const SANITY_CHECK_ABS_MAX_FEE_IN_SOL = 1;
export const SANITY_CHECK_ABS_MAX_CU_PRICE = calculateCUPriceForTargetSolValue(
	SANITY_CHECK_ABS_MAX_FEE_IN_SOL,
	DRIFT_TX_COMPUTE_UNIT_ESTIMATE
);

const getSanityCheckedCUPrice = (cuPrice: number) => {
	return Math.min(cuPrice, SANITY_CHECK_ABS_MAX_CU_PRICE);
};

/**
 * The goal of this class is to encapsulate all logic around "priority fee calculation". The majority of the complexity is in calculating the dynamic priority fees, because the other settings are very simple.
 *
 * Priority Fees are determined by a "compute unit price". The compute unit price is denominated in "micro-lamports per compute unit". The end fee for the transactions is calculated as:
 * FEE_LAMPORTS = COMPUTE_UNIT_PRICE_MICRO_LAMPORTS * COMPUTE_UNITS / 10^6
 */
export class PriorityFeeCalculator {
	constructor() {}

	/**
	 * The baseline dynamic compute units price is the "target" price to use. It is based on the latest
	 * results on the priority fee subscriber, and some other contextual information.
	 */
	public static calculateDynamicCUPriceToUse({
		latestFeeSample,
		boostMultiplier = 1,
		extraMultiplier = 1,
	}: {
		latestFeeSample: number;
		boostMultiplier?: number;
		extraMultiplier?: number;
	}) {
		// Calculate baseline fee using the average of the most recent subscriber fee results, to normalise swings in priority fee from block to block
		let baseLineCUPrice = latestFeeSample;

		// add the boost multiplier
		baseLineCUPrice *= boostMultiplier;

		// add an extra multiplier (default to 1) that comes from env var, can be increased thru vercel during turbulence
		baseLineCUPrice *= extraMultiplier;

		// round
		baseLineCUPrice = Math.round(baseLineCUPrice);

		return getSanityCheckedCUPrice(baseLineCUPrice);
	}

	public static getPriorityFeeInSolForComputeUnitPrice(
		computeUnitPrice: number,
		txComputeUnits = DRIFT_TX_COMPUTE_UNIT_ESTIMATE
	) {
		const priorityFeeInLamports = Math.round(
			txComputeUnits * (computeUnitPrice / 10 ** 6)
		); // Compute units are in microLamports (10**6) / computeUnit
		const priorityFeeInSol = priorityFeeInLamports / LAMPORTS_PER_SOL;

		return +priorityFeeInSol.toFixed(Math.log10(LAMPORTS_PER_SOL));
	}

	public static calculatePriorityFeeInUsd(
		computeUnitPrice: number,
		solPrice: number,
		txComputeUnits = DRIFT_TX_COMPUTE_UNIT_ESTIMATE
	) {
		return (
			this.getPriorityFeeInSolForComputeUnitPrice(
				computeUnitPrice,
				txComputeUnits
			) * solPrice
		);
	}

	public static calculateCUPriceForTargetSolValue(
		targetSolValue: number,
		txComputeUnits?: number
	) {
		return calculateCUPriceForTargetSolValue(targetSolValue, txComputeUnits);
	}
}
