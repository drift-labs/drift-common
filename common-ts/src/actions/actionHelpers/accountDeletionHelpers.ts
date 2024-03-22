import {
	ACCOUNT_AGE_DELETION_CUTOFF_SECONDS,
	BN,
	DriftClient,
	IDLE_TIME_SLOTS,
	SLOT_TIME_ESTIMATE_MS,
	User,
	UserStats,
	UserStatsAccount,
	ZERO,
	isVariant,
	positionIsAvailable,
} from '@drift-labs/sdk';
import { TransactionInstruction } from '@solana/web3.js';

type AccountDeletionStep =
	| 'askToCloseAllPositionsOrdersBorrows'
	| 'sendAccountDeletionIx'
	| 'sendBalanceWithdrawalIx'
	| 'sendTriggerAccountIdleIx'
	| 'askToWait';

const getStatsAccountDeletionWaitTime = (
	userStatsAccount: UserStatsAccount
) => {
	const estimatedAgeSeconds =
		Math.round(Date.now() / 1000) -
		UserStats.getOldestActionTs(userStatsAccount);

	return Math.max(ACCOUNT_AGE_DELETION_CUTOFF_SECONDS - estimatedAgeSeconds, 0);
};

const getStatsAccountIsPastDeletionCutoff = (
	userStatsAccount: UserStatsAccount
) => {
	const estimatedAgeSeconds =
		Math.round(Date.now() / 1000) -
		UserStats.getOldestActionTs(userStatsAccount);

	return estimatedAgeSeconds >= ACCOUNT_AGE_DELETION_CUTOFF_SECONDS;
};

const accountHasOpenPerpPositions = (user: User) => {
	const userAccount = user.getUserAccount();
	for (const perpPosition of userAccount.perpPositions) {
		if (!positionIsAvailable(perpPosition)) {
			return true;
		}
	}

	return false;
};

const accountHasOpenSpotPositions = (user: User) => {
	const userAccount = user.getUserAccount();
	for (const spotPosition of userAccount.spotPositions) {
		if (spotPosition.scaledBalance.gt(ZERO)) {
			return true;
		}
	}

	return false;
};

const accountHasOpenOrders = (user: User) => {
	const userAccount = user.getUserAccount();
	for (const order of userAccount.orders) {
		if (!isVariant(order.status, 'init')) {
			return true;
		}
	}

	return false;
};

const accountHasOpenPositionsOrOrders = (user: User) => {
	if (accountHasOpenPerpPositions(user)) {
		return true;
	}

	if (accountHasOpenSpotPositions(user)) {
		return true;
	}

	if (accountHasOpenOrders(user)) {
		return true;
	}

	return false;
};

type CanBeDeletedState =
	| 'no'
	| 'yes'
	| 'no-wait-for-idle'
	| 'yes-after-making-idle';

const getAccountCanBeDeletedInstantly = (
	user: User,
	userStatsAccount: UserStatsAccount,
	currentSlot: number
): CanBeDeletedState => {
	const statsAccountIsPastDeletionCutoff =
		getStatsAccountIsPastDeletionCutoff(userStatsAccount);

	const userIsIdle = user.getUserAccount().idle;

	const userCanBeMarkedIdle = user.canMakeIdle(new BN(currentSlot));

	const accountHasNoOpenPositionsOrOrders =
		!accountHasOpenPositionsOrOrders(user);

	if (!accountHasNoOpenPositionsOrOrders) {
		return 'no';
	}

	if (statsAccountIsPastDeletionCutoff || userIsIdle) {
		return 'yes';
	}

	if (!userCanBeMarkedIdle) {
		return 'no-wait-for-idle';
	}

	return 'yes-after-making-idle';
};

/**
 * To try improve the UX we want to abstract away the different account states and deletion compliance. This method returns the steps required to give the best UX for account deletion depending on the incoming account state. A short explanation of the logic:
 *
 * States that affect whether an account can be deleted:
 * - A user stats account that is older than 13 days => All accounts can be deleted
 * - A user account that is idle => The user account in question can be deleted
 * - A user account that can be marked idle => The user account in question can be deleted after sending a markIdle instruction
 * - A user that is not/can not be idle (yet), with no stats account older than 13 days => wait until the account is idle and then try again. If the user has open perp positions, orders or borrows, they need to be closed first as well.
 * @param userAccount
 * @param userStatsAccount
 */
