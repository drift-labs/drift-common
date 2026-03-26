import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddress,
} from '@solana/spl-token';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export {
	TOKEN_PROGRAM_ID,
	createTransferCheckedInstruction,
} from '@solana/spl-token';

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
