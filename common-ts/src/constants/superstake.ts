import { MainnetSpotMarkets, SpotMarketConfig } from '@drift-labs/sdk';

export type LST = {
	symbol: string; // symbol is added as a config because JitoSOL's symbol in the spotMarket is jitoSOL
	driftAccountName: string;
	spotMarket: SpotMarketConfig;
	logoUrl: string;
	// maxLeverage set manually for now, but would be nice if we make it derived from the asset weight later on
	maxLeverage: number;
	// Default leverage to start the form out with when switching to the lst
	defaultLeverage: number;
	// Symbol of the token offered as emissions if there's an emissions APY on top of the normal APY
	emissionsTokenSymbol?: string;
	// use direct route for Jupiter swap
	onlyDirectRoute?: boolean;
};

export const M_SOL: LST = {
	symbol: 'mSOL',
	driftAccountName: 'Super Stake SOL',
	spotMarket: MainnetSpotMarkets[2],
	logoUrl: '/mSol.svg',
	maxLeverage: 3,
	defaultLeverage: 2,
	onlyDirectRoute: true,
};

export const JITO_SOL: LST = {
	symbol: 'JitoSOL',
	driftAccountName: 'Super Stake JitoSOL',
	spotMarket: MainnetSpotMarkets[6],
	logoUrl: '/jitoSol.svg',
	maxLeverage: 1.8,
	defaultLeverage: 1.4,
	onlyDirectRoute: true,
};

export const B_SOL: LST = {
	symbol: 'bSOL',
	driftAccountName: 'Super Stake bSOL',
	spotMarket: MainnetSpotMarkets[8],
	logoUrl: '/bsol.svg',
	maxLeverage: 2.5,
	defaultLeverage: 1.8,
	emissionsTokenSymbol: 'BLZE',
	onlyDirectRoute: true,
};

/**
 * All LSTs that support one-click superstaking
 */
export const SUPERSTAKE_ALL_LST: LST[] = [M_SOL, JITO_SOL, B_SOL];

/**
 * All LSTs that support one-click superstaking
 */
export const SUPERSTAKE_ALL_LST_MAP: Record<string, LST> = {
	[M_SOL.symbol]: M_SOL,
	[JITO_SOL.symbol]: JITO_SOL,
	[B_SOL.symbol]: B_SOL,
};
