import {
	DriftClient,
	User,
	BN,
	MarketType,
	PostOnlyParams,
	OptionalOrderParams,
	PositionDirection,
	OrderParamsBitFlag,
	OrderType,
} from '@drift-labs/sdk';
import {
	PublicKey,
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
	resolveBaseAssetAmount,
} from '../../../../../utils/orderParams';
import { ENUM_UTILS } from '../../../../../../utils';
import {
	HighLeverageOptions,
	ORDER_COMMON_UTILS,
} from '../../../../../../common-ui-utils';
import { createPlaceAndTakePerpMarketOrderIx } from '../openPerpMarketOrder';
import {
	TxnOrSwiftResult,
	LimitAuctionConfig,
	LimitOrderParamsOrderConfig,
	NonMarketOrderParamsConfig,
} from '../types';
import { WithTxnParams } from '../../../../types';
import { getPositionMaxLeverageIxIfNeeded } from '../positionMaxLeverage';
import { getLimitAuctionOrderParams } from '../auction';

export interface OpenPerpNonMarketOrderBaseParams
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
	userOrderId?: number;
	autoEnterHighLeverageModeBufferPct?: number;
	/**
	 * If provided, will override the main signer for the order. Otherwise, the main signer will be the user's authority.
	 * This is only applicable for non-SWIFT orders.
	 */
	mainSignerOverride?: PublicKey;
	/**
	 * Optional builder code parameters for revenue sharing.
	 * Only applicable for Swift orders for now.
	 */
	builderParams?: {
		builderIdx: number;
		builderFeeTenthBps: number;
	};
	highLeverageOptions?: HighLeverageOptions;
}

export interface OpenPerpNonMarketOrderParamsWithSwift
	extends OpenPerpNonMarketOrderBaseParams {
	swiftOptions: SwiftOrderOptions;
}

export type OpenPerpNonMarketOrderParams<
	T extends boolean = boolean,
	S extends Omit<SwiftOrderOptions, 'swiftServerUrl'> = Omit<
		SwiftOrderOptions,
		'swiftServerUrl'
	>
> = T extends true
	? OpenPerpNonMarketOrderBaseParams & {
			useSwift: T;
			swiftOptions: S;
	  }
	: OpenPerpNonMarketOrderBaseParams & {
			useSwift: T;
			swiftOptions?: never;
	  };

/**
 * Creates a transaction instruction to open multiple non-market orders.
 */
export const createMultipleOpenPerpNonMarketOrderIx = async (params: {
	driftClient: DriftClient;
	user: User;
	orderParamsConfigs: NonMarketOrderParamsConfig[];
	enterHighLeverageMode?: boolean;
	/**
	 * If provided, will override the main signer for the order. Otherwise, the main signer will be the user's authority.
	 */
	mainSignerOverride?: PublicKey;
}): Promise<TransactionInstruction> => {
	const { driftClient, orderParamsConfigs, mainSignerOverride } = params;

	const orderParams = orderParamsConfigs.map(buildNonMarketOrderParams);

	if (params.enterHighLeverageMode && orderParams.length > 0) {
		orderParams[0].bitFlags = OrderParamsBitFlag.UpdateHighLeverageMode;
	}

	const placeOrderIx = await driftClient.getPlaceOrdersIx(
		orderParams,
		undefined,
		{
			authority: mainSignerOverride,
		}
	);
	return placeOrderIx;
};

/**
 * Creates a transaction instruction to open a non-market order.
 * Allows for bracket orders to be opened in the same transaction.
 *
 * If `limitAuction` is enabled, a placeAndTake order is created to simulate a market auction order,
 * with the end price being the limit price.
 */
