import { MarketType } from '@drift-labs/sdk';
import {
	UISerializableAccountSnapshot,
	UISerializableAllTimePnlData,
} from 'src/serializableTypes';

export type MarketDetails24H = {
	marketType: MarketType;
	marketIndex: number;
	symbol: string;
	baseVolume: number;
	quoteVolume: number;
	baseVolume30D: number;
	quoteVolume30D: number;
	price24hAgo: number;
	pricePercentChange: number;
	priceHigh: number;
	priceLow: number;
	avgFunding?: number;
	avgLongFunding?: number;
	avgShortFunding?: number;
	marketCap: number;
	dailyVolumeIncreaseZScore: number;
};

export enum HistoryResolution {
	DAY = 'DAY',
	WEEK = 'WEEK',
	MONTH = 'MONTH',
	ALL = 'ALL',
}

export type UISnapshotHistory = {
	[HistoryResolution.DAY]: UISerializableAccountSnapshot[];
	[HistoryResolution.WEEK]: UISerializableAccountSnapshot[];
	[HistoryResolution.MONTH]: UISerializableAccountSnapshot[];
	[HistoryResolution.ALL]: UISerializableAccountSnapshot[];
	dailyAllTimePnls: UISerializableAllTimePnlData[];
};

export type MarketMakerRewardRecord = {
	ts: number;
	amount: number;
	symbol: string;
};
