import {
	BN,
	DriftClient,
	OrderTriggerCondition,
	PositionDirection,
	TxParams,
	User,
} from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';

/**
 * Parameters for editing an existing order
 */
interface EditOrderParams {
	/** New direction for the order (long/short) */
	newDirection?: PositionDirection;
	/** New base amount for the order */
	newBaseAmount?: BN;
	/** New limit price for the order */
	newLimitPrice?: BN;
	/** New oracle price offset for oracle market/limit orders */
	newOraclePriceOffset?: number;
	/** New trigger price for conditional orders */
	newTriggerPrice?: BN;
	/** New trigger condition for conditional orders */
	newTriggerCondition?: OrderTriggerCondition;
	/** Duration of the auction in slots */
	auctionDuration?: number;
	/** Starting price for the auction */
	auctionStartPrice?: BN;
	/** Ending price for the auction */
	auctionEndPrice?: BN;
	/** Whether the order should only reduce position size */
	reduceOnly?: boolean;
	/** Whether the order should only be posted (maker only) */
	postOnly?: boolean;
	/** Bit flags for additional order configuration */
	bitFlags?: number;
	/** Maximum timestamp for order validity */
	maxTs?: BN;
	/** Order policy configuration */
	policy?: number;
}

/**
 * Creates a transaction instruction to edit an existing order
 * @param driftClient - The DriftClient instance
 * @param userPublicKey - The public key of the user who owns the order
 * @param orderId - The ID of the order to edit
 * @param editOrderParams - Parameters containing the new order values
 * @returns Promise that resolves to a TransactionInstruction
 */
export const createEditOrderIx = async (
	driftClient: DriftClient,
	user: User,
	orderId: number,
	editOrderParams: EditOrderParams
): Promise<TransactionInstruction> => {
	const userPublicKey = user.getUserAccountPublicKey();
	const _currentOrder = user.getOrderByUserOrderId(orderId);

	// TODO: handle auction params

	return driftClient.getModifyOrderIx(
		{
			orderId,
			...editOrderParams,
		},
		undefined,
		userPublicKey
	);
};

/**
 * Creates a complete transaction to edit an existing order
 * @param driftClient - The DriftClient instance
 * @param userPublicKey - The public key of the user who owns the order
 * @param orderId - The ID of the order to edit
 * @param editOrderParams - Parameters containing the new order values
 * @param txParams - Optional transaction parameters (compute units, priority fees, etc.)
 * @returns Promise that resolves to a Transaction or VersionedTransaction
 */
export const createEditOrderTxn = async (
	driftClient: DriftClient,
	user: User,
	orderId: number,
	editOrderParams: EditOrderParams,
	txParams?: TxParams
): Promise<Transaction | VersionedTransaction> => {
	return driftClient.buildTransaction(
		await createEditOrderIx(driftClient, user, orderId, editOrderParams),
		txParams
	);
};
