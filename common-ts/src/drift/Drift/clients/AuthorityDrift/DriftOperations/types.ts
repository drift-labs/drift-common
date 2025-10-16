import {
	BigNum,
	PositionDirection,
	PostOnlyParams,
	PublicKey,
	QuoteResponse,
} from '@drift-labs/sdk';
import { OptionalAuctionParamsRequestInputs } from '../../../../base/actions/trade/openPerpOrder/dlobServer';
import { SwiftOrderOptions } from '../../../../base/actions/trade/openPerpOrder/openSwiftOrder';

/**
 * Interface for deposit operation parameters.
 */
export interface DepositParams {
	subAccountId: number;
	amount: BigNum;
	spotMarketIndex: number;
	isMaxBorrowRepayment?: boolean;
}

/**
 * Interface for withdraw operation parameters.
 */
export interface WithdrawParams {
	subAccountId: number;
	amount: BigNum;
	spotMarketIndex: number;
	isBorrow?: boolean;
	isMax?: boolean;
}

/**
 * Interface for create user and deposit operation parameters.
 */
export interface CreateUserAndDepositParams {
	depositAmount: BigNum;
	depositSpotMarketIndex: number;
	newAccountName?: string;
	maxLeverage?: number;
	poolId?: number;
	subAccountId?: number;
	referrerName?: string;
}

export interface CreateRevenueShareEscrowParams {
	numOrders?: number;
	builder?: {
		builderAuthority: PublicKey;
		maxFeeTenthBps: number;
	};
}

/**
 * Interface for perp market order parameters.
 */
export type PerpOrderParams = {
	subAccountId: number;
	marketIndex: number;
	direction: PositionDirection;
	assetType: 'base' | 'quote';
	size: BigNum;
	reduceOnly?: boolean;
	postOnly?: PostOnlyParams;
	isMaxLeverage?: boolean;
	/**
	 * Optional builder code parameters for revenue sharing.
	 * Only applicable for Swift orders for now (market and limit orders with Swift enabled).
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
	orderConfig:
		| {
				orderType: 'market';
				disableSwift?: boolean;
				optionalAuctionParamsInputs?: OptionalAuctionParamsRequestInputs;
				postOnly?: never;
				bracketOrders?: {
					takeProfitPrice?: BigNum;
					stopLossPrice?: BigNum;
				};
				swiftOptions?: Omit<SwiftOrderOptions, 'wallet' | 'swiftServerUrl'>;
		  }
		| {
				orderType: 'limit';
				limitPrice: BigNum;
				disableSwift?: boolean;
				bracketOrders?: {
					takeProfitPrice?: BigNum;
					stopLossPrice?: BigNum;
				};
				swiftOptions?: Omit<SwiftOrderOptions, 'wallet' | 'swiftServerUrl'>;
		  }
		| {
				orderType: 'takeProfit' | 'stopLoss';
				triggerPrice: BigNum;
				limitPrice?: BigNum;
		  }
		| {
				orderType: 'oracleLimit';
				oraclePriceOffset: BigNum;
		  };
};

/**
 * Interface for swap operation parameters.
 */
export interface SwapParams {
	fromMarketIndex: number;
	toMarketIndex: number;
	amount: BigNum;
	subAccountId: number;
	jupiterQuote?: QuoteResponse;
}

/**
 * Interface for settle account P&Ls.
 */
export interface SettleAccountPnlParams {
	subAccountId: number;
}

export interface CancelOrdersParams {
	subAccountId: number;
	orderIds: number[];
}
