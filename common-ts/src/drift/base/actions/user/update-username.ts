import { DriftClient, encodeName, PublicKey, TxParams } from '@drift-labs/sdk';

interface UpdateUserNameIxParams {
	driftClient: DriftClient;
	newName: string;
	userAccountPublicKey: PublicKey;
	subAccountId: number;
}

export const updateUserNameIx = async ({
	driftClient,
	newName,
	userAccountPublicKey,
	subAccountId,
}: UpdateUserNameIxParams) => {
	const nameBuffer = encodeName(newName);
	const ix = await driftClient.program.instruction.updateUserName(
		subAccountId,
		nameBuffer,
		{
			accounts: {
				user: userAccountPublicKey,
				authority: driftClient.wallet.publicKey,
			},
		}
	);
	return ix;
};

interface UpdateUserNameTxnParams extends UpdateUserNameIxParams {
	txParams?: TxParams;
}

export const updateUserNameTxn = async ({
	driftClient,
	newName,
	userAccountPublicKey,
	subAccountId,
	txParams,
}: UpdateUserNameTxnParams) => {
	const ix = await updateUserNameIx({
		driftClient,
		newName,
		userAccountPublicKey,
		subAccountId,
	});
	return driftClient.buildTransaction(ix, txParams);
};
