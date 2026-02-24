import { DriftClient } from '@drift-labs/sdk';
import { TransactionInstruction } from '@solana/web3.js';
import { OracleCrankDataFetcher, OracleMarketConfig } from './types';
import { isPythPull } from './oracleSourceHelpers';
import { MAX_PYTH_PULL_CRANKS } from './constants';

export const getPythPullUpdateIxs = async (
	marketConfigs: OracleMarketConfig[],
	driftClient: DriftClient,
	oracleCrankDataFetcher: OracleCrankDataFetcher,
	maxCount: number = MAX_PYTH_PULL_CRANKS
): Promise<TransactionInstruction[]> => {
	const feedIds = [
		...new Set(
			marketConfigs
				.filter((config) => isPythPull(config.oracleSource))
				.map((config) => config.pythFeedId)
				.filter((feedId): feedId is string => feedId !== undefined)
		),
	].slice(0, maxCount);

	if (feedIds.length === 0) {
		return [];
	}

	const result = await oracleCrankDataFetcher('pythPull', feedIds);

	if (!result.success || !result.data) {
		console.error('Error getting pyth pull update data');
		return [];
	}

	try {
		const crankIxs = await driftClient.getPostPythPullOracleUpdateAtomicIxs(
			result.data,
			feedIds
		);
		return crankIxs;
	} catch (e) {
		console.error('Error getting pyth pull crank ix from driftClient:', e);
		return [];
	}
};
