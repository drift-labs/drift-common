import { BN, SpotBalanceType } from '@drift-labs/sdk';

export class SnapshotEpochResolution {
	static readonly HOURLY = { hourly: {} };
	static readonly DAILY = { daily: {} };
	static readonly WEEKLY = { weekly: {} };
	static readonly MONTHLY = { monthly: {} };
}

export type RollingPnlData = {
	totalPnlQuote: BN;
	totalPnlPct: BN;
	spotPnlQuote: BN;
	spotPnlPct: BN;
	perpPnlQuote: BN;
	perpPnlPct: BN;
};

export type UserPerpPositionSnapshot = {
	lpShares: BN;
	quoteAssetAmount: BN;
	baseAssetAmount: BN;
	marketIndex: number;
};

export type UserSpotPositionSnapshot = {
	tokenValue: BN;
	tokenAmount: BN;
	cumulativeDeposits: BN;
	balanceInterestDelta: BN;
	marketIndex: number;
	type: SpotBalanceType;
};

export type PnlSnapshotOrderOption = keyof Pick<
	RollingPnlData,
	'totalPnlPct' | 'totalPnlQuote'
>;

export type PnlHistoryDataPoint = {
	val: number;
	ts: number;
};
