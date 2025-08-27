import { BigNum, PositionDirection, QuoteResponse } from '@drift-labs/sdk';
import { AuctionParamsRequestOptions } from '../../../../base/actions/trade/openPerpOrder/openPerpMarketOrder';

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
	postOnly?: boolean;
	orderConfig:
		| {
				orderType: 'market';
				disableSwift?: boolean;
				auctionParamsOptions?: AuctionParamsRequestOptions;
				postOnly?: never;
				// TODO: isMaxLeverage?
				// TODO: accompanying tp/sl orders
		  }
		| {
				orderType: 'limit';
				limitPrice: BigNum;
				disableSwift?: boolean;
				// TODO: isMaxLeverage?
				// TODO: accompanying tp/sl orders
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
