import {
	BigNum,
	DriftClient,
	getTokenAmount,
	PRICE_PRECISION_EXP,
	SpotBalanceType,
	SpotMarketConfig,
} from '@drift-labs/sdk';

export const getTotalBorrowsForMarket = (
	market: SpotMarketConfig,
	driftClient: DriftClient
) => {
	const marketAccount = driftClient.getSpotMarketAccount(market.marketIndex);

	const totalBorrowsTokenAmount = getTokenAmount(
		marketAccount.borrowBalance,
		driftClient.getSpotMarketAccount(marketAccount.marketIndex),
		SpotBalanceType.BORROW
	);

	const totalBorrowsAmountBigNum = BigNum.from(
		totalBorrowsTokenAmount,
		market.precisionExp
	);

	const priceData = driftClient.getOraclePriceDataAndSlot(
		marketAccount.oracle,
		marketAccount.oracleSource
	);

	const price = BigNum.from(priceData.data.price, PRICE_PRECISION_EXP);

	const totalBorrowsQuote = price.toNum() * totalBorrowsAmountBigNum.toNum();

	return Number(totalBorrowsQuote.toFixed(2));
};

export const getTotalDepositsForMarket = (
	market: SpotMarketConfig,
	driftClient: DriftClient
) => {
	const marketAccount = driftClient.getSpotMarketAccount(market.marketIndex);

	const totalDepositsTokenAmount = getTokenAmount(
		marketAccount.depositBalance,
		marketAccount,
		SpotBalanceType.DEPOSIT
	);

	const totalDepositsTokenAmountBigNum = BigNum.from(
		totalDepositsTokenAmount,
		market.precisionExp
	);

	const priceData = driftClient.getOraclePriceDataAndSlot(
		marketAccount.oracle,
		marketAccount.oracleSource
	);

	const price = BigNum.from(priceData.data.price, PRICE_PRECISION_EXP);

	const totalDepositsBase = totalDepositsTokenAmountBigNum.toNum();
	const totalDepositsQuote =
		price.toNum() * totalDepositsTokenAmountBigNum.toNum();

	return {
		totalDepositsBase,
		totalDepositsQuote,
	};
};
