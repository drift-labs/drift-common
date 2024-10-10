import { PublicKey } from '@drift-labs/sdk';
import {
	PnlHistoryDataPoint,
	PnlSnapshotOrderOption,
	SnapshotEpochResolution,
} from './history-server';

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
