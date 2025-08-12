import { ConfirmationStrategy } from '@drift-labs/sdk';
import { Commitment } from '@solana/web3.js';

export const DEFAULT_ACCOUNT_LOADER_COMMITMENT: Commitment = 'confirmed';
export const DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS = 1000;
export const DEFAULT_TX_SENDER_RETRY_INTERVAL = 4000;
export const DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY =
	ConfirmationStrategy.Combo;

export const SELECTED_MARKET_ACCOUNT_POLLING_CADENCE = 1_000;
export const USER_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE = 1_000;
export const USER_NOT_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE = 60_000;

export enum PollingCategory {
	ORDERBOOK = 'orderbook',
	SELECTED_MARKET = 'selected-market',
	USER_INVOLVED = 'user-involved',
	USER_NOT_INVOLVED = 'user-not-involved',
}
