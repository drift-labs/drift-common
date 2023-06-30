import { getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

export const getTokenAddress = (
	mintAddress: string,
	userPubKey: string
): Promise<PublicKey> => {
	return getAssociatedTokenAddress(
		new PublicKey(mintAddress),
		new PublicKey(userPubKey)
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
		new PublicKey(userPubKey)
	);

	const targetAccount =
		tokenAccounts.value.filter((account) =>
			account.pubkey.equals(associatedAddress)
		)[0] || tokenAccounts.value[0];

	return targetAccount;
};
