import { BN, L2OrderBook, MarketType } from '@drift-labs/sdk';
import { MarketId } from '@drift/common';

export type L2WithOracle = L2OrderBook & { oraclePrice: BN };

export enum DlobTrackingType {
	OrderbookDisplay = 'OrderbookDisplay',
	DeepPriceData = 'DeepPriceData',
	ShallowPriceData = 'ShallowPriceData',
}

export type MarketDlobLiquidityCategorisation = {
	[DlobTrackingType.OrderbookDisplay]: MarketId;
	[DlobTrackingType.DeepPriceData]: MarketId[];
	[DlobTrackingType.ShallowPriceData]: MarketId[];
};

export type RawL2Output = {
	marketIndex: number;
	marketType: MarketType;
	marketName: string;
	asks: {
		price: string;
		size: string;
		sources: {
			[key: string]: string;
		};
	}[];
	bids: {
		price: string;
		size: string;
		sources: {
			[key: string]: string;
		};
	}[];
	oracle: string;
	slot?: number;
};

export type GroupingSizeSelectionState = {
	options: number[];
	selectionIndex: number;
	updateSelectionIndex: (newVal: number | string) => void;
};
