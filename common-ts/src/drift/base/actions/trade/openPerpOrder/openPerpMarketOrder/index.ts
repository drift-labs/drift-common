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
	PublicKey,
} from '@solana/web3.js';
import { ENUM_UTILS } from '../../../../../../utils';
import {
	mapAuctionParamsResponse,
	ServerAuctionParamsResponse,
	MappedAuctionParams,
} from '../../../../../utils/auctionParamsResponseMapper';
import { prepSwiftOrder, sendSwiftOrder } from '../openSwiftOrder';
import { MarketId } from '../../../../../../types';
import { SwiftClient } from '../../../../../../clients/swiftClient';
import { Observable } from 'rxjs';

export interface AuctionParamsRequestOptions {
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

export interface SwiftOrderOptions {
	wallet: {
		signMessage: (message: Uint8Array) => Promise<Uint8Array>;
		publicKey: PublicKey;
	};
	swiftServerUrl: string;
	signedMessageOrderSlotBuffer?: number;
	confirmDuration?: number;
	isDelegate?: boolean;
}

type OpenPerpMarketOrderParams<T extends boolean = boolean> = {
	driftClient: DriftClient;
	user: User;
	assetType: 'base' | 'quote';
	marketIndex: number;
	direction: PositionDirection;
	amount: BN;
	auctionParamsOptions?: AuctionParamsRequestOptions;
	dlobServerHttpUrl: string;
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
	auctionParamsOptions?: AuctionParamsRequestOptions;
	dlobServerHttpUrl: string;
}

export interface SwiftOrderResult {
	orderObservable?: Observable<any>;
	signedMsgOrderUuid: Uint8Array;
}

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
	auctionParamsOptions = {},
}: RegularOrderParams): Promise<OptionalOrderParams> {
	// Extract optional parameters (no defaults except for what's required by server)
	const {
		maxLeverageSelected,
		maxLeverageOrderSize,
		reduceOnly,
		auctionDuration,
		auctionStartPriceOffset,
		auctionEndPriceOffset,
		auctionStartPriceOffsetFrom,
		auctionEndPriceOffsetFrom,
		slippageTolerance,
		isOracleOrder,
		orderType,
		...restOptions
	} = auctionParamsOptions;

	// Build URL parameters for server request
	const urlParamsObject: Record<string, string> = {
		// Required fields
		assetType,
		marketType: ENUM_UTILS.toStr(marketType),
		marketIndex: marketIndex.toString(),
		direction: ENUM_UTILS.toStr(direction),
		amount: amount.toString(),
	};

	// Add optional parameters only if they are provided
	const optionalParams = {
		maxLeverageSelected,
		maxLeverageOrderSize,
		reduceOnly,
		auctionDuration,
		auctionStartPriceOffset,
		auctionEndPriceOffset,
		auctionStartPriceOffsetFrom,
		auctionEndPriceOffsetFrom,
		slippageTolerance,
		isOracleOrder,
		orderType,
		additionalEndPriceBuffer: restOptions.additionalEndPriceBuffer,
		forceUpToSlippage: restOptions.forceUpToSlippage,
	};

	// Add defined optional parameters
	Object.entries(optionalParams).forEach(([key, value]) => {
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
async function createSwiftOrder({
	driftClient,
	user,
	assetType,
	marketIndex,
	direction,
	amount,
	dlobServerHttpUrl,
	auctionParamsOptions,
	swiftOptions,
}: Omit<OpenPerpMarketOrderParams, 'useSwift'> & {
	swiftOptions: SwiftOrderOptions;
}): Promise<SwiftOrderResult> {
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
		auctionParamsOptions,
	});

	// Fetch current slot programmatically
	const currentSlot = await driftClient.connection.getSlot();
	const userAccount = user.getUserAccount();

	// Use the existing prepSwiftOrder helper function
	const { hexEncodedSwiftOrderMessage, signedMsgOrderUuid } = prepSwiftOrder({
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
		slotBuffer: swiftOptions.signedMessageOrderSlotBuffer || 30,
	});

	// Sign the message
	const signedMessage = await swiftOptions.wallet.signMessage(
		hexEncodedSwiftOrderMessage.uInt8Array
	);

	// Initialize SwiftClient (required before using sendSwiftOrder)
	SwiftClient.init(swiftOptions.swiftServerUrl);

	// Create a promise-based wrapper for the sendSwiftOrder callback-based API
	return new Promise((resolve, reject) => {
		let orderObservable: Observable<any>;

		sendSwiftOrder({
			driftClient,
			marketId: MarketId.createPerpMarket(marketIndex),
			hexEncodedSwiftOrderMessageString: hexEncodedSwiftOrderMessage.string,
			signedMessage,
			signedMsgOrderUuid,
			takerAuthority: swiftOptions.wallet.publicKey,
			signingAuthority: swiftOptions.wallet.publicKey,
			auctionDurationSlot: orderParams.auctionDuration || undefined,
			swiftConfirmationSlotBuffer: 15,
			onExpired: (event) => {
				reject(
					new Error(`Swift order expired: ${event.message || 'Unknown reason'}`)
				);
			},
			onErrored: (event) => {
				reject(
					new Error(`Swift order error: ${event.message || 'Unknown error'}`)
				);
			},
			onConfirmed: (_event) => {
				resolve({
					orderObservable,
					signedMsgOrderUuid,
				});
			},
		}).catch(reject);
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
 * @param auctionParamsOptions - Optional parameters for auction params endpoint and order configuration
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
	auctionParamsOptions = {},
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
		auctionParamsOptions,
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
			slotBuffer: swiftOptions.signedMessageOrderSlotBuffer || 30,
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
 * @param auctionParamsOptions - Optional parameters for auction params endpoint and order configuration
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
	auctionParamsOptions,
	useSwift,
	swiftOptions,
}: OpenPerpMarketOrderParams<T>): Promise<
	T extends true ? SwiftOrderResult : Transaction | VersionedTransaction
> => {
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
		auctionParamsOptions,
	});

	// If useSwift is true, return the Swift result directly
	if (useSwift) {
		if (!swiftOptions) {
			throw new Error('swiftOptions is required when useSwift is true');
		}
		return (await createSwiftOrder({
			driftClient,
			user,
			assetType,
			marketIndex,
			direction,
			amount,
			dlobServerHttpUrl,
			auctionParamsOptions,
			swiftOptions,
		})) as T extends true
			? SwiftOrderResult
			: Transaction | VersionedTransaction;
	}

	// Regular order flow - create transaction instruction and build transaction
	const placeOrderIx = await driftClient.getPlaceOrdersIx([orderParams]);
	const openPerpMarketOrderTxn = await driftClient.txHandler.buildTransaction({
		instructions: [placeOrderIx],
		txVersion: 0,
		connection: driftClient.connection,
		preFlightCommitment: 'confirmed',
		fetchAllMarketLookupTableAccounts:
			driftClient.fetchAllLookupTableAccounts.bind(driftClient),
	});

	return openPerpMarketOrderTxn as T extends true
		? SwiftOrderResult
		: Transaction | VersionedTransaction;
};

/**
 * Creates a Swift (signed message) order directly.
 * This is a convenience function for when you only want to create Swift orders.
 *
 * @param params - All the parameters needed for creating a Swift order
 * @returns Promise resolving to SwiftOrderResult with observable and order UUID
 */
export const createSwiftPerpMarketOrder = async (
	params: Omit<OpenPerpMarketOrderParams, 'useSwift'> & {
		swiftOptions: SwiftOrderOptions;
	}
): Promise<SwiftOrderResult> => {
	return await createSwiftOrder({
		...params,
	});
};
