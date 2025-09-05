import { DriftClient, User, SettlePnlMode, TxParams } from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';

interface SettlePnlParams {
	driftClient: DriftClient;
	user: User;
	marketIndexes: number[];
	mode?: typeof SettlePnlMode.TRY_SETTLE | typeof SettlePnlMode.MUST_SETTLE;
}

/**
 * Creates transaction instructions for settling PnL for multiple markets.
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param user - The user account that will settle PnL
 * @param marketIndexes - Array of perp market indexes to settle PnL for
 * @param mode - Settlement mode (defaults to TRY_SETTLE)
 *
 * @returns Promise resolving to an array of transaction instructions for settling PnL
 */
export const createSettlePnlIx = async ({
	driftClient,
	user,
	marketIndexes,
	mode = SettlePnlMode.TRY_SETTLE,
}: SettlePnlParams): Promise<TransactionInstruction[]> => {
	const userAccountPublicKey = user.getUserAccountPublicKey();
	const userAccount = user.getUserAccount();

	const settlePnlIx = await driftClient.settleMultiplePNLsIx(
		userAccountPublicKey,
		userAccount,
		marketIndexes,
		mode
	);

	return [settlePnlIx];
};

interface CreateSettlePnlTxnParams extends SettlePnlParams {
	txParams?: TxParams;
}

/**
 * Creates a complete transaction for settling PnL for multiple markets.
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param user - The user account that will settle PnL
 * @param marketIndexes - Array of perp market indexes to settle PnL for
 * @param mode - Settlement mode (defaults to TRY_SETTLE)
 * @param txParams - Transaction parameters
 *
 * @returns Promise resolving to a built transaction ready for signing (Transaction or VersionedTransaction)
 */
export const createSettlePnlTxn = async ({
	driftClient,
	user,
	marketIndexes,
	mode = SettlePnlMode.TRY_SETTLE,
	txParams,
}: CreateSettlePnlTxnParams): Promise<Transaction | VersionedTransaction> => {
	const settlePnlIxs = await createSettlePnlIx({
		driftClient,
		user,
		marketIndexes,
		mode,
	});

	const settlePnlTxn = await driftClient.buildTransaction(
		settlePnlIxs,
		txParams
	);

	return settlePnlTxn;
};
