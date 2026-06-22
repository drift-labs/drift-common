import { PerpMarketConfig, SpotMarketConfig } from '@velocity-exchange/sdk';

export type SerializedSpotMarketConfig = Omit<
	SpotMarketConfig,
	'oracle' | 'mint' | 'oracleSource' | 'precision' | 'precisionExp'
> & {
	oracle: string;
	mint: string;
	oracleSource: string;
	precision: number;
	precisionExp: number;
	production?: boolean;
};

export type SerializedPerpMarketConfig = Omit<
	PerpMarketConfig,
	'oracle' | 'oracleSource'
> & {
	oracle: string;
	oracleSource: string;
	production?: boolean;
};

export type SerializedRemoteConfigs = {
	marketConfigs: {
		devnet: {
			spot: SerializedSpotMarketConfig[];
			perp: SerializedPerpMarketConfig[];
		};
		mainnet: {
			spot: SerializedSpotMarketConfig[];
			perp: SerializedPerpMarketConfig[];
		};
	};
};

export type RemoteConfigs = {
	marketConfigs: {
		devnet: {
			spot: SpotMarketConfig[];
			perp: PerpMarketConfig[];
		};
		mainnet: {
			spot: SpotMarketConfig[];
			perp: PerpMarketConfig[];
		};
	};
};
