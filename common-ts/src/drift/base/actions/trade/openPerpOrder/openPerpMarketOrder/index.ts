import {
	DriftClient,
	User,
	BN,
	PositionDirection,
	OptionalOrderParams,
	MarketType,
	TxParams,
	getUserStatsAccountPublicKey,
} from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import { ENUM_UTILS } from '../../../../../../utils';
import {
	OptionalTriggerOrderParams,
	prepSignAndSendSwiftOrder,
	SwiftOrderOptions,
} from '../openSwiftOrder';
import { buildNonMarketOrderParams } from '../../../../../utils/orderParams';
import {
	fetchOrderParamsFromServer,
	fetchTopMakers,
	OptionalAuctionParamsRequestInputs,
} from '../dlobServer';
import { ORDER_COMMON_UTILS } from '../../../../../../common-ui-utils/order';

interface PlaceAndTakeParams {
	enable: boolean;
	auctionDurationPercentage?: number;
}

export interface OpenPerpMarketOrderBaseParams {
	driftClient: DriftClient;
	user: User;
	assetType: 'base' | 'quote';
	marketIndex: number;
	direction: PositionDirection;
	amount: BN;
	dlobServerHttpUrl: string;
	placeAndTake?: PlaceAndTakeParams;
	optionalAuctionParamsInputs?: OptionalAuctionParamsRequestInputs;
	bracketOrders?: {
		takeProfit?: OptionalTriggerOrderParams;
		stopLoss?: OptionalTriggerOrderParams;
	};
}

export interface OpenPerpMarketOrderBaseParamsWithSwift
	extends Omit<OpenPerpMarketOrderBaseParams, 'placeAndTake'> {
	swiftOptions: SwiftOrderOptions;
}

export interface OpenPerpMarketOrderParams<T extends boolean = boolean>
	extends OpenPerpMarketOrderBaseParams {
	useSwift: T;
	swiftOptions?: T extends true ? SwiftOrderOptions : never;
	placeAndTake?: T extends true ? never : PlaceAndTakeParams;
}

/**
 * Creates and submits a Swift (signed message) order. Only available for perp orders.
 */
export async function createSwiftMarketOrder({
	driftClient,
	user,
	assetType,
	marketIndex,
	direction,
	amount,
	bracketOrders,
	dlobServerHttpUrl,
	optionalAuctionParamsInputs,
	swiftOptions,
}: OpenPerpMarketOrderBaseParamsWithSwift): Promise<void> {
	if (amount.isZero()) {
		throw new Error('Amount must be greater than zero');
	}

	// Get order parameters from server
	const fetchedOrderParams = await fetchOrderParamsFromServer({
		driftClient,
		user,
		assetType,
		marketIndex,
		marketType: MarketType.PERP,
		direction,
		amount,
		dlobServerHttpUrl,
		optionalAuctionParamsInputs,
	});

	const bitFlags = ORDER_COMMON_UTILS.getPerpOrderParamsBitFlags(
		marketIndex,
		driftClient,
		user,
		amount,
		direction
	);

	const orderParams = {
		...fetchedOrderParams,
		bitFlags,
	};

	const userAccount = user.getUserAccount();
	const slotBuffer = swiftOptions.signedMessageOrderSlotBuffer || 7;

	await prepSignAndSendSwiftOrder({
		driftClient,
		subAccountId: userAccount.subAccountId,
		marketIndex,
		slotBuffer,
		swiftOptions,
		orderParams: {
			main: orderParams,
			takeProfit: bracketOrders?.takeProfit,
			stopLoss: bracketOrders?.stopLoss,
		},
	});
}

export const createPlaceAndTakePerpMarketOrderIx = async ({
	orderParams,
	direction,
	dlobServerHttpUrl,
	marketIndex,
	driftClient,
	user,
	auctionDurationPercentage,
}: {
	orderParams: OptionalOrderParams;
	direction: PositionDirection;
	dlobServerHttpUrl: string;
	marketIndex: number;
	driftClient: DriftClient;
	user: User;
	auctionDurationPercentage?: number;
}) => {
	const counterPartySide = ENUM_UTILS.match(direction, PositionDirection.LONG)
		? 'ask'
		: 'bid';
	const topMakersResult = await fetchTopMakers({
		dlobServerHttpUrl,
		marketIndex,
		marketType: MarketType.PERP,
		side: counterPartySide,
		limit: 4,
	});
	const topMakersInfo = topMakersResult.map((maker) => ({
		maker: maker.userAccountPubKey,
		makerUserAccount: maker.userAccount,
		makerStats: getUserStatsAccountPublicKey(
			driftClient.program.programId,
			maker.userAccount.authority
		),
	}));

	const placeAndTakeIx = await driftClient.getPlaceAndTakePerpOrderIx(
		orderParams,
		topMakersInfo,
		undefined, // TODO: referrerInfo,
		undefined,
		auctionDurationPercentage,
		user.getUserAccount().subAccountId
	);

	return placeAndTakeIx;
};

/**
 * Creates transaction instructions for opening a perp market order.
 * If swiftOptions is provided, it will create a Swift (signed message) order instead.
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param user - The user account that will place the order
 * @param assetType - Whether the amount is in base or quote units
 * @param marketIndex - The perp market index to trade
 * @param direction - The direction of the trade (long/short)
 * @param amount - The amount to trade
 * @param dlobServerHttpUrl - Server URL for the auction params endpoint
 * @param optionalAuctionParamsInputs - Optional parameters for auction params endpoint and order configuration
 * @param useSwift - Whether to use Swift (signed message) orders instead of regular transactions
 * @param swiftOptions - Options for Swift (signed message) orders. Required if useSwift is true
 *
 * @returns Promise resolving to an array of transaction instructions for regular orders, or empty array for Swift orders
 */
