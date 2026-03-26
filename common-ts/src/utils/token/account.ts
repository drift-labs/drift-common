import { getAssociatedTokenAddress } from '@solana/spl-token';
import {
	AccountInfo,
	Connection,
	ParsedAccountData,
	PublicKey,
} from '@solana/web3.js';

export const getTokenAccount = async (
	connection: Connection,
	mintAddress: string,
	userPubKey: string
): Promise<{
	pubkey: PublicKey;
	account: AccountInfo<ParsedAccountData>;
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

export const getBalanceFromTokenAccountResult = (account: {
	pubkey: PublicKey;
	account: AccountInfo<ParsedAccountData>;
}) => {
	return account?.account.data?.parsed?.info?.tokenAmount?.uiAmount;
};

export const getTokenAccountWithWarning = async (
	connection: Connection,
	mintAddress: PublicKey,
	userPubKey: PublicKey
): Promise<{
	tokenAccount: {
		pubkey: PublicKey;
		account: AccountInfo<ParsedAccountData>;
	};
	tokenAccountWarning: boolean;
}> => {
	const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
		userPubKey,
		{ mint: mintAddress }
	);

	const associatedAddress = await getAssociatedTokenAddress(
		mintAddress,
		userPubKey,
		true
	);

	const targetAccount =
		tokenAccounts.value.filter((account) =>
			account.pubkey.equals(associatedAddress)
		)[0] || tokenAccounts.value[0];

	const anotherBalanceExists = tokenAccounts.value.find((account) => {
		return (
			!!getBalanceFromTokenAccountResult(account) &&
			!account.pubkey.equals(targetAccount.pubkey)
		);
	});

	let tokenAccountWarning = false;

	if (anotherBalanceExists) {
		tokenAccountWarning = true;
	}

	return {
		tokenAccount: targetAccount,
		tokenAccountWarning,
	};
};