export const createOpenPerpNonMarketOrderIxs = async (
	params: OpenPerpNonMarketOrderBaseParams
): Promise<TransactionInstruction[]> => {
	const {
		driftClient,
		user,
		marketIndex,
		direction,
		reduceOnly = false,
		postOnly = PostOnlyParams.NONE,
		orderConfig,
		userOrderId = 0,
		positionMaxLeverage,
		mainSignerOverride,
		highLeverageOptions,
	} = params;
	// Support both new (amount + assetType) and legacy (baseAssetAmount) approaches
	const finalBaseAssetAmount = resolveBaseAssetAmount({
		amount: 'amount' in params ? params.amount : undefined,
		assetType: 'assetType' in params ? params.assetType : undefined,
		baseAssetAmount:
			'baseAssetAmount' in params ? params.baseAssetAmount : undefined,
		limitPrice:
			'limitPrice' in params.orderConfig
				? params.orderConfig.limitPrice
				: undefined,
	});

	if (!finalBaseAssetAmount || finalBaseAssetAmount.isZero()) {
		throw new Error('Final base asset amount must be greater than zero');
	}

	const allOrders: OptionalOrderParams[] = [];
	const allIxs: TransactionInstruction[] = [];

	const leverageIx = await getPositionMaxLeverageIxIfNeeded(
		driftClient,
		user,
		marketIndex,
		positionMaxLeverage
	);
	if (leverageIx) {
		allIxs.push(leverageIx);
	}

	// handle limit auction
	if (
		orderConfig.orderType === 'limit' &&
		orderConfig.limitAuction?.enable &&
		ENUM_UTILS.match(postOnly, PostOnlyParams.NONE)
	) {
		const limitAuctionOrderParams = await getLimitAuctionOrderParams({
			...params,
			marketType: MarketType.PERP,
			baseAssetAmount: finalBaseAssetAmount,
			orderConfig: orderConfig as LimitOrderParamsOrderConfig & {
				limitAuction: LimitAuctionConfig;
			},
		});

		let createdPlaceAndTakeIx = false;

		// if it is a limit auction order, we create a placeAndTake order to simulate a market order.
		// this is useful when a limit order is crossing, and we want to achieve the best fill price through a placeAndTake.
		// falls back to limit order with auction params if the placeAndTake order creation fails
		if (
			limitAuctionOrderParams.auctionDuration &&
			limitAuctionOrderParams.auctionDuration > 0 &&
			orderConfig.limitAuction?.usePlaceAndTake?.enable
		) {
			try {
				const placeAndTakeIx = await createPlaceAndTakePerpMarketOrderIx({
					assetType: 'base',
					amount: finalBaseAssetAmount,
					orderType: OrderType.LIMIT,
					price: orderConfig.limitPrice,
					direction,
					dlobServerHttpUrl: orderConfig.limitAuction.dlobServerHttpUrl,
					marketIndex,
					driftClient,
					user,
					userOrderId,
					reduceOnly,
					positionMaxLeverage,
					optionalAuctionParamsInputs:
						orderConfig.limitAuction.optionalLimitAuctionParams,
					auctionDurationPercentage:
						orderConfig.limitAuction.usePlaceAndTake.auctionDurationPercentage,
					referrerInfo: orderConfig.limitAuction.usePlaceAndTake.referrerInfo,
					highLeverageOptions,
				});
				allIxs.push(placeAndTakeIx);
				createdPlaceAndTakeIx = true;
			} catch (e) {
				console.error(
					'Failed to create placeAndTake order for limit auction order',
					e
				);
				createdPlaceAndTakeIx = false;
			}
		}

		// fallback to normal limit order with auction params
		if (!createdPlaceAndTakeIx) {
			allOrders.push(limitAuctionOrderParams);
		}
	} else {
		const orderParams = buildNonMarketOrderParams({
			marketIndex,
			marketType: MarketType.PERP,
			direction,
			baseAssetAmount: finalBaseAssetAmount,
			orderConfig,
			reduceOnly,
			postOnly,
			userOrderId,
			positionMaxLeverage,
		});

		const bitFlags = ORDER_COMMON_UTILS.getPerpOrderParamsBitFlags(
			marketIndex,
			driftClient,
			user,
			positionMaxLeverage,
			highLeverageOptions
		);
		orderParams.bitFlags = bitFlags;

		allOrders.push(orderParams);
	}

	const bracketOrdersDirection = ENUM_UTILS.match(
		direction,
		PositionDirection.LONG
	)
		? PositionDirection.SHORT
		: PositionDirection.LONG;

	if ('bracketOrders' in orderConfig && orderConfig.bracketOrders?.takeProfit) {
		const takeProfitParams = buildNonMarketOrderParams({
			marketIndex,
			marketType: MarketType.PERP,
			direction: bracketOrdersDirection,
			baseAssetAmount:
				orderConfig.bracketOrders.takeProfit.baseAssetAmount ??
				finalBaseAssetAmount,
			orderConfig: {
				orderType: 'takeProfit',
				triggerPrice: orderConfig.bracketOrders.takeProfit.triggerPrice,
				limitPrice: orderConfig.bracketOrders.takeProfit.limitPrice,
			},
			reduceOnly: orderConfig.bracketOrders.takeProfit.reduceOnly ?? true,
			positionMaxLeverage,
		});
		allOrders.push(takeProfitParams);
	}

	if ('bracketOrders' in orderConfig && orderConfig.bracketOrders?.stopLoss) {
		const stopLossParams = buildNonMarketOrderParams({
			marketIndex,
			marketType: MarketType.PERP,
			direction: bracketOrdersDirection,
			baseAssetAmount:
				orderConfig.bracketOrders.stopLoss.baseAssetAmount ??
				finalBaseAssetAmount,
			orderConfig: {
				orderType: 'stopLoss',
				triggerPrice: orderConfig.bracketOrders.stopLoss.triggerPrice,
				limitPrice: orderConfig.bracketOrders.stopLoss.limitPrice,
			},
			reduceOnly: orderConfig.bracketOrders.stopLoss.reduceOnly ?? true,
			positionMaxLeverage,
		});
		allOrders.push(stopLossParams);
	}

	if (allOrders.length > 0) {
		const placeOrderIx = await driftClient.getPlaceOrdersIx(
			allOrders,
			undefined,
			{
				authority: mainSignerOverride,
			}
		);
		allIxs.push(placeOrderIx);
	}

	return allIxs;
};

