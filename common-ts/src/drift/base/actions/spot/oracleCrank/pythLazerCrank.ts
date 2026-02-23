import { DriftClient } from '@drift-labs/sdk';
import { TransactionInstruction } from '@solana/web3.js';
import { OracleCrankDataFetcher, OracleMarketConfig } from './types';
import { isPythLazer } from './oracleSourceHelpers';
import {
	MAX_PYTH_LAZER_CRANKS,
	DEFAULT_PRECEDING_IXS_COUNT,
} from './constants';

export const getPythLazerUpdateIxs = async (
	marketConfigs: OracleMarketConfig[],
	driftClient: DriftClient,
	oracleCrankDataFetcher: OracleCrankDataFetcher,
	maxCount: number = MAX_PYTH_LAZER_CRANKS,
	precedingIxsCount: number = DEFAULT_PRECEDING_IXS_COUNT
): Promise<TransactionInstruction[]> => {
	const feedIds = [
		...new Set(
			marketConfigs
				.filter((config) => isPythLazer(config.oracleSource))
				.map((config) => config.pythLazerId)
				.filter((feedId): feedId is number => feedId !== undefined)
		),
	].slice(0, maxCount);

	if (feedIds.length === 0) {
		return [];
	}

	const result = await oracleCrankDataFetcher('pythLazer', feedIds);

	if (!result.success || !result.data) {
		console.error('Error getting pyth lazer update data');
		return [];
	}

	try {
		const crankIxs = await driftClient.getPostPythLazerOracleUpdateIxs(
			feedIds,
			result.data ?? '',
			undefined,
			precedingIxsCount + 1
		);
		return crankIxs;
	} catch (e) {
		console.error('Error getting pyth lazer crank ix from driftClient:', e);
		return [];
	}
};
