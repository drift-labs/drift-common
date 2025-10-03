import {
	BigNum,
	DriftClient,
	SpotMarketConfig,
	TxParams,
	User,
} from '@drift-labs/sdk';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import { getTokenAddressForDepositAndWithdraw } from '../../../../utils/token';

interface CreateWithdrawIxParams {
	driftClient: DriftClient;
	user: User;
	amount: BigNum;
	spotMarketConfig: SpotMarketConfig;
	isBorrow?: boolean;
	isMax?: boolean;
}

export const createWithdrawIx = async ({
	driftClient,
	amount,
	spotMarketConfig,
	user,
	isBorrow,
	isMax,
}: CreateWithdrawIxParams): Promise<TransactionInstruction[]> => {
	const reduceOnly = !isBorrow;

	let finalWithdrawAmount = amount;

	if (isMax && reduceOnly) {
		// we over-estimate to ensure that there is no borrow dust left
		// since reduceOnly is true, it is safe to over-estimate
		finalWithdrawAmount = finalWithdrawAmount.scale(2, 1);
		const scaledBalance = user
			.getUserAccount()
			.spotPositions.find(
				(position) => position.marketIndex === spotMarketConfig.marketIndex
			)?.scaledBalance;
		if (scaledBalance && scaledBalance.abs().gtn(0)) {
			// we use scaledBalance in case amount argument is zero
			finalWithdrawAmount = BigNum.max(
				finalWithdrawAmount,
				BigNum.from(scaledBalance, spotMarketConfig.precisionExp).scale(2, 1)
			);
		}
	}

	const authority = user.getUserAccount().authority;
	const associatedDepositTokenAddress =
		await getTokenAddressForDepositAndWithdraw(
			spotMarketConfig.mint,
			authority
		);

	const withdrawIxs = await driftClient.getWithdrawalIxs(
		finalWithdrawAmount.val,
		spotMarketConfig.marketIndex,
		associatedDepositTokenAddress,
		reduceOnly,
		user.getUserAccount().subAccountId,
		undefined
	);

	return withdrawIxs;
};

interface CreateWithdrawTxnParams extends CreateWithdrawIxParams {
	txParams?: TxParams;
}

export const createWithdrawTxn = async ({
	driftClient,
	amount,
	spotMarketConfig,
	user,
	isBorrow,
	isMax,
	txParams,
}: CreateWithdrawTxnParams): Promise<Transaction | VersionedTransaction> => {
	const withdrawIxs = await createWithdrawIx({
		driftClient,
		amount,
		spotMarketConfig,
		user,
		isBorrow,
		isMax,
	});

	const withdrawTxn = await driftClient.txHandler.buildTransaction({
		instructions: withdrawIxs,
		txVersion: 0,
		connection: driftClient.connection,
		preFlightCommitment: 'confirmed',
		fetchAllMarketLookupTableAccounts:
			driftClient.fetchAllLookupTableAccounts.bind(driftClient),
		txParams,
	});

	return withdrawTxn;
};
