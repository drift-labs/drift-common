export const USDC_SPOT_MARKET_INDEX = 0;
export const SOL_SPOT_MARKET_INDEX = 1;
export const WBTC_SPOT_MARKET_INDEX = 3;
export const WETH_SPOT_MARKET_INDEX = 4;
export const CBBTC_SPOT_MARKET_INDEX = 27;

export const DEFAULT_MAX_MARKET_LEVERAGE = 10;

/**
 * Low-activity perp markets to hide from the UI.
 * Users with active positions/orders/unsettled PnL in these markets should still see them.
 * Direct URL navigation (e.g. /TIA-PERP) is unaffected.
 */
export const HIDDEN_PERP_MARKET_INDEXES: ReadonlySet<number> = new Set([
	3, // APT
	5, // POL
	6, // ARB
	10, // 1MPEPE
	11, // OP
	14, // HNT
	19, // TIA
	21, // SEI
	27, // W
	31, // CLOUD
	34, // POPCAT
	42, // TON
	61, // ME
	62, // PENGU
	64, // TRUMP
	66, // BERA
	69, // KAITO
	70, // IP
	72, // ADA
	77, // XPL
	78, // 2Z
	80, // MNT
	82, // MET
]);
