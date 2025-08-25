import {
	DriftClient,
	User,
	BN,
	PositionDirection,
	OptionalOrderParams,
	MarketType,
	OrderType,
	PostOnlyParams,
	getLimitOrderParams,
} from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
	PublicKey,
} from '@solana/web3.js';
import { prepSwiftOrder, sendSwiftOrder } from '../openSwiftOrder';
import { MarketId } from '../../../../../../types';
import { SwiftClient } from '../../../../../../clients/swiftClient';
import { ENUM_UTILS } from '../../../../../../utils';
import { buildNonMarketOrderParams } from '../../../../../utils/nonMarketOrderParams';
import { Observable } from 'rxjs';

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

export interface SwiftOrderResult {
	orderObservable?: Observable<any>;
	signedMsgOrderUuid: Uint8Array;
}

export interface OpenPerpNonMarketOrderParams {
	driftClient: DriftClient;
	user: User;
	marketIndex: number;
	direction: PositionDirection;
	// Either new approach
	amount?: BN;
	assetType?: 'base' | 'quote';
	// Or legacy approach
	baseAssetAmount?: BN;
	// Common optional params
	limitPrice?: BN;
	triggerPrice?: BN;
	orderType?: OrderType;
	reduceOnly?: boolean;
	postOnly?: PostOnlyParams;
	marketType?: MarketType;
	useSwift?: boolean;
	swiftOptions?: SwiftOrderOptions;
}

export const createOpenPerpNonMarketOrderIx = async (
	params: Omit<OpenPerpNonMarketOrderParams, 'useSwift' | 'swiftOptions'>
): Promise<TransactionInstruction[]> => {
	const {
		driftClient,
		user: _user,
		marketIndex,
		direction,
		limitPrice,
		triggerPrice,
		orderType = OrderType.LIMIT,
		reduceOnly = false,
		postOnly = PostOnlyParams.NONE,
		marketType = MarketType.PERP,
	} = params;
	// Support both new (amount + assetType) and legacy (baseAssetAmount) approaches
	let finalBaseAssetAmount: BN;

	if ('amount' in params && 'assetType' in params) {
		// New approach: convert quote to base if needed
		const { amount, assetType } = params;
		if (assetType === 'quote') {
			// For quote amounts, we need to convert to base using limit price
			if (!limitPrice || limitPrice.isZero()) {
				throw new Error(
					'When using quote asset type, limitPrice is required for conversion to base amount'
				);
			}
			// Convert quote amount to base amount: quoteAmount / price = baseAmount
			// Using PRICE_PRECISION as the limit price is in price precision
			const PRICE_PRECISION = new BN(10).pow(new BN(6));
			finalBaseAssetAmount = amount.mul(PRICE_PRECISION).div(limitPrice);
		} else {
			// Base amount, use directly
			finalBaseAssetAmount = amount;
		}
	} else if ('baseAssetAmount' in params) {
		// Legacy approach
		finalBaseAssetAmount = params.baseAssetAmount;
	} else {
		throw new Error(
			'Either (amount + assetType) or baseAssetAmount must be provided'
		);
	}

	if (!finalBaseAssetAmount || finalBaseAssetAmount.isZero()) {
		throw new Error('Final base asset amount must be greater than zero');
	}

	// For regular orders, we can support all non-market order types
	let orderParams: OptionalOrderParams;

	if (ENUM_UTILS.match(orderType, OrderType.LIMIT)) {
		if (!limitPrice || limitPrice.isZero()) {
			throw new Error('LIMIT orders require limitPrice');
		}
		orderParams = getLimitOrderParams({
			marketIndex,
			marketType,
			direction,
			baseAssetAmount: finalBaseAssetAmount,
			price: limitPrice,
			reduceOnly,
			postOnly,
		});
	} else {
		// For trigger orders and other non-market types, use the utility function
		orderParams = buildNonMarketOrderParams({
			marketIndex,
			marketType,
			direction,
			baseAssetAmount: finalBaseAssetAmount,
			orderType,
			limitPrice,
			triggerPrice,
			reduceOnly,
			postOnly,
		});
	}

	const placeOrderIx = await driftClient.getPlaceOrdersIx([orderParams]);
	return [placeOrderIx];
};

