import { PerpMarketConfig, SpotMarketConfig } from '@drift-labs/sdk';

export interface IPredictionMarketConfig {
	title: string;
	shortTitle: string;
	category?: string;
	symbol: string;
	imgSrc: string;
	previewImgSrc?: string;
	devnetMarketIndex?: number;
	mainnetMarketIndex?: number;
	production?: boolean;
	endingSoonThresholdDays?: number;
	resolutionDateUnknown?: boolean;
	resolutionDate: Date;
	newUntilTs?: number;
}

export type SerializedPredictionMarketConfig = Omit<
	IPredictionMarketConfig,
	'resolutionDate'
> & {
	resolutionDateUnix: number;
};

export type SerializedSpotMarketConfig = Omit<
	SpotMarketConfig,
	| 'oracle'
	| 'mint'
	| 'oracleSource'
	| 'precision'
	| 'precisionExp'
	| 'serumMarket'
	| 'phoenixMarket'
	| 'openbookMarket'
> & {
	oracle: string;
	mint: string;
	oracleSource: string;
	precision: number;
	precisionExp: number;
	serumMarket?: string;
	phoenixMarket?: string;
	openbookMarket?: string;
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
	predictionMarkets: SerializedPredictionMarketConfig[];
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
	predictionMarkets: IPredictionMarketConfig[];
};