export const createSwiftLimitOrder = async (
	params: OpenPerpNonMarketOrderParamsWithSwift & {
		orderConfig: LimitOrderParamsOrderConfig;
	}
): Promise<void> => {
	const { driftClient, user, marketIndex, swiftOptions, orderConfig } = params;

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

	const orderParams = orderConfig.limitAuction?.enable
		? await getLimitAuctionOrderParams({
				...params,
				marketType: MarketType.PERP,
				baseAssetAmount: finalBaseAssetAmount,
				orderConfig: orderConfig as LimitOrderParamsOrderConfig & {
					limitAuction: LimitAuctionConfig;
				},
		  })
		: buildNonMarketOrderParams({
				marketIndex,
				marketType: MarketType.PERP,
				direction: params.direction,
				baseAssetAmount: finalBaseAssetAmount,
				orderConfig,
				reduceOnly: params.reduceOnly,
				postOnly: params.postOnly,
				userOrderId: params.userOrderId,
				positionMaxLeverage: params.positionMaxLeverage,
		  });

	const userAccount = user.getUserAccount();

	await prepSignAndSendSwiftOrder({
		driftClient,
		subAccountId: userAccount.subAccountId,
		userAccountPubKey: user.userAccountPublicKey,
		marketIndex,
		userSigningSlotBuffer: swiftOptions.userSigningSlotBuffer,
		swiftOptions,
		orderParams: {
			main: orderParams,
			takeProfit: orderConfig.bracketOrders?.takeProfit,
			stopLoss: orderConfig.bracketOrders?.stopLoss,
			positionMaxLeverage: params.positionMaxLeverage,
		},
		builderParams: params.builderParams,
	});
};

export const createOpenPerpNonMarketOrderTxn = async (
	params: WithTxnParams<OpenPerpNonMarketOrderBaseParams>
): Promise<Transaction | VersionedTransaction> => {
	const { driftClient } = params;

	const instructions = await createOpenPerpNonMarketOrderIxs(params);

	const openPerpNonMarketOrderTxn = await driftClient.buildTransaction(
		instructions,
		params.txParams
	);

	return openPerpNonMarketOrderTxn;
};

export const createOpenPerpNonMarketOrder = async <T extends boolean>(
	params: WithTxnParams<OpenPerpNonMarketOrderParams<T, SwiftOrderOptions>>
): Promise<TxnOrSwiftResult<T>> => {
	const { swiftOptions, useSwift, orderConfig } = params;

	// If useSwift is true, return the Swift result directly
	if (useSwift) {
		if (orderConfig.orderType !== 'limit') {
			throw new Error('Only limit orders are supported with Swift');
		}

		if (!swiftOptions) {
			throw new Error('swiftOptions is required when useSwift is true');
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

		return swiftOrderResult as TxnOrSwiftResult<T>;
	}

	const marketOrderTxn = await createOpenPerpNonMarketOrderTxn(params);

	return marketOrderTxn as TxnOrSwiftResult<T>;
};
