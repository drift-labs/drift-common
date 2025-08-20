import {
	DriftClient,
	User,
	BN,
	PositionDirection,
	OptionalOrderParams,
	MarketType,
	OrderParams,
	getOrderParams,
	generateSignedMsgUuid,
	getUserAccountPublicKey,
	getSignedMsgUserAccountPublicKey,
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

interface OpenPerpMarketOrderParams {
	driftClient: DriftClient;
	user: User;
	assetType: 'base' | 'quote';
	marketIndex: number;
	direction: PositionDirection;
	amount: BN;
	auctionParamsOptions?: AuctionParamsRequestOptions;
	dlobServerHttpUrl: string;
	useSwift?: boolean;
	swiftOptions?: SwiftOrderOptions;
	marketType?: MarketType;
}

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
	orderObservable: Observable<any>;
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

	// Handle special case for auction price caps
	if (restOptions.auctionPriceCaps) {
		urlParamsObject.auctionPriceCapsMin = restOptions.auctionPriceCaps.min.toString();
		urlParamsObject.auctionPriceCapsMax = restOptions.auctionPriceCaps.max.toString();
	}

	const urlParams = new URLSearchParams(urlParamsObject);

	// Get order params from server
	const requestUrl = `${dlobServerHttpUrl}/auctionParams?${urlParams.toString()}`;
	console.log(`🌐 [Server] Requesting auction params from: ${requestUrl}`);
	
	const response = await fetch(requestUrl);

	if (!response.ok) {
		console.error(`❌ [Server] Request failed with status ${response.status}: ${response.statusText}`);
		throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
	}

	console.log(`✅ [Server] Received response with status: ${response.status}`);
	const serverResponse: ServerAuctionParamsResponse = await response.json();
	console.log(`📋 [Server] Raw server response:`, JSON.stringify(serverResponse, null, 2));
	
	const mappedParams: MappedAuctionParams = mapAuctionParamsResponse(serverResponse);
	console.log(`🔄 [Server] Mapped auction params:`, JSON.stringify(mappedParams, null, 2));
	
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
 * Creates and submits a Swift (signed message) order
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
}: OpenPerpMarketOrderParams & { swiftOptions: SwiftOrderOptions }): Promise<SwiftOrderResult> {
	console.log('🚀 [Swift Order] Starting Swift order creation...');
	console.log(`📋 [Swift Order] Parameters: marketIndex=${marketIndex}, direction=${direction}, amount=${amount.toString()}, assetType=${assetType}`);
	
	// Get order parameters from server
	console.log('🌐 [Swift Order] Fetching order parameters from server...');
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
	console.log('✅ [Swift Order] Server order parameters received:', JSON.stringify(orderParams, null, 2));

	// Convert to OrderParams for signed message
	console.log('🔄 [Swift Order] Converting to final order parameters...');
	const finalOrderParams: OrderParams = getOrderParams(
		orderParams,
		// Swift server expects auctionDuration to be null if not set
		{
			...orderParams,
			auctionDuration: orderParams.auctionDuration || null,
		}
	);
	
	// Validate critical order parameters
	console.log('🔍 [Swift Order] Validating order parameters...');
	console.log('🔍 [Swift Order] baseAssetAmount:', finalOrderParams.baseAssetAmount?.toString());
	console.log('🔍 [Swift Order] auctionStartPrice:', finalOrderParams.auctionStartPrice?.toString());
	console.log('🔍 [Swift Order] auctionEndPrice:', finalOrderParams.auctionEndPrice?.toString());
	console.log('🔍 [Swift Order] auctionDuration:', finalOrderParams.auctionDuration);
	console.log('🔍 [Swift Order] oraclePriceOffset:', finalOrderParams.oraclePriceOffset);

	const userAccount = user.getUserAccount();
	const slotBuffer = swiftOptions.signedMessageOrderSlotBuffer || 30;
	
	// Fetch current slot programmatically
	console.log('🕐 [Swift Order] Fetching current slot...');
	const currentSlot = await driftClient.connection.getSlot();
	const slotForSignedMsg = new BN(currentSlot + slotBuffer);
	console.log(`✅ [Swift Order] Current slot: ${currentSlot}, slot for signed message: ${slotForSignedMsg.toString()}`);
	
	const signedMsgOrderUuid = generateSignedMsgUuid();
	console.log(`🔑 [Swift Order] Generated UUID: ${Buffer.from(signedMsgOrderUuid).toString('hex')}`);

	// Get taker public key
	console.log('👤 [Swift Order] Getting taker public key...');
	const takerPubkey = await getUserAccountPublicKey(
		driftClient.program.programId,
		swiftOptions.wallet.publicKey,
		userAccount.subAccountId
	);
	console.log(`✅ [Swift Order] Taker pubkey: ${takerPubkey.toString()}`);

	// Create signed message order params
	console.log(`🏗️  [Swift Order] Creating order message (isDelegate: ${swiftOptions.isDelegate || false})...`);
	const orderMessage = swiftOptions.isDelegate
		? {
				signedMsgOrderParams: finalOrderParams,
				uuid: signedMsgOrderUuid,
				slot: slotForSignedMsg,
				takerPubkey,
				stopLossOrderParams: null,
				takeProfitOrderParams: null,
		  }
		: {
				signedMsgOrderParams: finalOrderParams,
				uuid: signedMsgOrderUuid,
				slot: slotForSignedMsg,
				subAccountId: userAccount.subAccountId,
				stopLossOrderParams: null,
				takeProfitOrderParams: null,
		  };
	console.log('✅ [Swift Order] Order message created:', JSON.stringify(orderMessage, (key, value) => {
		// Convert BN values to string for logging
		if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'BN') {
			return value.toString();
		}
		return value;
	}, 2));

	// Encode the message
	console.log('🔐 [Swift Order] Encoding order message...');
	const encodedOrderMessage = driftClient.encodeSignedMsgOrderParamsMessage(
		orderMessage,
		swiftOptions.isDelegate || false
	);
	console.log(`✅ [Swift Order] Encoded message length: ${encodedOrderMessage.length} bytes`);
	console.log(`🔍 [Swift Order] Encoded message (first 50 chars): ${encodedOrderMessage.toString().substring(0, 50)}...`);

	// Create hex encoded message for signing (following UI pattern)
	console.log('🔄 [Swift Order] Creating hex encoded message...');
	const hexEncodedOrderMessage = Buffer.from(encodedOrderMessage.toString('hex'));
	console.log(`📄 [Swift Order] Hex encoded message length: ${hexEncodedOrderMessage.length} bytes`);
	
	// Sign the message
	console.log('✍️  [Swift Order] Signing hex encoded message...');
	const signedMessage = await swiftOptions.wallet.signMessage(
		new Uint8Array(hexEncodedOrderMessage)
	);
	console.log(`✅ [Swift Order] Message signed, signature length: ${signedMessage.length} bytes`);

	// Get signed message user orders account
	console.log('🏦 [Swift Order] Getting signed message user orders account...');
	const signedMsgUserOrdersAccountPubkey = getSignedMsgUserAccountPublicKey(
		driftClient.program.programId,
		swiftOptions.wallet.publicKey
	);
	console.log(`✅ [Swift Order] Signed message user orders account: ${signedMsgUserOrdersAccountPubkey.toString()}`);

	// Initialize SwiftClient if needed (should be done elsewhere in a real app)
	console.log(`🔧 [Swift Order] Initializing SwiftClient with URL: ${swiftOptions.swiftServerUrl}`);
	SwiftClient.init(swiftOptions.swiftServerUrl);

	// Send the swift order
	const confirmDuration = swiftOptions.confirmDuration || 30000; // 30 seconds default
	console.log(`📡 [Swift Order] Sending Swift order to server...`);
	console.log(`⏱️  [Swift Order] Confirm duration: ${confirmDuration}ms`);
	console.log(`🎯 [Swift Order] Market index: ${marketIndex}, Market type: PERP`);
	console.log(`🔍 [Swift Order] Delegate mode: ${swiftOptions.isDelegate || false}`);
	console.log(`🔍 [Swift Order] Signing authority: ${swiftOptions.wallet.publicKey.toString()}`);
	console.log(`🔍 [Swift Order] Taker authority: ${takerPubkey.toString()}`);
	
	try {
		const orderObservable = await SwiftClient.sendAndConfirmSwiftOrderWS(
			driftClient.connection,
			driftClient,
			marketIndex,
			MarketType.PERP,
			hexEncodedOrderMessage.toString(), // Send hex encoded message as string (following UI pattern)
			Buffer.from(signedMessage),
			takerPubkey,
			signedMsgUserOrdersAccountPubkey,
			signedMsgOrderUuid,
			confirmDuration,
			swiftOptions.isDelegate ? swiftOptions.wallet.publicKey : undefined // Only pass signing authority for delegate orders
		);
		console.log('✅ [Swift Order] Swift order submitted successfully!');

		return {
			orderObservable,
			signedMsgOrderUuid,
		};
	} catch (error) {
		console.error('❌ [Swift Order] Error submitting Swift order:', error);
		console.error('📊 [Swift Order] Error details:', {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	}
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
	marketType = MarketType.PERP,
}: OpenPerpMarketOrderParams): Promise<TransactionInstruction[]> => {
	if (!amount || amount.isZero()) {
		throw new Error('Amount must be greater than zero');
	}

	// If useSwift is true, create a Swift order instead
	if (useSwift) {
		if (!swiftOptions) {
			throw new Error('swiftOptions is required when useSwift is true');
		}
		await createSwiftOrder({
			driftClient,
			user,
			assetType,
			marketIndex,
			direction,
			amount,
			dlobServerHttpUrl,
			auctionParamsOptions,
			swiftOptions,
			marketType,
		});
		// Swift orders don't return transaction instructions
		return [];
	}

	// Regular order flow
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

	// Get the place order instruction
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
export const createOpenPerpMarketOrderTxn = async ({
	driftClient,
	user,
	assetType,
	marketIndex,
	direction,
	amount,
	dlobServerHttpUrl,
	auctionParamsOptions,
	useSwift = false,
	swiftOptions,
	marketType = MarketType.PERP,
}: OpenPerpMarketOrderParams): Promise<Transaction | VersionedTransaction | SwiftOrderResult> => {
	// If useSwift is true, return the Swift result directly
	if (useSwift) {
		if (!swiftOptions) {
			throw new Error('swiftOptions is required when useSwift is true');
		}
		return await createSwiftOrder({
			driftClient,
			user,
			assetType,
			marketIndex,
			direction,
			amount,
			dlobServerHttpUrl,
			auctionParamsOptions,
			swiftOptions,
			marketType,
		});
	}

	const openPerpMarketOrderIxs = await createOpenPerpMarketOrderIx({
		driftClient,
		user,
		assetType,
		marketIndex,
		direction,
		amount,
		dlobServerHttpUrl,
		auctionParamsOptions,
		useSwift: false, // Explicit false for regular transaction flow
		marketType,
	});

	const openPerpMarketOrderTxn = await driftClient.txHandler.buildTransaction({
		instructions: openPerpMarketOrderIxs,
		txVersion: 0,
		connection: driftClient.connection,
		preFlightCommitment: 'confirmed',
		fetchAllMarketLookupTableAccounts:
			driftClient.fetchAllLookupTableAccounts.bind(driftClient),
	});

	return openPerpMarketOrderTxn;
};

/**
 * Creates a Swift (signed message) order directly.
 * This is a convenience function for when you only want to create Swift orders.
 *
 * @param params - All the parameters needed for creating a Swift order
 * @returns Promise resolving to SwiftOrderResult with observable and order UUID
 */
export const createSwiftPerpMarketOrder = async (
	params: Omit<OpenPerpMarketOrderParams, 'useSwift'> & { swiftOptions: SwiftOrderOptions }
): Promise<SwiftOrderResult> => {
	return await createSwiftOrder({ 
		...params, 
		useSwift: true,
		marketType: params.marketType || MarketType.PERP
	});
};
