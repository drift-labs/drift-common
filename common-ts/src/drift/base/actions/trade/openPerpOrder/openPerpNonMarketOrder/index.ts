import {
	DriftClient,
	User,
	BN,
	MarketType,
	PostOnlyParams,
	getLimitOrderParams,
	TxParams,
	OptionalOrderParams,
} from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import {
	prepSwiftOrder,
	sendSwiftOrder,
	SwiftOrderOptions,
	SwiftOrderResult,
} from '../openSwiftOrder';
import { MarketId } from '../../../../../../types';
import { SwiftClient } from '../../../../../../clients/swiftClient';
import {
	buildNonMarketOrderParams,
	NonMarketOrderParamsConfig,
	resolveBaseAssetAmount,
} from '../../../../../utils/orderParams';
import { ENUM_UTILS } from '../../../../../../utils';

export interface OpenPerpNonMarketOrderParams<T extends boolean = boolean>
	extends Omit<NonMarketOrderParamsConfig, 'marketType' | 'baseAssetAmount'> {
	driftClient: DriftClient;
	user: User;
	// Either new approach
	amount?: BN;
	assetType?: 'base' | 'quote';
	// Or legacy approach
	baseAssetAmount?: BN;
	// Common optional params
	reduceOnly?: boolean;
	postOnly?: PostOnlyParams;
	// Swift
	useSwift?: T;
	swiftOptions?: T extends true ? SwiftOrderOptions : never;
}

export const createOpenPerpNonMarketOrderIx = async (
	params: Omit<OpenPerpNonMarketOrderParams, 'useSwift' | 'swiftOptions'>
): Promise<TransactionInstruction> => {
	const {
		driftClient,
		user: _user,
		marketIndex,
		direction,
		reduceOnly = false,
		postOnly = PostOnlyParams.NONE,
		orderConfig,
	} = params;
	// Support both new (amount + assetType) and legacy (baseAssetAmount) approaches
	const finalBaseAssetAmount = resolveBaseAssetAmount({
		amount: 'amount' in params ? params.amount : undefined,
		assetType: 'assetType' in params ? params.assetType : undefined,
		baseAssetAmount:
			'baseAssetAmount' in params ? params.baseAssetAmount : undefined,
		limitPrice:
			'limitPrice' in params.orderConfig && params.orderConfig.limitPrice,
	});

	if (!finalBaseAssetAmount || finalBaseAssetAmount.isZero()) {
		throw new Error('Final base asset amount must be greater than zero');
	}

	const allOrders: OptionalOrderParams[] = [];

	const orderParams = buildNonMarketOrderParams({
		marketIndex,
		marketType: MarketType.PERP,
		direction,
		baseAssetAmount: finalBaseAssetAmount,
		orderConfig,
		reduceOnly,
		postOnly,
	});
	allOrders.push(orderParams);

	if ('bracketOrders' in orderConfig && orderConfig.bracketOrders?.takeProfit) {
		const takeProfitParams = buildNonMarketOrderParams({
			marketIndex,
			marketType: MarketType.PERP,
			direction: orderConfig.bracketOrders.takeProfit.direction,
			baseAssetAmount: finalBaseAssetAmount,
			orderConfig: {
				orderType: 'takeProfit',
				triggerPrice: orderConfig.bracketOrders.takeProfit.triggerPrice,
			},
			reduceOnly: true,
		});
		allOrders.push(takeProfitParams);
	}

	if ('bracketOrders' in orderConfig && orderConfig.bracketOrders?.stopLoss) {
		const stopLossParams = buildNonMarketOrderParams({
			marketIndex,
			marketType: MarketType.PERP,
			direction: orderConfig.bracketOrders.stopLoss.direction,
			baseAssetAmount: finalBaseAssetAmount,
			orderConfig: {
				orderType: 'stopLoss',
				triggerPrice: orderConfig.bracketOrders.stopLoss.triggerPrice,
			},
			reduceOnly: true,
		});
		allOrders.push(stopLossParams);
	}

	const placeOrderIx = await driftClient.getPlaceOrdersIx(allOrders);
	return placeOrderIx;
};

