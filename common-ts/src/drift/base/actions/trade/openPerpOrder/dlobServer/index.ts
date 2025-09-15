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
} from '@drift-labs/sdk';
import { ENUM_UTILS } from '../../../../../../utils';
import {
	mapAuctionParamsResponse,
	ServerAuctionParamsResponse,
	MappedAuctionParams,
} from '../../../../../utils/auctionParamsResponseMapper';
import { encodeQueryParams } from '../../../../../../utils/fetch';

export interface OptionalAuctionParamsRequestInputs {
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

interface RegularOrderParams {
	driftClient: DriftClient;
	user: User;
	assetType: 'base' | 'quote';
	marketType?: MarketType;
	marketIndex: number;
	direction: PositionDirection;
	amount: BN;
	optionalAuctionParamsInputs?: OptionalAuctionParamsRequestInputs;
	dlobServerHttpUrl: string;
}

// TODO: fallback method in case auction params endpoint is down

/**
 * Fetches order parameters from the auction params server
 */
export async function fetchOrderParamsFromServer({
	assetType,
	marketIndex,
	marketType = MarketType.PERP,
	direction,
	amount,
	dlobServerHttpUrl,
	optionalAuctionParamsInputs = {},
}: RegularOrderParams): Promise<OptionalOrderParams> {
	// Build URL parameters for server request
	const urlParamsObject: Record<string, string> = {
		// Required fields
		assetType,
		marketType: ENUM_UTILS.toStr(marketType),
		marketIndex: marketIndex.toString(),
		direction: ENUM_UTILS.toStr(direction),
		amount: amount.toString(),
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

type FetchTopMakersParams = {
	dlobServerHttpUrl: string;
	marketIndex: number;
	marketType: MarketType;
	side: 'bid' | 'ask';
	limit: number;
};

/**
 * Fetches the top makers information, for use as inputs in place and take market orders.
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