const getAccountDeletionStepsToTake = (
	user: User,
	userStatsAccount: UserStatsAccount,
	currentSlot: number
): AccountDeletionStep[] => {
	const userAccount = user.getUserAccount();
	const statsAccountIsPastDeletionCutoff =
		getStatsAccountIsPastDeletionCutoff(userStatsAccount);

	// Account is past deletion cutoff
	if (statsAccountIsPastDeletionCutoff) {
		return ['sendAccountDeletionIx'];
	}

	// Account needs to be unwound first
	const hasOpenPositionsOrOrders = accountHasOpenPositionsOrOrders(user);

	if (hasOpenPositionsOrOrders) {
		return ['askToCloseAllPositionsOrdersBorrows'];
	}

	// Account is idle and can be deleted
	const userAccountIsIdle = userAccount.idle;

	if (userAccountIsIdle) {
		return ['sendAccountDeletionIx'];
	}

	// Account can be marked idle and then deleted
	const canBeMarkedIdle = user.canMakeIdle(new BN(currentSlot));

	if (canBeMarkedIdle) {
		return ['sendTriggerAccountIdleIx', 'sendAccountDeletionIx'];
	}

	// Account is not idle and can not be marked idle yet, wait until it is (or can be marked) idle and then try again
	return ['askToWait'];
};

/**
 * Builds the necessary transaction to delete a user account. This method will throw an error if the account cannot be deleted instantly.
 * @param driftClient
 * @param user
 * @param userStatsAccount
 * @param latestSlot
 * @returns
 */
const tryDeleteUserAccount = async (
	driftClient: DriftClient,
	user: User,
	userStatsAccount: UserStatsAccount,
	latestSlot: number
) => {
	const canBeDeleted = getAccountCanBeDeletedInstantly(
		user,
		userStatsAccount,
		latestSlot
	);

	if (canBeDeleted === 'no' || canBeDeleted === 'no-wait-for-idle') {
		throw new Error('Account cannot be deleted');
	}

	const Ixs: TransactionInstruction[] = [];

	if (canBeDeleted === 'yes-after-making-idle') {
		// Create the make idle instruction
		Ixs.push(
			await driftClient.getUpdateUserIdleIx(
				user.userAccountPublicKey,
				user.getUserAccount()
			)
		);
	}

	// Create the delete account instruction
	Ixs.push(await driftClient.getUserDeletionIx(user.userAccountPublicKey));

	// Create a transaction from the instructions
	const tx = await driftClient.buildTransaction(Ixs);

	const { txSig } = await driftClient.sendTransaction(tx);

	const userMapKey = driftClient.getUserMapKey(
		user.getUserAccount().subAccountId,
		driftClient.wallet.publicKey
	);
	await driftClient.users.get(userMapKey)?.unsubscribe();
	driftClient.users.delete(userMapKey);

	return txSig;
};

export const getIdleWaitTimeMinutes = (user: User, currentSlot: number) => {
	const lastActiveSlot = user.getUserAccount().lastActiveSlot;

	const inactiveAccountTime = Math.max(
		currentSlot - lastActiveSlot.toNumber(),
		0
	);

	const slotsToWait = IDLE_TIME_SLOTS - inactiveAccountTime;

	const secondsPerSlot = SLOT_TIME_ESTIMATE_MS / 1000;

	const timeEstimateSeconds = slotsToWait * secondsPerSlot;

	const minutesEstimate = Math.ceil(timeEstimateSeconds / 60);

	return minutesEstimate;
};

export const ACCOUNT_DELETION_HELPERS = {
	accountHasOpenOrders,
	accountHasOpenPerpPositions,
	accountHasOpenSpotPositions,
	getAccountDeletionStepsToTake,
	getAccountCanBeDeletedInstantly,
	getStatsAccountIsPastDeletionCutoff,
	tryDeleteUserAccount,
	getIdleWaitTimeMinutes,
	getStatsAccountDeletionWaitTime,
};
