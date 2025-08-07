import { PublicKey } from '@solana/web3.js';
import { BigNum, BN, SpotBalanceType } from '@drift-labs/sdk';
import {
	SerializableUserSnapshotRecord,
	UISerializableUserSnapshotRecord,
} from 'src/serializableTypes';

export type RollingPnlData = {
	totalPnlQuote: BN;
	totalPnlPct: BN;
	spotPnlQuote: BN;
	spotPnlPct: BN;
	perpPnlQuote: BN;
	perpPnlPct: BN;
};

export type PnlSnapshotOrderOption = keyof Pick<
	RollingPnlData,
	'totalPnlPct' | 'totalPnlQuote'
>;

export type LeaderBoardResultRow = {
	user: PublicKey;
	authority: PublicKey;
	subaccountId: number;
	resolution: SnapshotEpochResolution;
	rollingValue: number;
	pnlHistoryPoints: PnlHistoryDataPoint[];
};

export type LeaderboardResult = {
	lastUpdateTs: number;
	results: LeaderBoardResultRow[];
	ordering: PnlSnapshotOrderOption;
};

export type UserSnapshotRecord = {
	programId: PublicKey;
	authority: PublicKey;
	user: PublicKey;
	epochTs: number;
	ts: number;
	perpPositionUpnl: BN;

	totalAccountValue: BN;
	cumulativeDepositQuoteValue: BN;
	cumulativeWithdrawalQuoteValue: BN;
	cumulativeSettledPerpPnl: BN;
	cumulativeReferralReward: BN;
	cumulativeReferralVolume: BN;
	cumulativeReferralCount: number;
};

export type UIAccountSnapshot = Pick<
	UserSnapshotRecord,
	'authority' | 'user' | 'epochTs'
> &
	Pick<
		UISerializableUserSnapshotRecord,
		| 'cumulativeDepositQuoteValue'
		| 'cumulativeWithdrawalQuoteValue'
		| 'totalAccountValue'
		| 'cumulativeReferralReward'
		| 'cumulativeReferralVolume'
		| 'cumulativeReferralCount'
	> & {
		allTimeTotalPnl: BigNum;
		allTimeTotalPnlPct: BigNum;
	};

export type AccountSnapshot = Pick<
	UserSnapshotRecord,
	'authority' | 'user' | 'epochTs'
> &
	Pick<
		SerializableUserSnapshotRecord,
		| 'cumulativeDepositQuoteValue'
		| 'cumulativeWithdrawalQuoteValue'
		| 'totalAccountValue'
		| 'cumulativeReferralReward'
		| 'cumulativeReferralVolume'
		| 'cumulativeReferralCount'
	> & {
		allTimeTotalPnl: BN;
		allTimeTotalPnlPct: BN;
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

export type PnlHistoryDataPoint = {
	val: number;
	ts: number;
};

export class SnapshotEpochResolution {
	static readonly HOURLY = { hourly: {} };
	static readonly DAILY = { daily: {} };
	static readonly WEEKLY = { weekly: {} };
	static readonly MONTHLY = { monthly: {} };
}
