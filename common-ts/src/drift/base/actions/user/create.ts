import {
	BN,
	DriftClient,
	PublicKey,
	ReferrerInfo,
	ReferrerNameAccount,
	SpotMarketConfig,
	TxParams,
	UserStatsAccount,
	ZERO,
} from '@drift-labs/sdk';
import { getTokenAddressForDepositAndWithdraw } from '../../../../utils/token';
import { DEFAULT_ACCOUNT_NAMES_BY_POOL_ID } from '../../constants/accountNames';
import { MAIN_POOL_ID } from '../../../../constants/pools';
import {
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
import { USER_UTILS } from '../../../../common-ui-utils/user';

interface CreateUserAndDepositCollateralBaseIxsParams {
	driftClient: DriftClient;
	amount: BN;
	spotMarketConfig: SpotMarketConfig;
	authority: PublicKey;
	userStatsAccount: UserStatsAccount | undefined;
	referrerName?: string;
	accountName?: string;
	poolId?: number;
	fromSubAccountId?: number;
	customMaxMarginRatio?: number;
}

/**
 * Creates transaction instructions for initializing a new user account and depositing collateral.
 *
 * This function generates the necessary transaction instructions to:
 * 1. Initialize a new user account in the Drift protocol
 * 2. Deposit collateral into the newly created account
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param amount - The amount of collateral to deposit (in base units)
 * @param spotMarketConfig - The spot market config of the deposit collateral
 * @param authority - The public key of the account authority (wallet owner)
 * @param userStatsAccount - Existing user stats account, used to determine next sub-account ID
 * @param referrerName - Optional name of the referrer for referral tracking
 * @param accountName - Optional custom name for the account (defaults to pool-specific name)
 * @param poolId - The pool ID to associate the account with (defaults to MAIN_POOL_ID)
 * @param fromSubAccountId - Optional sub-account ID to transfer funds from
 * @param customMaxMarginRatio - Optional custom maximum margin ratio for the account
 *
 * @returns Promise resolving to an object containing:
 *   - subAccountId: The ID of the newly created sub-account
 *   - userAccountPublicKey: The public key of the created user account
 *   - ixs: Array of transaction instructions to execute
 */
export const createUserAndDepositCollateralBaseIxs = async ({
	driftClient,
	amount,
	spotMarketConfig,
	authority,
	userStatsAccount,
	referrerName,
	accountName,
	poolId = MAIN_POOL_ID,
	fromSubAccountId,
	customMaxMarginRatio,
}: CreateUserAndDepositCollateralBaseIxsParams): Promise<{
	subAccountId: number;
	userAccountPublicKey: PublicKey;
	ixs: TransactionInstruction[];
}> => {
	const nextUserId = userStatsAccount?.numberOfSubAccountsCreated ?? 0; // userId is zero indexed

	const associatedDepositTokenAddressPromise =
		getTokenAddressForDepositAndWithdraw(spotMarketConfig.mint, authority);
	const referrerNameAccountPromise: Promise<ReferrerNameAccount | undefined> =
		referrerName
			? driftClient.fetchReferrerNameAccount(referrerName)
			: Promise.resolve(undefined);
	const subaccountExistsPromise = USER_UTILS.checkIfUserAccountExists(
		driftClient,
		{
			type: 'subAccountId',
			subAccountId: nextUserId,
			authority,
		}
	);

	const [associatedDepositTokenAddress, referrerNameAccount, subaccountExists] =
		await Promise.all([
			associatedDepositTokenAddressPromise,
			referrerNameAccountPromise,
			subaccountExistsPromise,
		]);

	if (subaccountExists) {
		throw new Error('Subaccount already exists');
	}

	const accountNameToUse =
		accountName ??
		(poolId !== MAIN_POOL_ID || nextUserId === 0
			? DEFAULT_ACCOUNT_NAMES_BY_POOL_ID[poolId]
			: `Account ${nextUserId}`);

	const referrerInfo: ReferrerInfo | undefined = referrerNameAccount
		? {
				referrer: referrerNameAccount.user,
				referrerStats: referrerNameAccount.userStats,
		  }
		: undefined;

	const { ixs, userAccountPublicKey } =
		await driftClient.createInitializeUserAccountAndDepositCollateralIxs(
			amount,
			associatedDepositTokenAddress,
			spotMarketConfig.marketIndex,
			nextUserId,
			accountNameToUse,
			fromSubAccountId,
			referrerInfo,
			ZERO,
			customMaxMarginRatio,
			poolId
		);

	return {
		subAccountId: nextUserId,
		userAccountPublicKey,
		ixs,
	};
};

interface CreateUserAndDepositCollateralBaseTxnParams
	extends CreateUserAndDepositCollateralBaseIxsParams {
	txParams?: TxParams;
}

/**
 * Creates a complete transaction for initializing a new user account and depositing collateral.
 *
 * This function is a higher-level wrapper around `createUserAndDepositCollateralBaseIxs` that:
 * 1. Generates the necessary transaction instructions
 * 2. Builds a complete transaction ready for signing and submission
 *
 * @param driftClient - The Drift client instance for interacting with the protocol
 * @param amount - The amount of collateral to deposit (in base units)
 * @param spotMarketConfig - The spot market config of the deposit collateral
 * @param authority - The public key of the account authority (wallet owner)
 * @param userStatsAccount - Existing user stats account, used to determine next sub-account ID
 * @param referrerName - Optional name of the referrer for referral tracking
 * @param accountName - Optional custom name for the account (defaults to pool-specific name)
 * @param poolId - The pool ID to associate the account with (defaults to MAIN_POOL_ID)
 * @param fromSubAccountId - Optional sub-account ID to transfer funds from
 * @param customMaxMarginRatio - Optional custom maximum margin ratio for the account
 * @param txParams - Transaction parameters for building the transaction (compute units, priority fees, etc.)
 *
 * @returns Promise resolving to an object containing:
 *   - transaction: The built transaction ready for signing (Transaction or VersionedTransaction)
 *   - userAccountPublicKey: The public key of the created user account
 *   - subAccountId: The ID of the newly created sub-account
 */
export const createUserAndDepositCollateralBaseTxn = async ({
	driftClient,
	amount,
	spotMarketConfig,
	authority,
	userStatsAccount,
	referrerName,
	accountName,
	poolId = MAIN_POOL_ID,
	fromSubAccountId,
	customMaxMarginRatio,
	txParams,
}: CreateUserAndDepositCollateralBaseTxnParams): Promise<{
	transaction: Transaction | VersionedTransaction;
	userAccountPublicKey: PublicKey;
	subAccountId: number;
}> => {
	const { ixs, userAccountPublicKey, subAccountId } =
		await createUserAndDepositCollateralBaseIxs({
			driftClient,
			amount,
			spotMarketConfig,
			authority,
			userStatsAccount,
			referrerName,
			accountName,
			poolId,
			fromSubAccountId,
			customMaxMarginRatio,
		});

	const tx = await driftClient.buildTransaction(ixs, txParams);

	return { transaction: tx, userAccountPublicKey, subAccountId };
};