const createSwiftOrder = async (
	params: OpenPerpNonMarketOrderParams & {
		swiftOptions: SwiftOrderOptions;
	} & {
		orderConfig: {
			orderType: 'limit';
			limitPrice: BN;
		};
	}
): Promise<SwiftOrderResult> => {
	const {
		driftClient,
		user,
		marketIndex,
		direction,
		reduceOnly = false,
		swiftOptions,
		orderConfig,
	} = params;

	const limitPrice = orderConfig.limitPrice;

	if (limitPrice.isZero()) {
		throw new Error('LIMIT orders require limitPrice');
	}

	// Support both new (amount + assetType) and legacy (baseAssetAmount) approaches
	const finalBaseAssetAmount = resolveBaseAssetAmount({
		amount: 'amount' in params ? params.amount : undefined,
		assetType: 'assetType' in params ? params.assetType : undefined,
		baseAssetAmount:
			'baseAssetAmount' in params ? params.baseAssetAmount : undefined,
		limitPrice,
	});

	// Build limit order parameters directly like the UI does
	const orderParams = getLimitOrderParams({
		marketIndex,
		marketType: MarketType.PERP,
		direction,
		baseAssetAmount: finalBaseAssetAmount,
		price: limitPrice,
		reduceOnly,
		postOnly: PostOnlyParams.NONE, // we don't allow post only orders for SWIFT
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
			takeProfit: orderConfig.bracketOrders?.takeProfit,
			stopLoss: orderConfig.bracketOrders?.stopLoss,
		},
		slotBuffer: swiftOptions.signedMessageOrderSlotBuffer || 50,
	});

	// Sign the message
	const signedMessage = await swiftOptions.wallet.signMessage(
		hexEncodedSwiftOrderMessage.uInt8Array
	);

	// Initialize SwiftClient (required before using sendSwiftOrder)
	SwiftClient.init(swiftOptions.swiftServerUrl);

	// Create a promise-based wrapper for the sendSwiftOrder callback-based API
	const swiftOrderResult = sendSwiftOrder({
		driftClient,
		marketId: MarketId.createPerpMarket(marketIndex),
		hexEncodedSwiftOrderMessageString: hexEncodedSwiftOrderMessage.string,
		signedMessage,
		signedMsgOrderUuid,
		takerAuthority: swiftOptions.wallet.publicKey,
		signingAuthority: swiftOptions.wallet.publicKey,
		auctionDurationSlot: orderParams.auctionDuration || undefined,
		swiftConfirmationSlotBuffer: 30,
	});

	return swiftOrderResult;
};

export const createOpenPerpNonMarketOrderTxn = async <T extends boolean>(
	params: OpenPerpNonMarketOrderParams<T> & { txParams?: TxParams }
): Promise<
	T extends true ? SwiftOrderResult : Transaction | VersionedTransaction
> => {
	const { driftClient, swiftOptions, useSwift, orderConfig } = params;

	// If useSwift is true, return the Swift result directly
	if (useSwift) {
		if (!swiftOptions) {
			throw new Error('swiftOptions is required when useSwift is true');
		}

		if (orderConfig.orderType !== 'limit') {
			throw new Error('Only limit orders are supported with Swift');
		}

		if (
			params.postOnly &&
			!ENUM_UTILS.match(params.postOnly, PostOnlyParams.NONE)
		) {
			throw new Error('Post only orders are not supported with Swift');
		}

		const swiftOrderResult = await createSwiftOrder({
			...params,
			swiftOptions,
			orderConfig,
		});

		return swiftOrderResult as T extends true
			? SwiftOrderResult
			: Transaction | VersionedTransaction;
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
			txParams: params.txParams,
		});

	return openPerpNonMarketOrderTxn as T extends true
		? SwiftOrderResult
		: Transaction | VersionedTransaction;
};
