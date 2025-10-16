import { DriftClient } from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
	PublicKey,
} from '@solana/web3.js';
import { WithTxnParams } from '../../types';

interface ManageBuilderIxParams {
	driftClient: DriftClient;
	/**
	 * The public key of the builder to manage.
	 * This is the builder's authority address that owns their RevenueShare account.
	 */
	builderAuthority: PublicKey;
	/**
	 * Maximum fee the builder can charge, in tenths of basis points.
	 *
	 * Examples:
	 * - 10 = 1 bps = 0.01%
	 * - 50 = 5 bps = 0.05%
	 * - 100 = 10 bps = 0.1%
	 * - 1000 = 100 bps = 1%
	 *
	 * Special values:
	 * - Set to 0 to revoke the builder (they remain in list but cannot be used)
	 */
	maxFeeTenthBps: number;
	/**
	 * The public key of the authority to add the builder to the approved builders list.
	 */
	authority: PublicKey;
	/**
	 * The public key of the wallet that will pay for the transaction.
	 * If not provided, the authority provided will be the payer.
	 */
	payer?: PublicKey;
}

/**
 * Creates a transaction instruction to manage a builder's approval status and fee cap.
 *
 * This unified function handles all builder management operations:
 * - **Approve**: Add a new builder to the approved list
 * - **Update**: Modify an existing builder's max fee cap
 * - **Revoke**: Disable a builder by setting their max fee to 0
 *
 * ## Behavior:
 *
 * ### If builder NOT in list:
 * - Adds builder with specified `maxFeeTenthBps`
 *
 * ### If builder already in list:
 * - Updates builder's `maxFeeTenthBps` to new value
 * - Set to 0 to revoke (builder stays in list but cannot be used)
 *
 * ## Revocation Constraints:
 * When setting `maxFeeTenthBps = 0`, the builder cannot have active orders:
 * - No Open orders using this builder
 * - No Completed (unsettled) orders using this builder
 * - Error: `CannotRevokeBuilderWithOpenOrders` if constraint violated
 *
 * **Prerequisites**:
 * - User must have initialized a RevenueShareEscrow account
 * - Builder must have initialized a RevenueShare account (for receiving fees)
 *
 * @param driftClient - The Drift client instance
 * @param builderAuthority - The public key of the builder to manage
 * @param maxFeeTenthBps - Maximum fee cap in tenths of basis points
 *
 * @returns Promise resolving to a TransactionInstruction
 *
 * @example
 * ```typescript
 * // Approve a new builder with 5 bps max fee
 * const ix = await manageBuilderIx({
 *   driftClient,
 *   builderAuthority: new PublicKey('BuilderAddress...'),
 *   maxFeeTenthBps: 50  // 5 bps = 0.05%
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Update existing builder to 10 bps max fee
 * const ix = await manageBuilderIx({
 *   driftClient,
 *   builderAuthority: builderPubkey,
 *   maxFeeTenthBps: 100  // 10 bps = 0.1%
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Revoke builder (set max fee to 0)
 * // IMPORTANT: Must settle all builder's orders first!
 * const ix = await manageBuilderIx({
 *   driftClient,
 *   builderAuthority: builderPubkey,
 *   maxFeeTenthBps: 0  // Revoked
 * });
 * ```
 */
export const manageBuilderIx = async (
	params: ManageBuilderIxParams
): Promise<TransactionInstruction> => {
	const { driftClient, builderAuthority, maxFeeTenthBps, authority, payer } =
		params;

	const isRevoke = maxFeeTenthBps === 0;

	return driftClient.getChangeApprovedBuilderIx(
		builderAuthority,
		maxFeeTenthBps,
		!isRevoke, // add = true (approve/update), false (revoke)
		{
			authority,
			payer: payer ?? authority,
		}
	);
};

/**
 * Creates a transaction to manage a builder's approval status and fee cap.
 *
 * This unified function handles all builder management operations:
 * - **Approve**: Add a new builder to the approved list
 * - **Update**: Modify an existing builder's max fee cap
 * - **Revoke**: Disable a builder by setting their max fee to 0
 *
 * ## Behavior:
 *
 * ### If builder NOT in list:
 * - Adds builder with specified `maxFeeTenthBps`
 *
 * ### If builder already in list:
 * - Updates builder's `maxFeeTenthBps` to new value
 * - Set to 0 to revoke (builder stays in list but cannot be used)
 *
 * ## Revocation Constraints:
 * When setting `maxFeeTenthBps = 0`, the builder cannot have active orders:
 * - No Open orders using this builder
 * - No Completed (unsettled) orders using this builder
 * - Error: `CannotRevokeBuilderWithOpenOrders` if constraint violated
 *
 * **Prerequisites**:
 * - User must have initialized a RevenueShareEscrow account
 * - Builder must have initialized a RevenueShare account (for receiving fees)
 *
 * @param driftClient - The Drift client instance
 * @param builderAuthority - The public key of the builder to manage
 * @param maxFeeTenthBps - Maximum fee cap in tenths of basis points
 * @param txParams - Optional transaction parameters for customizing the transaction
 *
 * @returns Promise resolving to a Transaction or VersionedTransaction ready for signing
 *
 * @example
 * ```typescript
 * // Approve a new builder with 2 bps max fee
 * const tx = await manageBuilderTxn({
 *   driftClient,
 *   builderAuthority: new PublicKey('BuilderAddress...'),
 *   maxFeeTenthBps: 20,
 *   txParams: { computeUnits: 200000 }
 * });
 *
 * const signature = await wallet.sendTransaction(tx, connection);
 * ```

 * @example
 * ```typescript
 * // Update existing builder's fee
 * await manageBuilderTxn({
 *   driftClient,
 *   builderAuthority: builderPubkey,
 *   maxFeeTenthBps: 100  // Increase to 10 bps
 * });
 * ```
 */
export const manageBuilderTxn = async (
	params: WithTxnParams<ManageBuilderIxParams>
): Promise<Transaction | VersionedTransaction> => {
	return params.driftClient.buildTransaction(
		await manageBuilderIx(params),
		params.txParams
	);
};
