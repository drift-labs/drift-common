import {
	InsuranceFundOperation,
	isOperationPaused,
	PerpMarketAccount,
	PerpOperation,
	SpotMarketAccount,
	SpotOperation,
} from '@velocity-exchange/sdk';

const PerpOperationsMap = {
	UPDATE_FUNDING: 'Funding',
	AMM_FILL: 'AMM Fills',
	FILL: 'Fills',
	SETTLE_PNL: 'Settle P&L',
	SETTLE_PNL_WITH_POSITION: 'Settle P&L With Open Position',
};

const SpotOperationsMap = {
	UPDATE_CUMULATIVE_INTEREST: 'Update Cumulative Interest',
	FILL: 'Fills',
	WITHDRAW: 'Withdrawals',
};

const InsuranceFundOperationsMap = {
	INIT: 'Initialize IF',
	ADD: 'Deposit To IF',
	REQUEST_REMOVE: 'Request Withdrawal From IF',
	REMOVE: 'Withdraw From IF',
};

const getPausedOperations = (
	marketAccount: PerpMarketAccount | SpotMarketAccount
): string[] => {
	if (!marketAccount) return [];

	const pausedOperations: string[] = [];
	//@ts-ignore
	const isPerp = !!marketAccount.amm;

	// check perp operations
	if (isPerp) {
		Object.keys(PerpOperation)
			.filter((operation) =>
				isOperationPaused(
					marketAccount.pausedOperations,
					PerpOperation[operation as keyof typeof PerpOperation]
				)
			)
			.forEach((pausedOperation) => {
				pausedOperations.push(
					PerpOperationsMap[pausedOperation as keyof typeof PerpOperationsMap]
				);
			});
	} else {
		// check spot operations
		Object.keys(SpotOperation)
			.filter((operation) =>
				isOperationPaused(
					marketAccount.pausedOperations,
					SpotOperation[operation as keyof typeof SpotOperation]
				)
			)
			.forEach((pausedOperation) => {
				pausedOperations.push(
					SpotOperationsMap[pausedOperation as keyof typeof SpotOperationsMap]
				);
			});

		// check IF operations
		Object.keys(InsuranceFundOperation)
			.filter((operation) =>
				isOperationPaused(
					//@ts-ignore
					marketAccount.ifPausedOperations,
					InsuranceFundOperation[
						operation as keyof typeof InsuranceFundOperation
					]
				)
			)
			.forEach((pausedOperation) => {
				pausedOperations.push(
					InsuranceFundOperationsMap[
						pausedOperation as keyof typeof InsuranceFundOperationsMap
					]
				);
			});
	}

	return pausedOperations;
};

export {
	PerpOperationsMap,
	SpotOperationsMap,
	InsuranceFundOperationsMap,
	getPausedOperations,
};
