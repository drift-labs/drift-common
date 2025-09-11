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
	prepSignAndSendSwiftOrder,
	SwiftOrderOptions,
} from '../openSwiftOrder';
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

export const MINIMUM_SWIFT_LIMIT_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS = 35;

export const createSwiftLimitOrder = async (
	params: OpenPerpNonMarketOrderParams & {
		swiftOptions: SwiftOrderOptions;
	} & {
		orderConfig: {
			orderType: 'limit';
			limitPrice: BN;
		};
	}
): Promise<void> => {
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

	const userAccount = user.getUserAccount();
	const slotBuffer = Math.max(
		(swiftOptions.signedMessageOrderSlotBuffer || 0) +
			(orderParams.auctionDuration || 0),
		MINIMUM_SWIFT_LIMIT_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS
	); // limit orders require a much larger buffer, to replace the auction duration usually found in market orders

	await prepSignAndSendSwiftOrder({
		driftClient,
		subAccountId: userAccount.subAccountId,
		marketIndex,
		slotBuffer,
		swiftOptions,
		orderParams: {
			main: orderParams,
			takeProfit: orderConfig.bracketOrders?.takeProfit,
			stopLoss: orderConfig.bracketOrders?.stopLoss,
		},
	});
};

export const createOpenPerpNonMarketOrderTxn = async <T extends boolean>(
	params: OpenPerpNonMarketOrderParams<T> & { txParams?: TxParams }
): Promise<T extends true ? void : Transaction | VersionedTransaction> => {
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

		const swiftOrderResult = await createSwiftLimitOrder({
			...params,
			swiftOptions,
			orderConfig,
		});

		return swiftOrderResult as T extends true
			? void
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
		? void
		: Transaction | VersionedTransaction;
};
