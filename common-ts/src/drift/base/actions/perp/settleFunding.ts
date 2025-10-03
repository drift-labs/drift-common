import { DriftClient, TxParams, User } from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';

interface CreateSettleFundingIxParams {
	driftClient: DriftClient;
	user: User;
}

/**
 * Creates transaction instructions for settling funding payments.
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param user - The user account that will settle funding payments
 *
 * @returns Promise resolving to an array of transaction instructions for settling funding
 */
export const createSettleFundingIx = async ({
	driftClient,
	user,
}: CreateSettleFundingIxParams): Promise<TransactionInstruction[]> => {
	const userAccountPublicKey = user.getUserAccountPublicKey();

	const settleFundingIx = await driftClient.getSettleFundingPaymentIx(
		userAccountPublicKey
	);

	return [settleFundingIx];
};

interface CreateSettleFundingTxnParams extends CreateSettleFundingIxParams {
	txParams?: TxParams;
}

/**
 * Creates a complete transaction for settling funding payments.
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param user - The user account that will settle funding payments
 *
 * @returns Promise resolving to a built transaction ready for signing (Transaction or VersionedTransaction)
 */
export const createSettleFundingTxn = async ({
	driftClient,
	user,
	txParams,
}: CreateSettleFundingTxnParams): Promise<
	Transaction | VersionedTransaction
> => {
	const settleFundingIxs = await createSettleFundingIx({
		driftClient,
		user,
	});

	const settleFundingTxn = await driftClient.txHandler.buildTransaction({
		instructions: settleFundingIxs,
		txVersion: 0,
		connection: driftClient.connection,
		preFlightCommitment: 'confirmed',
		fetchAllMarketLookupTableAccounts:
			driftClient.fetchAllLookupTableAccounts.bind(driftClient),
		txParams,
	});

	return settleFundingTxn;
};
