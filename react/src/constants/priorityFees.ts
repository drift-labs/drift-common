import { PublicKey } from '@solana/web3.js';

export const FEE_SUBSCRIPTION_SLOT_LOOKBACK = 10;

export const PRIORITY_FEE_SUBSCRIPTION_ADDRESSES = [
	new PublicKey('8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6'), // sol openbook market
	new PublicKey('8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W'), // sol perp
	new PublicKey('6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3'), // usdc
];

export const PRIORITY_FEE_SUBSCRIPTION_ADDRESS_STRINGS =
	PRIORITY_FEE_SUBSCRIPTION_ADDRESSES.map((pubkey) => pubkey.toString()); // Pre-Computed string versions of the addresses, to save on computation

export const BOOSTED_MULITPLIER = 5;
export const TURBO_MULTIPLIER = 10;

export const DEFAULT_PRIORITY_FEE_MAX_CAP = 0.01;
