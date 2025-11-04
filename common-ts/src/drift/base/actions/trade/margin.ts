import {
	DriftClient,
	MarketType,
	PerpMarketAccount,
	User,
} from '@drift-labs/sdk';
import {
	PublicKey,
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import { WithTxnParams } from '../../types';
import { TRADING_UTILS } from '../../../../common-ui-utils/trading';
import { MARKET_UTILS } from '../../../../common-ui-utils';

export interface CreateUpdateMarketMaxLeverageIxsParams {
	driftClient: DriftClient;
	user: User;
	perpMarketAccount: PerpMarketAccount;
	leverage: number;
	mainSignerOverride?: PublicKey;
}

/**
 * Creates transaction instructions to update a user's perp market max leverage
 * @param params - Parameters for updating market max leverage
 * @returns Promise that resolves to an array of transaction instructions
 */
export const createUpdateMarketMaxLeverageIxs = async (
	params: CreateUpdateMarketMaxLeverageIxsParams
): Promise<TransactionInstruction[]> => {
	const { driftClient, perpMarketAccount, leverage, mainSignerOverride, user } =
		params;

	const userAccount = user.getUserAccount();
	const subAccountIdToUse = userAccount.subAccountId;

	const ixs: TransactionInstruction[] = [];

	// Add enable High Leverage Mode ix for user if needed
	const { maxLeverage: marketMaxNonHLLeverage } =
		MARKET_UTILS.getMaxLeverageForMarketAccount(
			MarketType.PERP,
			perpMarketAccount
		);
	const isUserInHighLeverageMode = user.isHighLeverageMode('Initial');
	const enableHLMForUser =
		!isUserInHighLeverageMode && marketMaxNonHLLeverage < leverage;

	if (enableHLMForUser) {
		ixs.push(
			await driftClient.getEnableHighLeverageModeIx(
				subAccountIdToUse,
				undefined,
				{
					user,
					signingAuthority: mainSignerOverride,
				}
			)
		);
	}

	// Update max leverage of perp market for user
	const marginRatio = TRADING_UTILS.convertLeverageToMarginRatio(leverage);
	const perpMarketIndex = perpMarketAccount.marketIndex;
	const updateMaxLeverageIx =
		await driftClient.getUpdateUserPerpPositionCustomMarginRatioIx(
			perpMarketIndex,
			marginRatio,
			subAccountIdToUse,
			{
				userAccountPublicKey: params.user.getUserAccountPublicKey(),
				authority: userAccount.authority,
				signingAuthority: mainSignerOverride,
			}
		);
	ixs.push(updateMaxLeverageIx);

	return ixs;
};

type CreateUpdateMarketMaxMarginTxnParams =
	WithTxnParams<CreateUpdateMarketMaxLeverageIxsParams>;

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
		await createUpdateMarketMaxLeverageIxs(params),
		txParams
	);
};
