export const USDC_SPOT_MARKET_INDEX = 0;
export const SOL_SPOT_MARKET_INDEX = 1;
export const WBTC_SPOT_MARKET_INDEX = 3;
export const WETH_SPOT_MARKET_INDEX = 4;
export const CBBTC_SPOT_MARKET_INDEX = 27;

export const DEFAULT_MAX_MARKET_LEVERAGE = 10;

/**
 * Low-activity perp markets to hide from the UI.
 * Key = perp market index, Value = Unix timestamp (seconds) after which the market is hidden.
 * Before the timestamp: market is visible but a warning banner is shown.
 * After the timestamp: market is hidden from dropdowns (unless user has positions/orders/unsettled PnL).
 * Direct URL navigation (e.g. /TIA-PERP) is unaffected.
 */
export const HIDDEN_PERP_MARKET_INDEXES: ReadonlyMap<number, number> = new Map([
	[5, 1772625600], // POL — 4 Mar 2026, 12:00 UTC
	[10, 1772625600], // 1MPEPE — 4 Mar 2026, 12:00 UTC
	[11, 1772625600], // OP — 4 Mar 2026, 12:00 UTC
	[14, 1772625600], // HNT — 4 Mar 2026, 12:00 UTC
	[19, 1772625600], // TIA — 4 Mar 2026, 12:00 UTC
	[21, 1772625600], // SEI — 4 Mar 2026, 12:00 UTC
	[34, 1772625600], // POPCAT — 4 Mar 2026, 12:00 UTC
	[42, 1772625600], // TON — 4 Mar 2026, 12:00 UTC
	[62, 1772625600], // PENGU — 4 Mar 2026, 12:00 UTC
	[64, 1772625600], // TRUMP — 4 Mar 2026, 12:00 UTC
	[72, 1772625600], // ADA — 4 Mar 2026, 12:00 UTC
	[77, 1772625600], // XPL — 4 Mar 2026, 12:00 UTC
	[78, 1772625600], // 2Z — 4 Mar 2026, 12:00 UTC
	[80, 1772625600], // MNT — 4 Mar 2026, 12:00 UTC
	[82, 1772625600], // MET — 4 Mar 2026, 12:00 UTC
]);