export const createOpenPerpMarketOrderIxs = async ({
	driftClient,
	user,
	assetType,
	marketIndex,
	direction,
	amount,
	bracketOrders,
	dlobServerHttpUrl,
	placeAndTake,
	optionalAuctionParamsInputs = {},
}: OpenPerpMarketOrderBaseParams): Promise<TransactionInstruction[]> => {
	if (!amount || amount.isZero()) {
		throw new Error('Amount must be greater than zero');
	}

	// First, get order parameters from server (same for both Swift and regular orders)
	const fetchedOrderParams = await fetchOrderParamsFromServer({
		driftClient,
		user,
		assetType,
		marketIndex,
		marketType: MarketType.PERP,
		direction,
		amount,
		dlobServerHttpUrl,
		optionalAuctionParamsInputs,
	});

	const bitFlags = ORDER_COMMON_UTILS.getPerpOrderParamsBitFlags(
		marketIndex,
		driftClient,
		user,
		amount,
		direction
	);

	const orderParams = {
		...fetchedOrderParams,
		bitFlags,
	};

	const allOrders: OptionalOrderParams[] = [];
	const allIxs: TransactionInstruction[] = [];

	if (placeAndTake.enable) {
		const placeAndTakeIx = await createPlaceAndTakePerpMarketOrderIx({
			orderParams,
			direction,
			dlobServerHttpUrl,
			marketIndex,
			driftClient,
			user,
			auctionDurationPercentage: placeAndTake.auctionDurationPercentage,
		});
		allIxs.push(placeAndTakeIx);
	} else {
		allOrders.push(orderParams);
	}

	if (bracketOrders?.takeProfit) {
		const takeProfitParams = buildNonMarketOrderParams({
			marketIndex,
			marketType: MarketType.PERP,
			direction: bracketOrders.takeProfit.direction,
			baseAssetAmount: amount,
			orderConfig: {
				orderType: 'takeProfit',
				triggerPrice: bracketOrders.takeProfit.triggerPrice,
			},
			reduceOnly: true,
		});
		allOrders.push(takeProfitParams);
	}

	if (bracketOrders?.stopLoss) {
		const stopLossParams = buildNonMarketOrderParams({
			marketIndex,
			marketType: MarketType.PERP,
			direction: bracketOrders.stopLoss.direction,
			baseAssetAmount: amount,
			orderConfig: {
				orderType: 'stopLoss',
				triggerPrice: bracketOrders.stopLoss.triggerPrice,
			},
			reduceOnly: true,
		});
		allOrders.push(stopLossParams);
	}

	// Regular order flow - create transaction instruction
	const placeOrderIx = await driftClient.getPlaceOrdersIx(allOrders);
	allIxs.push(placeOrderIx);

	return allIxs;
};

/**
 * Creates a complete transaction for opening a perp market order.
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param user - The user account that will place the order
 * @param marketIndex - The perp market index to trade
 * @param direction - The direction of the trade (long/short)
 * @param amount - The amount to trade
 * @param optionalAuctionParamsInputs - Optional parameters for auction params endpoint and order configuration
 * @param dlobServerHttpUrl - Server URL for the auction params endpoint
 *
 * @returns Promise resolving to a built transaction ready for signing (Transaction or VersionedTransaction)
 */
export const createOpenPerpMarketOrderTxn = async (
	params: OpenPerpMarketOrderBaseParams & { txParams?: TxParams }
): Promise<Transaction | VersionedTransaction> => {
	const { driftClient } = params;

	// Regular order flow - create transaction instruction and build transaction
	const placeOrderIx = await createOpenPerpMarketOrderIxs(params);
	const openPerpMarketOrderTxn = await driftClient.txHandler.buildTransaction({
		instructions: placeOrderIx,
		txVersion: 0,
		connection: driftClient.connection,
		preFlightCommitment: 'confirmed',
		fetchAllMarketLookupTableAccounts:
			driftClient.fetchAllLookupTableAccounts.bind(driftClient),
		txParams: params.txParams,
	});

	return openPerpMarketOrderTxn;
};

/**
 * Creates a transaction or swift order for a perp market order.
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param user - The user account that will place the order
 * @param marketIndex - The perp market index to trade
 * @param direction - The direction of the trade (long/short)
 * @param amount - The amount to trade
 * @param optionalAuctionParamsInputs - Optional parameters for auction params endpoint and order configuration
 * @param dlobServerHttpUrl - Server URL for the auction params endpoint
 * @param useSwift - Whether to use Swift (signed message) orders instead of regular transactions
 * @param swiftOptions - Options for Swift (signed message) orders. Required if useSwift is true
 *
 * @returns Promise resolving to a built transaction ready for signing (Transaction or VersionedTransaction)
 */
export const createOpenPerpMarketOrder = async <T extends boolean>(
	params: OpenPerpMarketOrderParams<T>
): Promise<T extends true ? void : Transaction | VersionedTransaction> => {
	const { useSwift, swiftOptions, ...rest } = params;

	// If useSwift is true, return the Swift result directly
	if (useSwift) {
		if (!swiftOptions) {
			throw new Error('swiftOptions is required when useSwift is true');
		}

		const swiftOrderResult = await createSwiftMarketOrder({
			...rest,
			swiftOptions,
		});

		return swiftOrderResult as T extends true
			? void
			: Transaction | VersionedTransaction;
	}

	const openPerpMarketOrderTxn = await createOpenPerpMarketOrderTxn(rest);

	return openPerpMarketOrderTxn as T extends true
		? void
		: Transaction | VersionedTransaction;
};
