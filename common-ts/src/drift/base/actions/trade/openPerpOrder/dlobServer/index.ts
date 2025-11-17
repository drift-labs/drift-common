import {
	DriftClient,
	User,
	BN,
	PositionDirection,
	OptionalOrderParams,
	MarketType,
	UserAccount,
	PublicKey,
	decodeUser,
	DefaultOrderParams,
	BASE_PRECISION,
	TEN,
} from '@drift-labs/sdk';
import { ENUM_UTILS } from '../../../../../../utils';
import {
	mapAuctionParamsResponse,
	ServerAuctionParamsResponse,
	MappedAuctionParams,
	AuctionParamsFetchedCallback,
} from '../../../../../utils/auctionParamsResponseMapper';
import { encodeQueryParams } from '../../../../../../utils/fetch';
import { MarketId, TradeOffsetPrice } from '../../../../../../types';
import {
	convertToL2OrderBook,
	deserializeL2Response,
	calculateDynamicSlippageFromL2,
	DynamicSlippageConfig,
} from '../../../../../../utils/orderbook';
import {
	L2WithOracleAndMarketData,
	RawL2Output,
} from '../../../../../../utils/orderbook/types';
import { PollingSequenceGuard } from '../../../../../../utils/pollingSequenceGuard';
import { calculatePriceImpactFromL2 } from '../../../../../../utils/priceImpact';
import { COMMON_UI_UTILS } from '../../../../../../common-ui-utils';
import invariant from 'tiny-invariant';

export interface OptionalAuctionParamsRequestInputs {
	// Optional parameters that can override defaults or provide additional configuration
	maxLeverageSelected?: boolean;
	maxLeverageOrderSize?: BN;
	reduceOnly?: boolean;
	auctionDuration?: number;
	auctionStartPriceOffset?: number;
	auctionEndPriceOffset?: number;
	auctionStartPriceOffsetFrom?: TradeOffsetPrice;
	auctionEndPriceOffsetFrom?: TradeOffsetPrice;
	slippageTolerance?: number | 'dynamic';
	isOracleOrder?: boolean;
	additionalEndPriceBuffer?: BN;
	forceUpToSlippage?: boolean;
}

interface RegularOrderParams {
	driftClient: DriftClient;
	user: User;
	assetType: 'base' | 'quote';
	marketType: MarketType;
	marketIndex: number;
	direction: PositionDirection;
	amount: BN;
	optionalAuctionParamsInputs?: OptionalAuctionParamsRequestInputs;
	dlobServerHttpUrl: string;
	dynamicSlippageConfig?: DynamicSlippageConfig;
	onAuctionParamsFetched?: AuctionParamsFetchedCallback;
}

export interface BulkL2FetchingQueryParams {
	marketIndex: number;
	marketType: string;
	depth: number;
	includeVamm: boolean;
	includePhoenix: boolean;
	includeOpenbook: boolean;
	includeSerum: boolean;
	includeOracle: boolean;
	includeIndicative: boolean;
}

export interface BulkL2FetchingParams {
	markets: BulkL2FetchingQueryParams[];
	grouping?: number;
}

const BACKGROUND_L2_POLLING_KEY = Symbol('BACKGROUND_L2_POLLING_KEY');

/**
 * Fetches the L2 data for the given markets and their depth
 */
