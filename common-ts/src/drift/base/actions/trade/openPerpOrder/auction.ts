import {
	PostOnlyParams,
	MarketType,
	BN,
	OptionalOrderParams,
	BigNum,
	PRICE_PRECISION_EXP,
	getLimitOrderParams,
	oraclePriceBands as getOraclePriceBands,
	DriftClient,
	User,
	PositionDirection,
} from '@drift-labs/sdk';
import {
	ORDER_COMMON_UTILS,
	COMMON_UI_UTILS,
	HighLeverageOptions,
} from '../../../../../common-ui-utils';
import { DEFAULT_LIMIT_AUCTION_DURATION } from '../../../constants/auction';
import { ENUM_UTILS } from '../../../../../utils';
import invariant from 'tiny-invariant';
import { fetchAuctionOrderParams } from './dlobServer';
import { LimitOrderParamsOrderConfig, LimitAuctionConfig } from './types';
import { AuctionParamsFetchedCallback } from '../../../../utils/auctionParamsResponseMapper';

export const getLimitAuctionOrderParams = async ({
	driftClient,
	user,
	marketIndex,
	marketType,
	direction,
	baseAssetAmount,
	positionMaxLeverage,
	userOrderId = 0,
	reduceOnly = false,
	postOnly = PostOnlyParams.NONE,
	orderConfig,
	highLeverageOptions,
	onAuctionParamsFetched,
}: {
	driftClient: DriftClient;
	user: User;
	marketIndex: number;
	marketType: MarketType;
	direction: PositionDirection;
	baseAssetAmount: BN;
	positionMaxLeverage: number;
	userOrderId?: number;
	reduceOnly?: boolean;
	postOnly?: PostOnlyParams;
	orderConfig: LimitOrderParamsOrderConfig & {
		limitAuction: LimitAuctionConfig;
	};
	highLeverageOptions?: HighLeverageOptions;
	onAuctionParamsFetched?: AuctionParamsFetchedCallback;
}): Promise<OptionalOrderParams> => {
	const orderParams = await fetchAuctionOrderParams({
		driftClient,
		user,
		assetType: 'base',
		marketIndex,
		marketType,
		direction,
		amount: baseAssetAmount,
		reduceOnly,
		dlobServerHttpUrl: orderConfig.limitAuction.dlobServerHttpUrl,
		optionalAuctionParamsInputs:
			orderConfig.limitAuction.optionalLimitAuctionParams,
		onAuctionParamsFetched: onAuctionParamsFetched,
	});

	const isPerp = ENUM_UTILS.match(marketType, MarketType.PERP);

	invariant(orderConfig.limitAuction.oraclePrice, 'Oracle price not found');
	invariant(orderParams.auctionStartPrice, 'Auction start price not found');

	let oraclePriceBands: [BN, BN] | undefined = undefined;
	let auctionDuration = DEFAULT_LIMIT_AUCTION_DURATION;

	if (isPerp) {
		const perpMarketAccount = driftClient.getPerpMarketAccount(marketIndex);
		invariant(isPerp && perpMarketAccount, 'Perp market account not found');

		oraclePriceBands = orderConfig.limitAuction.oraclePrice
			? getOraclePriceBands(perpMarketAccount, {
					price: orderConfig.limitAuction.oraclePrice,
			  })
			: undefined;

		auctionDuration = ORDER_COMMON_UTILS.getPerpAuctionDuration(
			orderConfig.limitPrice.sub(orderParams.auctionStartPrice).abs(),
			orderConfig.limitAuction.oraclePrice,
			perpMarketAccount.contractTier
		);
	}

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
		marketType,
		direction,
		baseAssetAmount,
		reduceOnly,
		postOnly,
		price: orderConfig.limitPrice,
		userOrderId,
		...limitAuctionParams,
	});

	const bitFlags = ORDER_COMMON_UTILS.getPerpOrderParamsBitFlags(
		marketIndex,
		driftClient,
		user,
		positionMaxLeverage,
		highLeverageOptions
	);

	return {
		...limitAuctionOrderParams,
		bitFlags,
	};
};
