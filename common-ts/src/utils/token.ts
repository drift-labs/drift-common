import {
	SpotMarketAccount,
	WRAPPED_SOL_MINT,
	getTokenProgramForSpotMarket,
} from '@drift-labs/sdk';
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddress,
} from '@solana/spl-token';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

export {
	TOKEN_PROGRAM_ID,
	createTransferCheckedInstruction,
} from '@solana/spl-token';

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

export const getTokenAccount = async (
	connection: Connection,
	mintAddress: string,
	userPubKey: string
): Promise<{
	pubkey: PublicKey;
	account: import('@solana/web3.js').AccountInfo<
		import('@solana/web3.js').ParsedAccountData
	>;
}> => {
	const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
		new PublicKey(userPubKey),
		{ mint: new PublicKey(mintAddress) }
	);

	const associatedAddress = await getAssociatedTokenAddress(
		new PublicKey(mintAddress),
		new PublicKey(userPubKey),
		true
	);

	const targetAccount =
		tokenAccounts.value.filter((account) =>
			account.pubkey.equals(associatedAddress)
		)[0] || tokenAccounts.value[0];

	return targetAccount;
};

export const createTokenAccountIx = async (
	owner: PublicKey,
	mintAddress: PublicKey,
	payer?: PublicKey
): Promise<TransactionInstruction> => {
	if (!payer) {
		payer = owner;
	}

	const associatedAddress = await getAssociatedTokenAddress(
		mintAddress,
		owner,
		true
	);

	const createAtaIx = await createAssociatedTokenAccountInstruction(
		payer,
		associatedAddress,
		owner,
		mintAddress
	);

	return createAtaIx;
};
