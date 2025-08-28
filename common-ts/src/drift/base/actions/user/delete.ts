import { DriftClient, TxParams, User } from '@drift-labs/sdk';

/**
 * Parameters required for deleting a user instruction
 */
interface DeleteUserIxParams {
	/** The Drift protocol client instance */
	driftClient: DriftClient;
	/** The user account to be deleted */
	user: User;
}

/**
 * Creates a user deletion instruction.
 *
 * @example
 * ```typescript
 * const deleteIx = await deleteUserIx({
 *   driftClient: driftClient,
 *   user: userClient
 * });
 * ```
 */
export const deleteUserIx = async ({
	driftClient,
	user,
}: DeleteUserIxParams) => {
	return driftClient.getUserDeletionIx(user.userAccountPublicKey);
};

/**
 * Parameters required for creating a user deletion transaction
 * Extends DeleteUserIxParams with optional transaction parameters
 */
interface DeleteUserTxnParams extends DeleteUserIxParams {
	/** Optional transaction parameters for customizing the transaction */
	txParams?: TxParams;
}

/**
 * Creates a user deletion transaction.
 *
 * @example
 * ```typescript
 * const deleteTxn = await deleteUserTxn({
 *   driftClient: driftClient,
 *   user: userClient,
 *   txParams: { useSimulatedComputeUnits: true }
 * });
 *
 * // Sign and send the transaction
 * const signature = await driftClient.sendTransaction(deleteTxn);
 * ```
 */
export const deleteUserTxn = async ({
	driftClient,
	user,
	txParams,
}: DeleteUserTxnParams) => {
	const deleteIx = await deleteUserIx({ driftClient, user });
	return driftClient.buildTransaction(deleteIx, txParams);
};
