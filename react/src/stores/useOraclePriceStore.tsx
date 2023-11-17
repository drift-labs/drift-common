import { produce } from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MarketId, UIMarket } from '@drift/common';
import { OraclePriceData } from '@drift-labs/sdk';

export type FormattedOraclePriceData = {
	price: number;
	slot: number;
	confidence: number;
	twap?: number;
	twapConfidence?: number;
};

export type OraclePriceInfo = {
	market: UIMarket;
	priceData: FormattedOraclePriceData;
	rawPriceData: OraclePriceData;
};

export interface OraclePriceStore {
	set: (x: (s: OraclePriceStore) => void) => void;
	get: (x: any) => OraclePriceStore;
	getMarketPriceData: (market: MarketId) => OraclePriceInfo;
	symbolMap: {
		[index: string]: OraclePriceInfo;
	};
}

export const useOraclePriceStore = create(
	devtools<OraclePriceStore>((set, get) => ({
		set: (fn) => set(produce(fn)),
		get: () => get(),
		getMarketPriceData: (market: MarketId) => get().symbolMap[market.key()],
		symbolMap: {},
	}))
);
