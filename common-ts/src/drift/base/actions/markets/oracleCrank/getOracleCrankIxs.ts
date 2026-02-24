import { TransactionInstruction } from '@solana/web3.js';
import { GetOracleCrankIxsOptions } from './types';
import { getPythPullUpdateIxs } from './pythPullCrank';
import { getPythLazerUpdateIxs } from './pythLazerCrank';
import {
	MAX_PYTH_PULL_CRANKS,
	MAX_PYTH_LAZER_CRANKS,
	DEFAULT_PRECEDING_IXS_COUNT,
} from './constants';

export const getOracleCrankIxs = async (
	options: GetOracleCrankIxsOptions
): Promise<TransactionInstruction[]> => {
	const {
		marketConfigs,
		driftClient,
		fetchCrankData,
		maxPythPullCranks = MAX_PYTH_PULL_CRANKS,
		maxPythLazerCranks = MAX_PYTH_LAZER_CRANKS,
		precedingIxsCount = DEFAULT_PRECEDING_IXS_COUNT,
	} = options;

	if (marketConfigs.length === 0) {
		return [];
	}

	const [pythPullIxs, pythLazerIxs] = await Promise.all([
		getPythPullUpdateIxs(
			marketConfigs,
			driftClient,
			fetchCrankData,
			maxPythPullCranks
		),
		getPythLazerUpdateIxs(
			marketConfigs,
			driftClient,
			fetchCrankData,
			maxPythLazerCranks,
			precedingIxsCount
		),
	]);

	return [...pythPullIxs, ...pythLazerIxs];
};