const createSwiftOrder = async (
	params: OpenPerpNonMarketOrderParams & {
		swiftOptions: SwiftOrderOptions;
	}
): Promise<SwiftOrderResult> => {
	const {
		driftClient,
		user,
		marketIndex,
		direction,
		limitPrice,
		triggerPrice: _triggerPrice,
		orderType: _orderType = OrderType.LIMIT,
		reduceOnly = false,
		postOnly = PostOnlyParams.NONE,
		marketType = MarketType.PERP,
		swiftOptions,
	} = params;

	if (!limitPrice || limitPrice.isZero()) {
		throw new Error('LIMIT orders require limitPrice');
	}

	// Support both new (amount + assetType) and legacy (baseAssetAmount) approaches
	let finalBaseAssetAmount: BN;

	if ('amount' in params && 'assetType' in params) {
		// New approach: convert quote to base if needed
		const { amount, assetType } = params;
		if (assetType === 'quote') {
			// Convert quote amount to base amount: quoteAmount / price = baseAmount
			const PRICE_PRECISION = new BN(10).pow(new BN(6));
			finalBaseAssetAmount = amount.mul(PRICE_PRECISION).div(limitPrice);
		} else {
			// Base amount, use directly
			finalBaseAssetAmount = amount;
		}
	} else if ('baseAssetAmount' in params) {
		// Legacy approach
		finalBaseAssetAmount = params.baseAssetAmount;
	} else {
		throw new Error(
			'Either (amount + assetType) or baseAssetAmount must be provided'
		);
	}

	// Build limit order parameters directly like the UI does
	const orderParams = getLimitOrderParams({
		marketIndex,
		marketType,
		direction,
		baseAssetAmount: finalBaseAssetAmount,
		price: limitPrice,
		reduceOnly,
		postOnly,
	});

	console.log('🔧 Order params:', JSON.stringify(orderParams, null, 2));

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
			swiftConfirmationSlotBuffer: 30,
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
};

export const createOpenPerpNonMarketOrderTxn = async (
	params: OpenPerpNonMarketOrderParams
): Promise<VersionedTransaction | Transaction | SwiftOrderResult> => {
	const { driftClient, useSwift = false, swiftOptions } = params;

	// If useSwift is true, return the Swift result directly
	if (useSwift) {
		if (!swiftOptions) {
			throw new Error('swiftOptions is required when useSwift is true');
		}
		return await createSwiftOrder({
			...params,
			swiftOptions,
		});
	}

	const instructions = await createOpenPerpNonMarketOrderIx(params);

	const openPerpNonMarketOrderTxn =
		await driftClient.txHandler.buildTransaction({
			instructions,
			txVersion: 0,
			connection: driftClient.connection,
			preFlightCommitment: 'confirmed',
			fetchAllMarketLookupTableAccounts:
				driftClient.fetchAllLookupTableAccounts.bind(driftClient),
		});

	return openPerpNonMarketOrderTxn;
};

/**
 * Creates a Swift (signed message) perp non-market order directly
 * Only supports LIMIT orders as Swift orders
 *
 * @param params - All the parameters needed for creating a Swift non-market order
 * @returns Promise resolving to SwiftOrderResult with observable and order UUID
 */
export const createSwiftPerpNonMarketOrder = async (
	params: Omit<OpenPerpNonMarketOrderParams, 'useSwift'> & {
		swiftOptions: SwiftOrderOptions;
	}
): Promise<SwiftOrderResult> => {
	return await createSwiftOrder({
		...params,
		orderType: params.orderType || OrderType.LIMIT,
		marketType: params.marketType || MarketType.PERP,
		swiftOptions: params.swiftOptions,
	} as OpenPerpNonMarketOrderParams & { swiftOptions: SwiftOrderOptions });
};
