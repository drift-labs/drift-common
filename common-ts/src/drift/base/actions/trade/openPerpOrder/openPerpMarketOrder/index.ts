import {
	DriftClient,
	User,
	BN,
	PositionDirection,
	OptionalOrderParams,
	MarketType,
} from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import { ENUM_UTILS } from '../../../../../../utils';
import {
	mapAuctionParamsResponse,
	ServerAuctionParamsResponse,
	MappedAuctionParams,
} from '../../../../../utils/auctionParamsResponseMapper';
import {
	OptionalTriggerOrderParams,
	prepSignAndSendSwiftOrder,
	prepSwiftOrder,
	SwiftOrderOptions,
} from '../openSwiftOrder';
import { buildNonMarketOrderParams } from '../../../../../utils/orderParams';

export interface OptionalAuctionParamsRequestInputs {
	// Optional parameters that can override defaults or provide additional configuration
	maxLeverageSelected?: boolean;
	maxLeverageOrderSize?: BN;
	reduceOnly?: boolean;
	auctionDuration?: number;
	auctionStartPriceOffset?: number;
	auctionEndPriceOffset?: number;
	auctionStartPriceOffsetFrom?: string; // TradeOffsetPrice
	auctionEndPriceOffsetFrom?: string; // TradeOffsetPrice
	slippageTolerance?: number | 'dynamic';
	auctionPriceCaps?: {
		min: BN;
		max: BN;
	};
	isOracleOrder?: boolean;
	additionalEndPriceBuffer?: BN;
	forceUpToSlippage?: boolean;
	orderType?: 'market' | 'oracle';
}

export type OpenPerpMarketOrderParams<T extends boolean = boolean> = {
	driftClient: DriftClient;
	user: User;
	assetType: 'base' | 'quote';
	marketIndex: number;
	direction: PositionDirection;
	amount: BN;
	optionalAuctionParamsInputs?: OptionalAuctionParamsRequestInputs;
	dlobServerHttpUrl: string;
	bracketOrders?: {
		takeProfit?: OptionalTriggerOrderParams;
		stopLoss?: OptionalTriggerOrderParams;
	};
	marketType?: MarketType;
	useSwift: T;
} & (T extends true
	? { swiftOptions: SwiftOrderOptions }
	: { swiftOptions?: never });

interface RegularOrderParams {
	driftClient: DriftClient;
	user: User;
	assetType: 'base' | 'quote';
	marketType?: MarketType;
	marketIndex: number;
	direction: PositionDirection;
	amount: BN;
	optionalAuctionParamsInputs?: OptionalAuctionParamsRequestInputs;
	dlobServerHttpUrl: string;
}

// TODO: fallback method in case auction params endpoint is down
/**
 * Fetches order parameters from the auction params server
 */
