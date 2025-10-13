import { DriftClient, User } from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
	PublicKey,
} from '@solana/web3.js';
import { WithTxnParams } from '../../types';

interface CreateCancelOrdersIxParams {
	driftClient: DriftClient;
	user: User;
	orderIds: number[];
	mainSignerOverride?: PublicKey;
}

/**
 * Creates a transaction instruction to cancel multiple orders by their order IDs.
 *
 * @param driftClient - The Drift client instance.
 * @param orderIds - Array of order IDs to cancel. Each ID corresponds to a specific order
 * @param user - The user client that owns the orders to be cancelled
 *
 * @returns Promise resolving to a TransactionInstruction that cancels the specified orders
 *
 * @example
 * ```typescript
 * const instruction = await cancelOrderIxs(
 *   driftClient,
 *   [123, 456, 789], // Cancel orders with IDs 123, 456, and 789
 *   user
 * );
 *
 * ```
 */
export const createCancelOrdersIx = async (
	params: CreateCancelOrdersIxParams
): Promise<TransactionInstruction> => {
	const { driftClient, user, orderIds, mainSignerOverride } = params;

	return driftClient.getCancelOrdersByIdsIx(orderIds, undefined, user, {
		authority: mainSignerOverride,
	});
};

/**
 * Creates a transaction to cancel multiple orders by their IDs.
 *
 * @param driftClient - The Drift client instance.
 * @param orderIds - Array of order IDs to cancel. Each ID corresponds to a specific order
 * @param user - The user client that owns the orders to be cancelled
 * @param txParams - Optional transaction parameters for customizing the transaction
 *
 * @returns Promise resolving to a Transaction or VersionedTransaction ready for signing
 *
 * @example
 * ```typescript
 * // Cancel multiple orders
 * const transaction = await cancelOrderTxn(
 *   driftClient,
 *   [123, 456], // Cancel orders with IDs 123 and 456
 *   user,
 *   { computeUnits: 200000 } // Optional transaction parameters
 * );
 *
 * // Sign and send the transaction
 * const signature = await wallet.sendTransaction(transaction, connection);
 * ```
 */
export const createCancelOrdersTxn = async (
	params: WithTxnParams<CreateCancelOrdersIxParams>
): Promise<Transaction | VersionedTransaction> => {
	return params.driftClient.buildTransaction(
		await createCancelOrdersIx(params),
		params.txParams
	);
};
