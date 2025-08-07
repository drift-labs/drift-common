import {
	BigNum,
	DriftClient,
	SpotMarketConfig,
	TxParams,
	User,
} from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import { getTokenAddressForDepositAndWithdraw } from '../../../../utils/token';

interface CreateDepositIxParams {
	driftClient: DriftClient;
	user: User;
	amount: BigNum;
	spotMarketConfig: Pick<SpotMarketConfig, 'mint' | 'marketIndex'>;
	isMaxBorrowRepayment?: boolean;
}

/**
 * Creates transaction instructions for depositing a spot token.
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param user - The user account that will perform the deposit
 * @param amount - The amount to deposit (in BigNum format)
 * @param spotMarketConfig - The spot market configuration for the token being deposited
 * @param isMaxBorrowRepayment - Whether this deposit is for maximum borrow repayment (scales amount by 2x, set to reduce only)
 *
 * @returns Promise resolving to an array of transaction instructions for the deposit
 */
export const createDepositIxs = async ({
	driftClient,
	user,
	amount,
	spotMarketConfig,
	isMaxBorrowRepayment,
}: CreateDepositIxParams): Promise<TransactionInstruction[]> => {
	const authority = user.getUserAccount().authority;
	const associatedDepositTokenAddress =
		await getTokenAddressForDepositAndWithdraw(
			spotMarketConfig.mint,
			authority
		);

	let finalDepositAmount = amount;

	if (isMaxBorrowRepayment) {
		// we over-estimate to ensure that there is no borrow dust left
		// since isMaxBorrowRepayment = reduceOnly, it is safe to over-estimate
		finalDepositAmount = finalDepositAmount.scale(2, 1);
	}

	const depositIxs = await driftClient.getDepositTxnIx(
		finalDepositAmount.val,
		spotMarketConfig.marketIndex,
		associatedDepositTokenAddress,
		user.getUserAccount().subAccountId,
		isMaxBorrowRepayment
	);

	return depositIxs;
};

interface CreateDepositTxnParams extends CreateDepositIxParams {
	txParams?: TxParams;
	initSwiftAccount?: boolean;
}

/**
 * Creates a complete transaction for depositing assets into a spot market.
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param user - The user account that will perform the deposit
 * @param amount - The amount to deposit (in BigNum format)
 * @param spotMarketConfig - The spot market configuration for the token being deposited
 * @param isMaxBorrowRepayment - Whether this deposit is for maximum borrow repayment (scales amount by 2x)
 * @param txParams - Optional transaction parameters for building the transaction (compute units, priority fees, etc.)
 * @param initSwiftAccount - Optional flag to initialize a Swift account during the deposit
 *
 * @returns Promise resolving to a built transaction ready for signing (Transaction or VersionedTransaction)
 */
export const createDepositTxn = async ({
	driftClient,
	user,
	amount,
	spotMarketConfig,
	isMaxBorrowRepayment,
	txParams,
	initSwiftAccount,
}: CreateDepositTxnParams): Promise<Transaction | VersionedTransaction> => {
	const authority = user.getUserAccount().authority;
	const associatedDepositTokenAddress =
		await getTokenAddressForDepositAndWithdraw(
			spotMarketConfig.mint,
			authority
		);

	let finalDepositAmount = amount;

	if (isMaxBorrowRepayment) {
		// we over-estimate to ensure that there is no borrow dust left
		// since isMaxBorrowRepayment = reduceOnly, it is safe to over-estimate
		finalDepositAmount = finalDepositAmount.scale(2, 1);
	}

	// we choose to not use createDepositIxs here because it doesn't have the initSwiftAccount logic
	const depositTxn = await driftClient.createDepositTxn(
		finalDepositAmount.val,
		spotMarketConfig.marketIndex,
		associatedDepositTokenAddress,
		user.getUserAccount().subAccountId,
		isMaxBorrowRepayment,
		txParams,
		initSwiftAccount
	);

	return depositTxn;
};
