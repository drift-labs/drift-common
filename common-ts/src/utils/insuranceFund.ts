import {
	BigNum,
	BN,
	DriftClient,
	getTokenAmount,
	SpotBalanceType,
	SpotMarketAccount,
	SpotMarketConfig,
} from '@drift-labs/sdk';
import { UIMarket } from '../types/UIMarket';

/**
 * Calculates the next APR for insurance fund staking
 * This function extracts the APR calculation logic from the insurance fund staking implementation
 * Reference: https://github.com/drift-labs/protocol-v2-mono/blob/ebbe7b8df7e81de59bd510a37d16f55d5c985ef5/ui/src/utils/insuranceFund.ts#L105
 *
 * @param spotMarket - Spot market account
 * @param vaultBalanceBigNum - Current vault balance as BigNum
 * @returns Next APR as a percentage (e.g., 35 means 35% APR)
 */
function calculateVaultNextApr(
	spotMarket: SpotMarketAccount,
	vaultBalanceBigNum: BigNum
): number {
	const MAX_APR = 1000;
	const GOV_MAX_APR = 20;
	const DRIFT_MARKET_INDEX = 15;

	const { precisionExp } = UIMarket.spotMarkets[spotMarket.marketIndex];

	try {
		const vaultBalance = vaultBalanceBigNum.toNum();

		// Calculate revenue pool
		const revenuePoolBN = getTokenAmount(
			spotMarket.revenuePool.scaledBalance,
			spotMarket,
			SpotBalanceType.DEPOSIT
		);
		const revenuePoolBigNum = BigNum.from(revenuePoolBN, precisionExp);
		const revenuePool = revenuePoolBigNum.toNum();

		// APR calculation constants and factors
		const payoutRatio = 0.1;
		const ratioForStakers =
			spotMarket.insuranceFund.totalFactor > 0 &&
			spotMarket.insuranceFund.userFactor > 0
				? spotMarket.insuranceFund.userFactor /
				  spotMarket.insuranceFund.totalFactor
				: 0;

		// Settle periods from on-chain data
		const revSettlePeriod =
			spotMarket.insuranceFund.revenueSettlePeriod.toNumber() * 1000;

		// Handle edge case where settle period is 0
		if (revSettlePeriod === 0) {
			return 0;
		}

		// Calculate settlements per year (31536000000 ms = 1 year)
		const settlesPerYear = 31536000000 / revSettlePeriod;

		// Calculate projected annual revenue
		const projectedAnnualRev = revenuePool * settlesPerYear * payoutRatio;

		// Calculate uncapped APR
		const uncappedApr =
			vaultBalance === 0 ? 0 : (projectedAnnualRev / vaultBalance) * 100;

		// Apply APR cap: DRIFT token (governance) capped at 20%, others at 1000%
		const maxApr =
			spotMarket.marketIndex === DRIFT_MARKET_INDEX ? GOV_MAX_APR : MAX_APR;
		const cappedApr = Math.min(uncappedApr, maxApr);

		// Calculate final APR for stakers
		const nextApr = cappedApr * ratioForStakers;

		return nextApr;
	} catch (error) {
		console.warn('Error calculating next APR:', error);
		return 0;
	}
}

/**
 * Get the size of an insurance fund vault
 * @param spotMarketConfig
 * @param driftClient
 * @returns
 */
const getIfVaultBalance = async (
	spotMarketConfig: SpotMarketConfig,
	driftClient: DriftClient
) => {
	const spotMarket = driftClient.getSpotMarketAccount(
		spotMarketConfig.marketIndex
	);

	const vaultBalanceBN = new BN(
		(
			await driftClient.provider.connection.getTokenAccountBalance(
				spotMarket.insuranceFund.vault
			)
		).value.amount
	);

	const vaultBalanceBigNum = BigNum.from(
		vaultBalanceBN,
		spotMarketConfig.precisionExp
	);

	return vaultBalanceBigNum;
};

/**
 * Get the current staking APR for a market.
 * @param spotMarketConfig
 * @param driftClient
 * @returns APR Percentage .. e.g. 100 for 100%
 */
export const getIfStakingVaultApr = async (
	spotMarketConfig: SpotMarketConfig,
	driftClient: DriftClient
) => {
	const vaultBalance = await getIfVaultBalance(spotMarketConfig, driftClient);

	return calculateVaultNextApr(
		driftClient.getSpotMarketAccount(spotMarketConfig.marketIndex),
		vaultBalance
	);
};