export function fetchBulkMarketsDlobL2Data(
	dlobServerHttpUrl: string,
	markets: {
		marketId: MarketId;
		depth: number;
	}[],
	groupingSize?: number,
	excludeIndicativeLiquidity = false
): Promise<L2WithOracleAndMarketData[]> {
	const params: BulkL2FetchingParams = {
		markets: markets.map((m) => ({
			marketIndex: m.marketId.marketIndex,
			marketType: m.marketId.marketTypeStr,
			depth: m.depth,
			includeVamm: m.marketId.isPerp,
			includePhoenix: m.marketId.isSpot,
			includeSerum: m.marketId.isSpot,
			includeOpenbook: m.marketId.isSpot,
			includeOracle: true,
			includeIndicative: !excludeIndicativeLiquidity,
		})),
		grouping: groupingSize,
	};

	const queryParamsMap: {
		[K in keyof BulkL2FetchingQueryParams]: string;
	} & {
		grouping?: string;
	} = {
		marketType: params.markets.map((market) => market.marketType).join(','),
		marketIndex: params.markets.map((market) => market.marketIndex).join(','),
		depth: params.markets.map((market) => market.depth).join(','),
		includeVamm: params.markets.map((market) => market.includeVamm).join(','),
		includePhoenix: params.markets
			.map((market) => market.includePhoenix)
			.join(','),
		includeOpenbook: params.markets
			.map((market) => market.includeOpenbook)
			.join(','),
		includeSerum: params.markets.map((market) => market.includeSerum).join(','),
		grouping: params.grouping
			? params.markets.map(() => params.grouping).join(',')
			: undefined,
		includeOracle: params.markets
			.map((market) => market.includeOracle)
			.join(','),
		includeIndicative: params.markets
			.map((market) => market.includeIndicative)
			.join(','),
	};

	const queryParams = encodeQueryParams(queryParamsMap);

	// Use cached endpoint when exclusively fetching background markets
	const useCachedEndpoint = !params.markets.some(
		(market) => market.depth !== 1
	);

	const endpoint = useCachedEndpoint
		? `${dlobServerHttpUrl}/batchL2Cache`
		: `${dlobServerHttpUrl}/batchL2`;

	return new Promise<L2WithOracleAndMarketData[]>((resolve, reject) => {
		PollingSequenceGuard.fetch(BACKGROUND_L2_POLLING_KEY, () => {
			return fetch(`${endpoint}?${queryParams}`);
		})
			.then(async (response) => {
				const responseData = await response.json();
				const resultsArray = responseData.l2s as RawL2Output[];
				const deserializedL2 = resultsArray.map(deserializeL2Response);
				resolve(deserializedL2);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

export async function fetchAuctionOrderParams(params: RegularOrderParams) {
	try {
		return await fetchAuctionOrderParamsFromDlob(params);
	} catch (error) {
		console.error(error);
		console.log('Falling back to L2 data');
		return await fetchAuctionOrderParamsFromL2(params);
	}
}

const calcBaseFromQuote = (
	driftClient: DriftClient,
	marketType: MarketType,
	marketIndex: number,
	amount: BN
) => {
	const isPerp = ENUM_UTILS.match(marketType, MarketType.PERP);

	const oraclePrice = isPerp
		? driftClient.getOracleDataForPerpMarket(marketIndex).price
		: driftClient.getOracleDataForSpotMarket(marketIndex).price;

	if (isPerp) {
		return amount.mul(BASE_PRECISION).div(oraclePrice);
	} else {
		const spotMarketAccount = driftClient.getSpotMarketAccount(marketIndex);
		invariant(spotMarketAccount, 'Spot market account not found');
		const precision = TEN.pow(new BN(spotMarketAccount.decimals));
		return amount.mul(precision).div(oraclePrice);
	}
};

/**
 * Fetches auction order parameters from the auction params endpoint
 */
export async function fetchAuctionOrderParamsFromDlob({
	marketIndex,
	marketType,
	direction,
	amount,
	dlobServerHttpUrl,
	assetType,
	driftClient,
	optionalAuctionParamsInputs = {},
}: RegularOrderParams): Promise<OptionalOrderParams> {
	const baseAmount =
		assetType === 'base'
			? amount
			: calcBaseFromQuote(driftClient, marketType, marketIndex, amount);

	// Build URL parameters for server request
	const urlParamsObject: Record<string, string> = {
		// Required fields
		assetType: 'base',
		marketType: ENUM_UTILS.toStr(marketType),
		marketIndex: marketIndex.toString(),
		direction: ENUM_UTILS.toStr(direction),
		amount: baseAmount.toString(),
	};

	// Add defined optional parameters
	Object.entries(optionalAuctionParamsInputs).forEach(([key, value]) => {
		if (value !== undefined) {
			urlParamsObject[key] = value.toString();
		}
	});

	const urlParams = encodeQueryParams(urlParamsObject);

	// Get order params from server
	const requestUrl = `${dlobServerHttpUrl}/auctionParams?${urlParams.toString()}`;
	const response = await fetch(requestUrl);

	if (!response.ok) {
		throw new Error(
			`Server responded with ${response.status}: ${response.statusText}`
		);
	}

	const serverResponse: ServerAuctionParamsResponse = await response.json();
	const serverAuctionParams = serverResponse?.data?.params;
	invariant(serverAuctionParams, 'Server auction params are required');
	const mappedParams: MappedAuctionParams =
		mapAuctionParamsResponse(serverAuctionParams);

	// Convert MappedAuctionParams to OptionalOrderParams
	return {
		orderType: mappedParams.orderType,
		marketType: mappedParams.marketType,
		userOrderId: mappedParams.userOrderId,
		direction: mappedParams.direction,
		baseAssetAmount: mappedParams.baseAssetAmount,
		marketIndex: mappedParams.marketIndex,
		reduceOnly: mappedParams.reduceOnly,
		postOnly: mappedParams.postOnly ?? DefaultOrderParams.postOnly,
		triggerPrice: mappedParams.triggerPrice || null,
		triggerCondition:
			mappedParams.triggerCondition ?? DefaultOrderParams.triggerCondition,
		oraclePriceOffset: mappedParams.oraclePriceOffset || null,
		auctionDuration: mappedParams.auctionDuration || null,
		maxTs: mappedParams.maxTs,
		auctionStartPrice: mappedParams.auctionStartPrice || null,
		auctionEndPrice: mappedParams.auctionEndPrice || null,
		// no price, because market orders don't need a price
	};
}

const DEFAULT_L2_DEPTH_FOR_AUCTION_ORDER_PARAMS = 100;

/**
 * Fetches auction order parameters from the L2 data
 */
export async function fetchAuctionOrderParamsFromL2({
	dlobServerHttpUrl,
	marketIndex,
	marketType,
	direction,
	assetType,
	amount,
	optionalAuctionParamsInputs,
	driftClient,
	dynamicSlippageConfig,
}: RegularOrderParams): Promise<OptionalOrderParams> {
	const marketId = new MarketId(marketIndex, marketType);
	const baseAmount =
		assetType === 'base'
			? amount
			: calcBaseFromQuote(driftClient, marketType, marketIndex, amount);

	const l2DataResponse = await fetchBulkMarketsDlobL2Data(dlobServerHttpUrl, [
		{
			marketId,
			depth: DEFAULT_L2_DEPTH_FOR_AUCTION_ORDER_PARAMS,
		},
	]);
	const oraclePriceData = l2DataResponse[0].oracleData;
	const oraclePriceBn = oraclePriceData?.price;
	const markPriceBn = l2DataResponse[0].markPrice;
	const l2Data = convertToL2OrderBook(l2DataResponse);

	const priceImpactData = calculatePriceImpactFromL2(
		marketId,
		direction,
		baseAmount,
		l2Data,
		oraclePriceBn
	);

	const startPrices = COMMON_UI_UTILS.getPriceObject({
		oraclePrice: oraclePriceBn,
		bestOffer: priceImpactData.bestPrice,
		entryPrice: priceImpactData.entryPrice,
		worstPrice: priceImpactData.worstPrice,
		markPrice: markPriceBn,
		direction: direction,
	});
	const slippageToleranceInput = optionalAuctionParamsInputs.slippageTolerance;
	const derivedSlippage =
		slippageToleranceInput === 'dynamic'
			? calculateDynamicSlippageFromL2({
					l2Data,
					marketId,
					startPrice:
						startPrices[
							optionalAuctionParamsInputs.auctionStartPriceOffsetFrom as keyof typeof startPrices
						],
					worstPrice: priceImpactData.worstPrice,
					oraclePrice: oraclePriceBn,
					dynamicSlippageConfig,
			  })
			: typeof slippageToleranceInput === 'number'
			? slippageToleranceInput
			: 0.005;

	const auctionOrderParams = COMMON_UI_UTILS.deriveMarketOrderParams({
		marketType: marketType,
		marketIndex: marketIndex,
		direction: direction,
		maxLeverageSelected: optionalAuctionParamsInputs.maxLeverageSelected,
		maxLeverageOrderSize: optionalAuctionParamsInputs.maxLeverageOrderSize,
		baseAmount: baseAmount,
		reduceOnly: optionalAuctionParamsInputs.reduceOnly,
		allowInfSlippage: false,
		oraclePrice: oraclePriceBn,
		bestPrice: priceImpactData.bestPrice,
		entryPrice: priceImpactData.entryPrice,
		worstPrice: priceImpactData.worstPrice,
		markPrice: markPriceBn,
		auctionDuration: optionalAuctionParamsInputs.auctionDuration,
		auctionStartPriceOffset:
			optionalAuctionParamsInputs.auctionStartPriceOffset,
		auctionEndPriceOffset: optionalAuctionParamsInputs.auctionEndPriceOffset,
		auctionStartPriceOffsetFrom:
			optionalAuctionParamsInputs.auctionStartPriceOffsetFrom,
		auctionEndPriceOffsetFrom:
			optionalAuctionParamsInputs.auctionEndPriceOffsetFrom,
		slippageTolerance: derivedSlippage,
		isOracleOrder: optionalAuctionParamsInputs.isOracleOrder,
		additionalEndPriceBuffer:
			optionalAuctionParamsInputs.additionalEndPriceBuffer,
		forceUpToSlippage: optionalAuctionParamsInputs.forceUpToSlippage,
	});

	if (!auctionOrderParams) {
		throw new Error('Failed to derive auction params from L2');
	}

	return auctionOrderParams;
}

type FetchTopMakersParams = {
	dlobServerHttpUrl: string;
	marketIndex: number;
	marketType: MarketType;
	side: 'bid' | 'ask';
	limit: number;
};

/**
 * Fetches the top makers information, for use as inputs in placeAndTake market orders.
 * The side of the request should be opposite of the side of the placeAndTake market order.
 */
export async function fetchTopMakers(params: FetchTopMakersParams): Promise<
	{
		userAccountPubKey: PublicKey;
		userAccount: UserAccount;
	}[]
> {
	try {
		const { dlobServerHttpUrl, marketIndex, marketType, side, limit } = params;

		const urlParams = encodeQueryParams({
			marketIndex: marketIndex.toString(),
			marketType: ENUM_UTILS.toStr(marketType),
			side,
			limit: limit.toString(),
			includeAccounts: 'true',
		});

		const requestUrl = `${dlobServerHttpUrl}/topMakers?${urlParams}`;
		const response = await fetch(requestUrl);

		if (!response.ok) {
			throw new Error(
				`Server responded with ${response.status}: ${response.statusText}`
			);
		}

		const serverResponse: {
			userAccountPubKey: string;
			accountBase64: string;
		}[] = await response.json();
		const mappedParams: {
			userAccountPubKey: PublicKey;
			userAccount: UserAccount;
		}[] = serverResponse.map((value) => ({
			userAccountPubKey: new PublicKey(value.userAccountPubKey),
			userAccount: decodeUser(Buffer.from(value.accountBase64, 'base64')),
		}));

		return mappedParams;
	} catch (e) {
		console.error(e);
		return [];
	}
}