async function fetchOrderParamsFromServer({
	assetType,
	marketIndex,
	marketType = MarketType.PERP,
	direction,
	amount,
	dlobServerHttpUrl,
	optionalAuctionParamsInputs = {},
}: RegularOrderParams): Promise<OptionalOrderParams> {
	// Build URL parameters for server request
	const urlParamsObject: Record<string, string> = {
		// Required fields
		assetType,
		marketType: ENUM_UTILS.toStr(marketType),
		marketIndex: marketIndex.toString(),
		direction: ENUM_UTILS.toStr(direction),
		amount: amount.toString(),
	};

	// Add defined optional parameters
	Object.entries(optionalAuctionParamsInputs).forEach(([key, value]) => {
		if (value !== undefined) {
			urlParamsObject[key] = value.toString();
		}
	});

	const urlParams = new URLSearchParams(urlParamsObject);

	// Get order params from server
	const requestUrl = `${dlobServerHttpUrl}/auctionParams?${urlParams.toString()}`;
	const response = await fetch(requestUrl);

	if (!response.ok) {
		throw new Error(
			`Server responded with ${response.status}: ${response.statusText}`
		);
	}

	const serverResponse: ServerAuctionParamsResponse = await response.json();
	const mappedParams: MappedAuctionParams =
		mapAuctionParamsResponse(serverResponse);

	// Convert MappedAuctionParams to OptionalOrderParams
	return {
		orderType: mappedParams.orderType,
		marketType: mappedParams.marketType,
		userOrderId: mappedParams.userOrderId,
		direction: mappedParams.direction,
		baseAssetAmount: mappedParams.baseAssetAmount,
		marketIndex: mappedParams.marketIndex,
		reduceOnly: mappedParams.reduceOnly,
		postOnly: mappedParams.postOnly,
		triggerPrice: mappedParams.triggerPrice,
		triggerCondition: mappedParams.triggerCondition,
		oraclePriceOffset: mappedParams.oraclePriceOffset?.toNumber() || null,
		auctionDuration: mappedParams.auctionDuration,
		maxTs: mappedParams.maxTs,
		auctionStartPrice: mappedParams.auctionStartPrice,
		auctionEndPrice: mappedParams.auctionEndPrice,
	};
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
}: Omit<OpenPerpMarketOrderParams, 'useSwift'> & {
	swiftOptions: SwiftOrderOptions;
}): Promise<void> {
	// Get order parameters from server
	const orderParams = await fetchOrderParamsFromServer({
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
export const createOpenPerpMarketOrderIx = async ({
	driftClient,
	user,
	assetType,
	marketIndex,
	direction,
	amount,
	dlobServerHttpUrl,
	optionalAuctionParamsInputs = {},
	useSwift = false,
	swiftOptions,
}: OpenPerpMarketOrderParams): Promise<TransactionInstruction[]> => {
	if (!amount || amount.isZero()) {
		throw new Error('Amount must be greater than zero');
	}

	// First, get order parameters from server (same for both Swift and regular orders)
	const orderParams = await fetchOrderParamsFromServer({
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

	// If useSwift is true, use prepSwiftOrder and return empty array
	if (useSwift) {
		if (!swiftOptions) {
			throw new Error('swiftOptions is required when useSwift is true');
		}

		const currentSlot = await driftClient.connection.getSlot();
		const userAccount = user.getUserAccount();

		// Use the existing prepSwiftOrder helper function
		prepSwiftOrder({
			driftClient,
			takerUserAccount: {
				pubKey: swiftOptions.wallet.publicKey,
				subAccountId: userAccount.subAccountId,
			},
			currentSlot,
			isDelegate: swiftOptions.isDelegate || false,
			orderParams: {
				main: orderParams,
				// TODO: Add support for stopLoss and takeProfit
			},
			slotBuffer: swiftOptions.signedMessageOrderSlotBuffer || 7,
		});

		// Swift orders don't return transaction instructions
		return [];
	}

	// Regular order flow - create transaction instruction
	const placeOrderIx = await driftClient.getPlaceOrdersIx([orderParams]);
	return [placeOrderIx];
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
export const createOpenPerpMarketOrderTxn = async <T extends boolean>({
	driftClient,
	user,
	assetType,
	marketIndex,
	direction,
	amount,
	dlobServerHttpUrl,
	optionalAuctionParamsInputs,
	bracketOrders,
	useSwift,
	swiftOptions,
}: OpenPerpMarketOrderParams<T>): Promise<
	T extends true ? void : Transaction | VersionedTransaction
> => {
	if (!amount || amount.isZero()) {
		throw new Error('Amount must be greater than zero');
	}

	// If useSwift is true, return the Swift result directly
	if (useSwift) {
		if (!swiftOptions) {
			throw new Error('swiftOptions is required when useSwift is true');
		}
		return (await createSwiftMarketOrder({
			driftClient,
			user,
			assetType,
			marketIndex,
			direction,
			amount,
			dlobServerHttpUrl,
			bracketOrders,
			optionalAuctionParamsInputs,
			swiftOptions,
		})) as T extends true ? void : Transaction | VersionedTransaction;
	}

	// First, get order parameters from server (same for both Swift and regular orders)
	const orderParams = await fetchOrderParamsFromServer({
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

	const allOrders: OptionalOrderParams[] = [orderParams];

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

	// Regular order flow - create transaction instruction and build transaction
	const placeOrderIx = await driftClient.getPlaceOrdersIx(allOrders);
	const openPerpMarketOrderTxn = await driftClient.txHandler.buildTransaction({
		instructions: [placeOrderIx],
		txVersion: 0,
		connection: driftClient.connection,
		preFlightCommitment: 'confirmed',
		fetchAllMarketLookupTableAccounts:
			driftClient.fetchAllLookupTableAccounts.bind(driftClient),
	});

	return openPerpMarketOrderTxn as T extends true
		? void
		: Transaction | VersionedTransaction;
};
