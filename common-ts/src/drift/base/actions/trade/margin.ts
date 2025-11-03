import { DriftClient, User } from '@drift-labs/sdk';
import {
	PublicKey,
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import { WithTxnParams } from '../../types';
import { TRADING_UTILS } from '../../../../common-ui-utils/trading';

export interface CreateUpdateMarketMaxLeverageIxParams {
	driftClient: DriftClient;
	user: User;
	perpMarketIndex: number;
	leverage: number;
	mainSignerOverride?: PublicKey;
}

/**
 * Creates a transaction instruction to update a user's perp market max leverage
 * @param params - Parameters for updating market max leverage
 * @returns Promise that resolves to a TransactionInstruction
 */
export const createUpdateMarketMaxLeverageIx = async (
	params: CreateUpdateMarketMaxLeverageIxParams
): Promise<TransactionInstruction> => {
	const { driftClient, perpMarketIndex, leverage, mainSignerOverride } = params;

	const marginRatio = TRADING_UTILS.convertLeverageToMarginRatio(leverage);
	const userAccount = params.user.getUserAccount();
	const subAccountIdToUse = userAccount.subAccountId;

	return driftClient.getUpdateUserPerpPositionCustomMarginRatioIx(
		perpMarketIndex,
		marginRatio,
		subAccountIdToUse,
		{
			userAccountPublicKey: params.user.getUserAccountPublicKey(),
			authority: userAccount.authority,
			signingAuthority: mainSignerOverride,
		}
	);
};

type CreateUpdateMarketMaxMarginTxnParams =
	WithTxnParams<CreateUpdateMarketMaxLeverageIxParams>;

/**
 * Creates a complete transaction to update a user's market max leverage
 * @param params - Parameters for updating market max leverage, including optional transaction parameters
 * @returns Promise that resolves to a Transaction or VersionedTransaction
 */
export const createUpdateMarketMaxLeverageTxn = async ({
	txParams,
	...params
}: CreateUpdateMarketMaxMarginTxnParams): Promise<
	Transaction | VersionedTransaction
> => {
	return params.driftClient.buildTransaction(
		await createUpdateMarketMaxLeverageIx(params),
		txParams
	);
};
