import {
	DriftClient,
	PerpMarketConfig,
	SpotMarketConfig,
} from '@drift-labs/sdk';

export type OracleCrankFetchResult = {
	success: boolean;
	data?: string;
};

export type OracleCrankDataFetcher = (
	source: 'pythPull' | 'pythLazer',
	feedIds: (number | string)[]
) => Promise<OracleCrankFetchResult>;

export type OracleMarketConfig = PerpMarketConfig | SpotMarketConfig;

export type GetOracleCrankIxsOptions = {
	marketConfigs: OracleMarketConfig[];
	driftClient: DriftClient;
	fetchCrankData: OracleCrankDataFetcher;
	maxPythPullCranks?: number;
	maxPythLazerCranks?: number;
	precedingIxsCount?: number;
};
