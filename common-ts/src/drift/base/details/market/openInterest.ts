import {
	BASE_PRECISION_EXP,
	BigNum,
	VelocityClient,
} from '@velocity-exchange/sdk';

export const getMarketOpenInterest = (
	velocityClient: VelocityClient,
	marketIndex: number
): { longOpenInterest: BigNum; shortOpenInterest: BigNum } => {
	const perpMarketAccount = velocityClient.getPerpMarketAccount(marketIndex);
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
