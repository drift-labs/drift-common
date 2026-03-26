import {
	SpotMarketAccount,
	WRAPPED_SOL_MINT,
	getTokenProgramForSpotMarket,
} from '@drift-labs/sdk';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

export const getTokenAddress = (
	mintAddress: string,
	userPubKey: string
): Promise<PublicKey> => {
	return getAssociatedTokenAddress(
		new PublicKey(mintAddress),
		new PublicKey(userPubKey),
		true
	);
};

export const getTokenAddressFromPublicKeys = (
	mintAddress: PublicKey,
	userPubKey: PublicKey
): Promise<PublicKey> => {
	return getAssociatedTokenAddress(mintAddress, userPubKey, true);
};

/**
 * Get the associated token address for the given spot market and authority. If the mint is SOL, return the authority public key.
 * This should be used for spot token movement in and out of the user's wallet.
 * Automatically resolves the correct token program (TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID) from the spot market account.
 * @param spotMarketAccount - The spot market account
 * @param authority - The authority's public key
 * @returns The associated token address
 */
export const getTokenAddressForDepositAndWithdraw = async (
	spotMarketAccount: SpotMarketAccount,
	authority: PublicKey
): Promise<PublicKey> => {
	const isSol = spotMarketAccount.mint.equals(WRAPPED_SOL_MINT);

	if (isSol) return authority;

	return getAssociatedTokenAddress(
		spotMarketAccount.mint,
		authority,
		true,
		getTokenProgramForSpotMarket(spotMarketAccount)
	);
};
