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
