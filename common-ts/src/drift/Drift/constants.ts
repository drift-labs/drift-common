import { ConfirmationStrategy } from '@drift-labs/sdk';
import { Commitment } from '@solana/web3.js';

export const DEFAULT_ACCOUNT_LOADER_COMMITMENT: Commitment = 'confirmed';
export const DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS = 1000;
export const DEFAULT_TX_SENDER_RETRY_INTERVAL = 4000;
export const DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY =
	ConfirmationStrategy.Combo;
