import { DriftClient, TxParams, User, UserStatsAccount } from '@drift-labs/sdk';

/**
 * Parameters required for deleting a user instruction
 */
interface DeleteUserIxsParams {
	/** The Drift protocol client instance */
	driftClient: DriftClient;
	user: User;
	userStatsAccount: UserStatsAccount;
}

/**
 * Creates user deletion instructions. If the account is a fresh non-idle account,
 * includes an idle instruction before the deletion instruction.
 */
export const deleteUserIxs = async ({
	driftClient,
	user,
	userStatsAccount,
}: DeleteUserIxsParams) => {
	const { canDelete, reason } = user.canBeDeleted(userStatsAccount);

	const userPublicKey = user.userAccountPublicKey;

	if (canDelete) {
		return [await driftClient.getUserDeletionIx(userPublicKey)];
	}

	if (reason === 'is-not-idle-fresh-account') {
		const [idleIx, deleteIx] = await Promise.all([
			driftClient.getUpdateUserIdleIx(userPublicKey, user.getUserAccount()),
			driftClient.getUserDeletionIx(userPublicKey),
		]);
		return [idleIx, deleteIx];
	}

	throw new Error(reason);
};

/**
 * Parameters required for creating a user deletion transaction
 * Extends DeleteUserIxParams with optional transaction parameters
 */
interface DeleteUserTxnParams extends DeleteUserIxsParams {
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
	userStatsAccount,
	txParams,
}: DeleteUserTxnParams) => {
	const deleteIx = await deleteUserIxs({ driftClient, user, userStatsAccount });
	return driftClient.buildTransaction(deleteIx, txParams);
};
