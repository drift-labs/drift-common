import { WRAPPED_SOL_MINT } from '@drift-labs/sdk';
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddress,
	TOKEN_PROGRAM_ID,
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
 * Get the associated token address for the given mint and user public key. If the mint is SOL, return the user public key.
 * This should be used for spot token movement in and out of the user's wallet.
 * @param mintAddress - The mint address
 * @param authorityPubKey - The authority's public key
 * @param tokenProgram - The token program ID (defaults to TOKEN_PROGRAM_ID, use TOKEN_2022_PROGRAM_ID for Token-2022 tokens)
 * @returns The associated token address
 */
export const getTokenAddressForDepositAndWithdraw = async (
	mintAddress: PublicKey,
	authorityPubKey: PublicKey,
	tokenProgram: PublicKey = TOKEN_PROGRAM_ID
): Promise<PublicKey> => {
	const isSol = mintAddress.equals(WRAPPED_SOL_MINT);

	if (isSol) return authorityPubKey;

	return getAssociatedTokenAddress(
		mintAddress,
		authorityPubKey,
		true,
		tokenProgram
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
