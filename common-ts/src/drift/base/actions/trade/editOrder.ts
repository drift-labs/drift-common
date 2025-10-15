import {
	BN,
	DriftClient,
	OrderTriggerCondition,
	OrderType,
	PositionDirection,
	PostOnlyParams,
	User,
} from '@drift-labs/sdk';
import {
	PublicKey,
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import { ENUM_UTILS } from '../../../../utils';
import invariant from 'tiny-invariant';
import { getLimitAuctionOrderParams } from './openPerpOrder/auction';
import {
	LimitAuctionConfig,
	LimitOrderParamsOrderConfig,
} from './openPerpOrder/types';
import { WithTxnParams } from '../../types';

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

export interface CreateEditOrderIxParams {
	driftClient: DriftClient;
	user: User;
	orderId: number;
	editOrderParams: EditOrderParams;
	mainSignerOverride?: PublicKey;
	limitAuctionOrderConfig?: LimitOrderParamsOrderConfig & {
		limitAuction: LimitAuctionConfig;
	};
}

/**
 * Creates a transaction instruction to edit an existing order
 * @param driftClient - The DriftClient instance
 * @param userPublicKey - The public key of the user who owns the order
 * @param orderId - The ID of the order to edit
 * @param editOrderParams - Parameters containing the new order values
 * @param limitAuctionOrderConfig - Configuration for the limit auction order. If not provided, limit auction will not be enabled when relevant.
 * @returns Promise that resolves to a TransactionInstruction
 */
export const createEditOrderIx = async (
	params: CreateEditOrderIxParams
): Promise<TransactionInstruction> => {
	const {
		driftClient,
		user,
		orderId,
		editOrderParams,
		mainSignerOverride,
		limitAuctionOrderConfig,
	} = params;
	const currentOrder = user.getOrder(orderId);

	invariant(currentOrder, 'Current order not found');

	const isLimitOrder = ENUM_UTILS.match(
		currentOrder.orderType,
		OrderType.LIMIT
	);

	let finalEditOrderParams = editOrderParams;

	// handle limit auction if config is provided
	if (
		isLimitOrder &&
		limitAuctionOrderConfig &&
		ENUM_UTILS.match(currentOrder.postOnly, PostOnlyParams.NONE)
	) {
		const limitAuctionOrderParams = await getLimitAuctionOrderParams({
			driftClient,
			user,
			marketIndex: currentOrder.marketIndex,
			marketType: currentOrder.marketType,
			direction: currentOrder.direction,
			baseAssetAmount: currentOrder.baseAssetAmount,
			userOrderId: currentOrder.userOrderId,
			reduceOnly: currentOrder.reduceOnly,
			postOnly: currentOrder.postOnly,
			orderConfig: limitAuctionOrderConfig,
		});

		finalEditOrderParams = {
			...editOrderParams,
			auctionDuration: limitAuctionOrderParams.auctionDuration,
			auctionStartPrice: limitAuctionOrderParams.auctionStartPrice,
			auctionEndPrice: limitAuctionOrderParams.auctionEndPrice,
		};
	}

	return driftClient.getModifyOrderIx(
		{
			orderId,
			...finalEditOrderParams,
		},
		undefined,
		{
			user,
			authority: mainSignerOverride,
		}
	);
};

type CreateEditOrderTxnParams = WithTxnParams<CreateEditOrderIxParams>;

/**
 * Creates a complete transaction to edit an existing order
 * @param driftClient - The DriftClient instance
 * @param userPublicKey - The public key of the user who owns the order
 * @param orderId - The ID of the order to edit
 * @param editOrderParams - Parameters containing the new order values
 * @param txParams - Optional transaction parameters (compute units, priority fees, etc.)
 * @returns Promise that resolves to a Transaction or VersionedTransaction
 */
export const createEditOrderTxn = async ({
	txParams,
	...params
}: CreateEditOrderTxnParams): Promise<Transaction | VersionedTransaction> => {
	return params.driftClient.buildTransaction(
		await createEditOrderIx(params),
		txParams
	);
};
