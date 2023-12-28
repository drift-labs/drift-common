import { DriftEnv } from '@drift-labs/sdk';
import { ENUM_UTILS } from '.';
import { Serializer } from '../serializableTypes';
import { PnlSnapshotOrderOption, SnapshotEpochResolution } from '../types';

export type DownloadRecordType =
	| 'trades'
	| 'market-trades'
	| 'funding-rates'
	| 'funding-payments'
	| 'deposits'
	| 'liquidations'
	| 'candles'
	| 'settle-pnl-records'
	| 'lp-records'
	| 'if-stake-records';

const getLeaderboardFilename = (
	orderBy: PnlSnapshotOrderOption,
	resolution: SnapshotEpochResolution
) => `${orderBy}_${ENUM_UTILS.toStr(resolution)}_leaderboard.json`;

export const S3_LEADERBOARD_CLIENT = {
	getFileName: (
		orderBy: PnlSnapshotOrderOption,
		resolution: SnapshotEpochResolution
	) => {
		return getLeaderboardFilename(orderBy, resolution);
	},
	getLeaderboardValue: async (
		env: DriftEnv,
		leaderboardBucketName: string,
		orderBy: PnlSnapshotOrderOption,
		resolution: SnapshotEpochResolution
	) => {
		const leadboardLocation =
			env === 'mainnet-beta' ? 's3.eu-west-1' : 's3.us-east-1';

		const s3Url = `https://${leaderboardBucketName}.${leadboardLocation}.amazonaws.com/${getLeaderboardFilename(
			orderBy,
			resolution
		)}`;

		const result = await (await fetch(s3Url, { cache: 'no-cache' })).json();

		const deserializedResult =
			Serializer.Deserialize.UISerializableLeaderboardResult(result);

		return deserializedResult;
	},
};

const S3_BUCKET_UTILS = {
	S3_LEADERBOARD_CLIENT,
};

export default S3_BUCKET_UTILS;
