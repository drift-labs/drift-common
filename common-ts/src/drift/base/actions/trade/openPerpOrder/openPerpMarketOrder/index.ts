import {
	DriftClient,
	User,
	BN,
	PositionDirection,
	OptionalOrderParams,
	MarketType,
	getUserStatsAccountPublicKey,
	ReferrerInfo,
	BASE_PRECISION,
} from '@drift-labs/sdk';
import {
	PublicKey,
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import { ENUM_UTILS } from '../../../../../../utils';
import {
	prepSignAndSendSwiftOrder,
	SwiftOrderOptions,
} from '../openSwiftOrder';
import { buildNonMarketOrderParams } from '../../../../../utils/orderParams';
import {
	fetchAuctionOrderParams,
	fetchTopMakers,
	OptionalAuctionParamsRequestInputs,
} from '../dlobServer';
import { ORDER_COMMON_UTILS } from '../../../../../../common-ui-utils/order';
import { WithTxnParams } from '../../../../types';
import { TxnOrSwiftResult } from '../types';
import { NoTopMakersError } from '../../../../../Drift/constants/errors';
import { PlaceAndTakeParams, OptionalTriggerOrderParams } from '../types';
import { getPositionMaxLeverageIxIfNeeded } from '../positionMaxLeverage';

export interface OpenPerpMarketOrderBaseParams {
	driftClient: DriftClient;
	user: User;
	assetType: 'base' | 'quote';
	marketIndex: number;
	direction: PositionDirection;
	amount: BN;
	dlobServerHttpUrl: string;
	// mainly used for UI order identification
	userOrderId?: number;
	placeAndTake?: PlaceAndTakeParams;
	optionalAuctionParamsInputs?: OptionalAuctionParamsRequestInputs;
	bracketOrders?: {
		takeProfit?: OptionalTriggerOrderParams;
		stopLoss?: OptionalTriggerOrderParams;
	};
	/**
	 * Optional per-market leverage to set for this position.
	 * If provided and different from current position's leverage, will add an instruction
	 * to update the position's maxMarginRatio before placing the order.
	 * Example: 5 for 5x leverage, 10 for 10x leverage
	 */
	positionMaxLeverage?: number;
	/**
	 * If provided, will override the main signer for the order. Otherwise, the main signer will be the user's authority.
	 * This is only applicable for non-SWIFT orders.
	 */
	mainSignerOverride?: PublicKey;
	/**
	 * Optional builder code parameters for revenue sharing.
	 * Only applicable for Swift orders.
	 *
	 * Prerequisites:
	 * - User must have initialized a RevenueShareEscrow account
	 * - Builder must be in the user's approved_builders list
	 * - builderFeeTenthBps must not exceed the builder's max_fee_tenth_bps
	 *
	 * @example
	 * ```typescript
	 * builderParams: {
	 *   builderIdx: 0,          // First builder in approved list
	 *   builderFeeTenthBps: 50  // 5 bps = 0.05%
	 * }
	 * ```
	 */
	builderParams?: {
		/**
		 * Index of the builder in the user's approved_builders list.
		 */
		builderIdx: number;
		/**
		 * Fee to charge for this order, in tenths of basis points.
		 * Must be <= the builder's max_fee_tenth_bps.
		 */
		builderFeeTenthBps: number;
	};
}

export interface OpenPerpMarketOrderBaseParamsWithSwift
	extends Omit<OpenPerpMarketOrderBaseParams, 'placeAndTake'> {
	swiftOptions: SwiftOrderOptions;
}

export type OpenPerpMarketOrderParams<
	T extends boolean = boolean,
	S extends Omit<SwiftOrderOptions, 'swiftServerUrl'> = Omit<
		SwiftOrderOptions,
		'swiftServerUrl'
	>
> = T extends true
	? OpenPerpMarketOrderBaseParams & {
			useSwift: T;
			swiftOptions: S;
			placeAndTake?: never;
	  }
	: OpenPerpMarketOrderBaseParams & {
			useSwift: T;
			placeAndTake?: PlaceAndTakeParams;
			swiftOptions?: never;
	  };
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
	userOrderId = 0,
	positionMaxLeverage,
	builderParams,
}: OpenPerpMarketOrderBaseParamsWithSwift): Promise<void> {
	if (amount.isZero()) {
		throw new Error('Amount must be greater than zero');
	}

	// Get order parameters from server
	const fetchedOrderParams = await fetchAuctionOrderParams({
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

	const oraclePrice = driftClient.getOracleDataForPerpMarket(marketIndex).price;
	const totalQuoteAmount = amount.mul(oraclePrice).div(BASE_PRECISION);

	const bitFlags = ORDER_COMMON_UTILS.getPerpOrderParamsBitFlags(
		marketIndex,
		driftClient,
		user,
		totalQuoteAmount,
		direction
	);

	const orderParams = {
		...fetchedOrderParams,
		userOrderId,
		bitFlags,
	};

	const userAccount = user.getUserAccount();
	const slotBuffer = swiftOptions.signedMessageOrderSlotBuffer || 7;

	await prepSignAndSendSwiftOrder({
		driftClient,
		subAccountId: userAccount.subAccountId,
		userAccountPubKey: user.userAccountPublicKey,
		marketIndex,
		slotBuffer,
		swiftOptions,
		orderParams: {
			main: orderParams,
			takeProfit: bracketOrders?.takeProfit,
			stopLoss: bracketOrders?.stopLoss,
			positionMaxLeverage,
		},
		builderParams,
	});
}

/**
 * Creates a placeAndTake transaction instruction.
 * Fallbacks to a regular market order if no top makers are found.
 */
export const createPlaceAndTakePerpMarketOrderIx = async ({
	assetType,
	direction,
	dlobServerHttpUrl,
	marketIndex,
	driftClient,
	user,
	userOrderId,
	amount,
	referrerInfo,
	auctionDurationPercentage,
	optionalAuctionParamsInputs,
	mainSignerOverride,
}: OpenPerpMarketOrderBaseParams & {
	direction: PositionDirection;
	dlobServerHttpUrl: string;
	marketIndex: number;
	driftClient: DriftClient;
	user: User;
	referrerInfo?: ReferrerInfo;
	auctionDurationPercentage?: number;
}) => {
	const counterPartySide = ENUM_UTILS.match(direction, PositionDirection.LONG)
		? 'ask'
		: 'bid';

	const [fetchedOrderParams, topMakersResult] = await Promise.all([
		fetchAuctionOrderParams({
			driftClient,
			user,
			assetType,
			marketIndex,
			marketType: MarketType.PERP,
			direction,
			amount,
			dlobServerHttpUrl,
			optionalAuctionParamsInputs,
		}),
		fetchTopMakers({
			dlobServerHttpUrl,
			marketIndex,
			marketType: MarketType.PERP,
			side: counterPartySide,
			limit: 4,
		}),
	]);

	const oraclePrice = driftClient.getOracleDataForPerpMarket(marketIndex).price;
	const totalQuoteAmount = amount.mul(oraclePrice).div(BASE_PRECISION);

	const bitFlags = ORDER_COMMON_UTILS.getPerpOrderParamsBitFlags(
		marketIndex,
		driftClient,
		user,
		totalQuoteAmount,
		direction
	);
	fetchedOrderParams.bitFlags = bitFlags;
	fetchedOrderParams.userOrderId = userOrderId;

	if (!topMakersResult || topMakersResult.length === 0) {
		throw new NoTopMakersError('No top makers found', fetchedOrderParams);
	}

	const topMakersInfo = topMakersResult.map((maker) => ({
		maker: maker.userAccountPubKey,
		makerUserAccount: maker.userAccount,
		makerStats: getUserStatsAccountPublicKey(
			driftClient.program.programId,
			maker.userAccount.authority
		),
	}));

	const placeAndTakeIx = await driftClient.getPlaceAndTakePerpOrderIx(
		fetchedOrderParams,
		topMakersInfo,
		referrerInfo,
		undefined,
		auctionDurationPercentage,
		user.getUserAccount().subAccountId,
		{
			authority: mainSignerOverride,
		}
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
 * @param positionMaxLeverage - Optional per-market leverage (e.g., 5 for 5x). If provided and different from current,
 *                               adds an instruction to update the position's maxMarginRatio before placing the order.
 *
 * @returns Promise resolving to an array of transaction instructions for regular orders
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
	userOrderId,
	optionalAuctionParamsInputs = {},
	positionMaxLeverage,
	mainSignerOverride,
}: OpenPerpMarketOrderBaseParams): Promise<TransactionInstruction[]> => {
	if (!amount || amount.isZero()) {
		throw new Error('Amount must be greater than zero');
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

	if (placeAndTake?.enable) {
		try {
			const placeAndTakeIx = await createPlaceAndTakePerpMarketOrderIx({
				assetType,
				amount,
				direction,
				dlobServerHttpUrl,
				marketIndex,
				driftClient,
				user,
				userOrderId,
				referrerInfo: placeAndTake.referrerInfo,
				auctionDurationPercentage: placeAndTake.auctionDurationPercentage,
				optionalAuctionParamsInputs,
				mainSignerOverride,
			});
			allIxs.push(placeAndTakeIx);
		} catch (e) {
			if (e instanceof NoTopMakersError) {
				// fallback to regular order
				allOrders.push(e.orderParams);
			} else {
				throw e;
			}
		}
	} else {
		const fetchedOrderParams = await fetchAuctionOrderParams({
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

		const oraclePrice =
			driftClient.getOracleDataForPerpMarket(marketIndex).price;
		const totalQuoteAmount = amount.mul(oraclePrice).div(BASE_PRECISION);

		const bitFlags = ORDER_COMMON_UTILS.getPerpOrderParamsBitFlags(
			marketIndex,
			driftClient,
			user,
			totalQuoteAmount,
			direction
		);

		const orderParams = {
			...fetchedOrderParams,
			userOrderId,
			bitFlags,
		};

		allOrders.push(orderParams);
	}

	const bracketOrdersDirection = ENUM_UTILS.match(
		direction,
		PositionDirection.LONG
	)
		? PositionDirection.SHORT
		: PositionDirection.LONG;

	if (bracketOrders?.takeProfit) {
		const takeProfitParams = buildNonMarketOrderParams({
			marketIndex,
			marketType: MarketType.PERP,
			direction: bracketOrdersDirection,
			baseAssetAmount: bracketOrders.takeProfit.baseAssetAmount ?? amount,
			orderConfig: {
				orderType: 'takeProfit',
				triggerPrice: bracketOrders.takeProfit.triggerPrice,
				limitPrice: bracketOrders.takeProfit.limitPrice,
			},
			reduceOnly: bracketOrders.takeProfit.reduceOnly ?? true,
		});
		allOrders.push(takeProfitParams);
	}

	if (bracketOrders?.stopLoss) {
		const stopLossParams = buildNonMarketOrderParams({
			marketIndex,
			marketType: MarketType.PERP,
			direction: bracketOrdersDirection,
			baseAssetAmount: bracketOrders.stopLoss.baseAssetAmount ?? amount,
			orderConfig: {
				orderType: 'stopLoss',
				triggerPrice: bracketOrders.stopLoss.triggerPrice,
				limitPrice: bracketOrders.stopLoss.limitPrice,
			},
			reduceOnly: bracketOrders.stopLoss.reduceOnly ?? true,
		});
		allOrders.push(stopLossParams);
	}

	// Regular order flow - create transaction instruction
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
 * @param positionMaxLeverage - Optional per-market leverage (e.g., 5 for 5x). If provided and different from current,
 *                              includes an instruction to update the position's maxMarginRatio.
 *
 * @returns Promise resolving to a built transaction ready for signing (Transaction or VersionedTransaction)
 */
export const createOpenPerpMarketOrderTxn = async (
	params: WithTxnParams<OpenPerpMarketOrderBaseParams>
): Promise<Transaction | VersionedTransaction> => {
	const { driftClient } = params;

	// Regular order flow - create transaction instruction and build transaction
	const placeOrderIxs = await createOpenPerpMarketOrderIxs(params);
	const openPerpMarketOrderTxn = await driftClient.txHandler.buildTransaction({
		instructions: placeOrderIxs,
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
 * @param userOrderId - The user order id for UI identification
 * @param positionMaxLeverage - Optional per-market leverage (e.g., 5 for 5x). Only supported for regular transactions (not Swift).
 *
 * @returns Promise resolving to a built transaction ready for signing (Transaction or VersionedTransaction)
 */
export const createOpenPerpMarketOrder = async <T extends boolean>(
	params: WithTxnParams<OpenPerpMarketOrderParams<T, SwiftOrderOptions>>
): Promise<TxnOrSwiftResult<T>> => {
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

		return swiftOrderResult as TxnOrSwiftResult<T>;
	}

	const openPerpMarketOrderTxn = await createOpenPerpMarketOrderTxn(rest);

	return openPerpMarketOrderTxn as TxnOrSwiftResult<T>;
};
