import { BigNum } from '@drift-labs/sdk';

export type HistoricalPrice = {
	ms: number;
	price: number;
	swapInfo?: {
		inMarketSymbol: string;
		outMarketSymbol: string;
		amountIn: BigNum;
		amountOut: BigNum;
	};
};

export enum HistoricalTokenPriceDuration {
	ONE_DAY = '1',
	ONE_WEEK = '7',
	ONE_MONTH = '30',
}
