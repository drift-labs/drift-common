import {
	DriftClient,
	User,
	BN,
	MarketType,
	PostOnlyParams,
	getLimitOrderParams,
	TxParams,
	OptionalOrderParams,
	PRICE_PRECISION_EXP,
	BigNum,
	oraclePriceBands as getOraclePriceBands,
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
	LimitOrderParamsOrderConfig,
	NonMarketOrderParamsConfig,
	resolveBaseAssetAmount,
} from '../../../../../utils/orderParams';
import { ENUM_UTILS } from '../../../../../../utils';
import { fetchOrderParamsFromServer } from '../dlobServer';
import {
	COMMON_UI_UTILS,
	ORDER_COMMON_UTILS,
} from '../../../../../../common-ui-utils';
import { createPlaceAndTakePerpMarketOrderIx } from '../openPerpMarketOrder';

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
}

export interface OpenPerpNonMarketOrderParamsWithSwift
	extends OpenPerpNonMarketOrderBaseParams {
	swiftOptions: SwiftOrderOptions;
}

export interface OpenPerpNonMarketOrderParams<T extends boolean = boolean>
	extends OpenPerpNonMarketOrderBaseParams {
	useSwift: T;
	swiftOptions?: T extends true ? SwiftOrderOptions : never;
}

const getLimitAuctionOrderParams = async ({
	driftClient,
	user,
	marketIndex,
	direction,
	baseAssetAmount,
	reduceOnly = false,
	postOnly = PostOnlyParams.NONE,
	orderConfig,
}: OpenPerpNonMarketOrderBaseParams & {
	baseAssetAmount: BN;
	orderConfig: LimitOrderParamsOrderConfig;
}) => {
	const orderParams = await fetchOrderParamsFromServer({
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
	const oraclePriceBands = orderConfig.limitAuction.oraclePrice
		? getOraclePriceBands(perpMarketAccount, {
				price: orderConfig.limitAuction.oraclePrice,
		  })
		: undefined;
	const auctionDuration = ORDER_COMMON_UTILS.getPerpAuctionDuration(
		orderConfig.limitPrice.sub(orderParams.auctionStartPrice).abs(),
		orderConfig.limitAuction.oraclePrice,
		driftClient.getPerpMarketAccount(marketIndex).contractTier
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
		baseAssetAmount: baseAssetAmount,
		reduceOnly,
		postOnly,
		price: orderConfig.limitPrice,
		...limitAuctionParams,
	});

	return limitAuctionOrderParams;
};

export const createOpenPerpNonMarketOrderIx = async (
	params: OpenPerpNonMarketOrderBaseParams
): Promise<TransactionInstruction> => {
	const {
		driftClient,
		user,
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

	// handle limit auction
	if (orderConfig.orderType === 'limit' && orderConfig.limitAuction?.enable) {
		const limitAuctionOrderParams = await getLimitAuctionOrderParams({
			...params,
			baseAssetAmount: finalBaseAssetAmount,
			orderConfig: orderConfig,
		});

		// if it is a limit auction order, we create a placeAndTake order to simulate a market order.
		// this is useful when a limit order is crossing, and we want to achieve the best fill price through an auction.
		if (limitAuctionOrderParams.auctionDuration > 0) {
			const placeAndTakeIx = await createPlaceAndTakePerpMarketOrderIx({
				orderParams: limitAuctionOrderParams,
				direction,
				dlobServerHttpUrl: orderConfig.limitAuction.dlobServerHttpUrl,
				marketIndex,
				driftClient,
				user,
				auctionDurationPercentage:
					orderConfig.limitAuction.auctionDurationPercentage,
			});
			return placeAndTakeIx;
		} else {
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
		});
		allOrders.push(orderParams);
	}

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

	// TODO: handle scaled orders
	// TODO: handle auto-enter HLM

	const placeOrderIx = await driftClient.getPlaceOrdersIx(allOrders);
	return placeOrderIx;
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

	const orderParams = await getLimitAuctionOrderParams({
		...params,
		baseAssetAmount: finalBaseAssetAmount,
		orderConfig: orderConfig,
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

export const createOpenPerpNonMarketOrderTxn = async (
	params: OpenPerpNonMarketOrderBaseParams & { txParams?: TxParams }
): Promise<Transaction | VersionedTransaction> => {
	const { driftClient } = params;

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

	return openPerpNonMarketOrderTxn;
};

export const createOpenPerpNonMarketOrder = async <T extends boolean>(
	params: OpenPerpNonMarketOrderParams<T> & { txParams?: TxParams }
): Promise<T extends true ? void : Transaction | VersionedTransaction> => {
	const { swiftOptions, useSwift, orderConfig } = params;

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

	const marketOrderTxn = await createOpenPerpNonMarketOrderTxn(params);

	return marketOrderTxn as T extends true
		? void
		: Transaction | VersionedTransaction;
};
