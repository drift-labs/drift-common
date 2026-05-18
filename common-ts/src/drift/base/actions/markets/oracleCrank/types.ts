import {
	VelocityClient,
	PerpMarketConfig,
	SpotMarketConfig,
} from '@velocity-exchange/sdk';

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
	velocityClient: VelocityClient;
	fetchCrankData: OracleCrankDataFetcher;
	maxPythPullCranks?: number;
	maxPythLazerCranks?: number;
	precedingIxsCount?: number;
};
