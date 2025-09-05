import { BASE_PRECISION_EXP, BigNum, DriftClient } from '@drift-labs/sdk';

export const getMarketOpenInterest = (
	driftClient: DriftClient,
	marketIndex: number
): { longOpenInterest: BigNum; shortOpenInterest: BigNum } => {
	const perpMarketAccount = driftClient.getPerpMarketAccount(marketIndex);
	const longOpenInterest = BigNum.from(
		perpMarketAccount.amm.baseAssetAmountLong,
		BASE_PRECISION_EXP
	);
	const shortOpenInterest = BigNum.from(
		perpMarketAccount.amm.baseAssetAmountShort,
		BASE_PRECISION_EXP
	);
	return { longOpenInterest, shortOpenInterest };
};
