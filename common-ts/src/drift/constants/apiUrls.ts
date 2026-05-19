/**
 * API URL constants for Velocity protocol services
 *
 * These constants define the URLs used within the velocity directory for various Velocity services.
 */

export const API_URLS = {
	/**
	 * Data API - Used for historical data, funding rates, candles, etc.
	 */
	DATA_API: 'https://data.api.drift.trade',

	/**
	 * DLOB (Decentralized Limit Order Book) Server - Used for auction parameters, priority fees, etc.
	 */
	DLOB: 'https://dlob.drift.trade',

	/**
	 * Swift Server - Used for signed message (gasless) orders
	 */
	SWIFT: 'https://swift.drift.trade',
} as const;

/**
 * API endpoints for specific functionality
 */
export const API_ENDPOINTS = {
	FUNDING_RATES: '/fundingRates',
	BATCH_PRIORITY_FEES: '/batchPriorityFees',
	AUCTION_PARAMS: '/auctionParams',
} as const;
