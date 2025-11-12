import {
	BN,
	MarketType,
	PositionDirection,
	PostOnlyParams,
	ReferrerInfo,
} from '@drift-labs/sdk';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { OptionalAuctionParamsRequestInputs } from './dlobServer';

export type TxnOrSwiftResult<T extends boolean> = T extends true
	? void
	: Transaction | VersionedTransaction;

export type PlaceAndTakeParams =
	| {
			enable: false;
	  }
	| {
			enable: true;
			auctionDurationPercentage?: number;
			referrerInfo: ReferrerInfo | undefined;
	  };

export type NonMarketOrderType =
	| 'limit'
	| 'takeProfit'
	| 'stopLoss'
	| 'oracleLimit';

export interface LimitAuctionConfig {
	enable: boolean;
	dlobServerHttpUrl: string;
	auctionStartPriceOffset: number;
	oraclePrice?: BN; // used to calculate oracle price bands
	optionalLimitAuctionParams?: OptionalAuctionParamsRequestInputs;
	usePlaceAndTake?: {
		enable: boolean;
		referrerInfo?: ReferrerInfo; // needed for place and take fallback
		auctionDurationPercentage?: number;
	};
}

export interface OptionalTriggerOrderParams {
	baseAssetAmount?: BN;
	triggerPrice: BN;
	limitPrice?: BN;
	reduceOnly?: boolean;
}

export interface LimitOrderParamsOrderConfig {
	orderType: Extract<NonMarketOrderType, 'limit'>;
	limitPrice: BN;
	bracketOrders?: {
		takeProfit?: OptionalTriggerOrderParams;
		stopLoss?: OptionalTriggerOrderParams;
	};
	/**
	 * Limit orders can have an optional auction that allows it to go through the auction process.
	 * Usually, the auction params are set up to the limit price, to allow for a possible improved
	 * fill price. This is useful for when a limit order is crossing the orderbook.
	 */
	limitAuction?: LimitAuctionConfig;
}

export interface NonMarketOrderParamsConfig {
	marketIndex: number;
	marketType: MarketType;
	direction: PositionDirection;
	baseAssetAmount: BN;
	reduceOnly?: boolean;
	postOnly?: PostOnlyParams;
	userOrderId?: number;
	/**
	 * The leverage to be used for this position.
	 * If different from current position's leverage, will add an instruction
	 * to update the position's maxMarginRatio before placing the order.
	 * Example: 5 for 5x leverage, 10 for 10x leverage
	 */
	positionMaxLeverage: number;
	orderConfig:
		| LimitOrderParamsOrderConfig
		| {
				orderType: Extract<NonMarketOrderType, 'takeProfit' | 'stopLoss'>;
				triggerPrice: BN;
				limitPrice?: BN;
		  }
		| {
				orderType: Extract<NonMarketOrderType, 'oracleLimit'>;
				oraclePriceOffset: BN;
		  };
}
