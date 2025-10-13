import {
	DriftClient,
	User,
	BN,
	MarketType,
	PostOnlyParams,
	getLimitOrderParams,
	OptionalOrderParams,
	PRICE_PRECISION_EXP,
	BigNum,
	oraclePriceBands as getOraclePriceBands,
	PositionDirection,
	OrderParamsBitFlag,
	BASE_PRECISION,
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
import { fetchAuctionOrderParams } from '../dlobServer';
import {
	COMMON_UI_UTILS,
	ORDER_COMMON_UTILS,
} from '../../../../../../common-ui-utils';
import { createPlaceAndTakePerpMarketOrderIx } from '../openPerpMarketOrder';
import invariant from 'tiny-invariant';
import {
	TxnOrSwiftResult,
	LimitAuctionConfig,
	LimitOrderParamsOrderConfig,
	NonMarketOrderParamsConfig,
	WithTxnParams,
} from '../types';
import { getPositionMaxLeverageIxIfNeeded } from '../positionMaxLeverage';

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

const getLimitAuctionOrderParams = async ({
	driftClient,
	user,
	marketIndex,
	direction,
	baseAssetAmount,
	userOrderId = 0,
	reduceOnly = false,
	postOnly = PostOnlyParams.NONE,
	orderConfig,
}: OpenPerpNonMarketOrderBaseParams & {
	baseAssetAmount: BN;
	orderConfig: LimitOrderParamsOrderConfig & {
		limitAuction: LimitAuctionConfig;
	};
}): Promise<OptionalOrderParams> => {
	const orderParams = await fetchAuctionOrderParams({
		driftClient,
		user,
		assetType: 'base',
		marketIndex,
		marketType: MarketType.PERP,
		direction,
		amount: baseAssetAmount,
		dlobServerHttpUrl: orderConfig.limitAuction.dlobServerHttpUrl,
		optionalAuctionParamsInputs:
			orderConfig.limitAuction.optionalLimitAuctionParams,
	});

	const perpMarketAccount = driftClient.getPerpMarketAccount(marketIndex);

	invariant(perpMarketAccount, 'Perp market account not found');
	invariant(orderConfig.limitAuction.oraclePrice, 'Oracle price not found');
	invariant(orderParams.auctionStartPrice, 'Auction start price not found');

	const oraclePriceBands = orderConfig.limitAuction.oraclePrice
		? getOraclePriceBands(perpMarketAccount, {
				price: orderConfig.limitAuction.oraclePrice,
		  })
		: undefined;
	const auctionDuration = ORDER_COMMON_UTILS.getPerpAuctionDuration(
		orderConfig.limitPrice.sub(orderParams.auctionStartPrice).abs(),
		orderConfig.limitAuction.oraclePrice,
		perpMarketAccount.contractTier
	);
	const limitAuctionParams = COMMON_UI_UTILS.getLimitAuctionParams({
		direction,
		inputPrice: BigNum.from(orderConfig.limitPrice, PRICE_PRECISION_EXP),
		startPriceFromSettings: orderParams.auctionStartPrice,
		duration: auctionDuration,
		auctionStartPriceOffset: orderConfig.limitAuction.auctionStartPriceOffset,
		oraclePriceBands,
	});

	const limitAuctionOrderParams = getLimitOrderParams({
		marketIndex,
		marketType: MarketType.PERP,
		direction,
		baseAssetAmount,
		reduceOnly,
		postOnly,
		price: orderConfig.limitPrice,
		userOrderId,
		...limitAuctionParams,
	});

	const oraclePrice = driftClient.getOracleDataForPerpMarket(marketIndex).price;
	const totalQuoteAmount = baseAssetAmount.mul(oraclePrice).div(BASE_PRECISION);

	const bitFlags = ORDER_COMMON_UTILS.getPerpOrderParamsBitFlags(
		marketIndex,
		driftClient,
		user,
		totalQuoteAmount,
		direction
	);

	return {
		...limitAuctionOrderParams,
		bitFlags,
	};
};

/**
 * Creates a transaction instruction to open multiple non-market orders.
 */
export const createMultipleOpenPerpNonMarketOrderIx = async (params: {
	driftClient: DriftClient;
	user: User;
	marketIndex: number;
	direction: PositionDirection;
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
	if (orderConfig.orderType === 'limit' && orderConfig.limitAuction?.enable) {
		const limitAuctionOrderParams = await getLimitAuctionOrderParams({
			...params,
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
					direction,
					dlobServerHttpUrl: orderConfig.limitAuction.dlobServerHttpUrl,
					marketIndex,
					driftClient,
					user,
					userOrderId,
					optionalAuctionParamsInputs:
						orderConfig.limitAuction.optionalLimitAuctionParams,
					auctionDurationPercentage:
						orderConfig.limitAuction.usePlaceAndTake.auctionDurationPercentage,
					referrerInfo: orderConfig.limitAuction.usePlaceAndTake.referrerInfo,
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
		});

		const oraclePrice =
			driftClient.getOracleDataForPerpMarket(marketIndex).price;
		const totalQuoteAmount = finalBaseAssetAmount
			.mul(oraclePrice)
			.div(BASE_PRECISION);

		const bitFlags = ORDER_COMMON_UTILS.getPerpOrderParamsBitFlags(
			marketIndex,
			driftClient,
			user,
			totalQuoteAmount,
			direction
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

export const MINIMUM_SWIFT_LIMIT_ORDER_SIGNING_EXPIRATION_BUFFER_SLOTS = 35;

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
		userAccountPubKey: user.userAccountPublicKey,
		marketIndex,
		slotBuffer,
		swiftOptions,
		orderParams: {
			main: orderParams,
			takeProfit: orderConfig.bracketOrders?.takeProfit,
			stopLoss: orderConfig.bracketOrders?.stopLoss,
			positionMaxLeverage: params.positionMaxLeverage,
		},
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
