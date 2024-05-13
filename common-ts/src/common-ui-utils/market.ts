import {
	PerpMarketAccount,
	PerpOperation,
	SpotMarketAccount,
	SpotOperation,
	isOperationPaused,
	InsuranceFundOperation,
} from '@drift-labs/sdk';

const getBaseAssetSymbol = (marketName: string, removePrefix = false) => {
	let baseAssetSymbol = marketName.replace('-PERP', '').replace('/USDC', '');

	if (removePrefix) {
		baseAssetSymbol = baseAssetSymbol.replace('1K', '').replace('1M', '');
	}

	return baseAssetSymbol;
};

const perpOperationStrings = {
	UPDATE_FUNDING: 'Funding',
	AMM_FILL: 'AMM Fills',
	FILL: 'Fills',
	SETTLE_PNL: 'Settle P&L',
	SETTLE_PNL_WITH_POSITION: 'Settle P&L With Open Position',
};

const spotOperationStrings = {
	UPDATE_CUMULATIVE_INTEREST: 'Update Cumulative Interest',
	FILL: 'Fills',
	WITHDRAW: 'Withdrawals',
};

const ifOperationStrings = {
	INIT: 'Initialize IF',
	ADD: 'Deposit To IF',
	REQUEST_REMOVE: 'Request Withdrawal From IF',
	REMOVE: 'Withdraw From IF',
};

const getPausedOperations = (
	marketAccount: PerpMarketAccount | SpotMarketAccount
): string[] => {
	if (!marketAccount) return [];

	const pausedOperations = [];
	//@ts-ignore
	const isPerp = !!marketAccount.amm;

	// check perp operations
	if (isPerp) {
		Object.keys(PerpOperation)
			.filter((operation) =>
				isOperationPaused(
					marketAccount.pausedOperations,
					PerpOperation[operation]
				)
			)
			.forEach((pausedOperation) => {
				pausedOperations.push(perpOperationStrings[pausedOperation]);
			});
	} else {
		// check spot operations
		Object.keys(SpotOperation)
			.filter((operation) =>
				isOperationPaused(
					marketAccount.pausedOperations,
					SpotOperation[operation]
				)
			)
			.forEach((pausedOperation) => {
				pausedOperations.push(spotOperationStrings[pausedOperation]);
			});

		// check IF operations
		Object.keys(InsuranceFundOperation)
			.filter((operation) =>
				isOperationPaused(
					marketAccount.pausedOperations,
					InsuranceFundOperation[operation]
				)
			)
			.forEach((pausedOperation) => {
				pausedOperations.push(ifOperationStrings[pausedOperation]);
			});
	}

	return pausedOperations;
};

export const MARKET_COMMON_UTILS = {
	getBaseAssetSymbol,
	getPausedOperations,
};
