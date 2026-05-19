import {
	VelocityClient,
	PublicKey,
	User,
	UserAccount,
} from '@velocity-exchange/sdk';
import { sleep } from '../core/async';

// When creating an account, try 5 times over 5 seconds to wait for the new account to hit the blockchain.
const ACCOUNT_INITIALIZATION_RETRY_DELAY_MS = 1000;
const ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS = 5;

const awaitAccountInitializationChainState = async (
	velocityClient: VelocityClient,
	userId: number,
	authority: PublicKey
) => {
	const user = velocityClient.getUser(userId, authority);

	if (!user.isSubscribed) {
		await user.subscribe();
	}

	let retryCount = 0;

	do {
		try {
			await updateUserAccount(user);
			if (user?.getUserAccountAndSlot()?.data !== undefined) {
				return true;
			}
		} catch (err) {
			retryCount++;
			await sleep(ACCOUNT_INITIALIZATION_RETRY_DELAY_MS);
		}
	} while (retryCount < ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS);

	throw new Error('awaitAccountInitializationFailed');
};

/**
 * Using your own callback to do the account initialization, this method will run the initialization step, switch to the velocity user, await for the account to be available on chain, subscribe to the user account, and switch to the user account using the velocity client.
 *
 * It provides extra callbacks to handle steps directly after the initialiation tx, and after fully initializing+subscribing to the account.
 *
 * Callbacks available:
 * - initializationStep: This callback should send the transaction to initialize the user account
 * - postInitializationStep: This callback will run after the successful initialization transaction, but before trying to load/subscribe to the new account
 * - handleSuccessStep: This callback will run after everything has initialized+subscribed successfully
 *
 * // TODO : Need to do the subscription step
 */
const initializeAndSubscribeToNewUserAccount = async (
	velocityClient: VelocityClient,
	userIdToInit: number,
	authority: PublicKey,
	callbacks: {
		initializationStep: () => Promise<boolean>;
		postInitializationStep?: () => Promise<boolean>;
		handleSuccessStep?: (accountAlreadyExisted: boolean) => Promise<boolean>;
	}
): Promise<
	| 'ok'
	| 'failed_initializationStep'
	| 'failed_postInitializationStep'
	| 'failed_awaitAccountInitializationChainState'
	| 'failed_handleSuccessStep'
> => {
	await velocityClient.addUser(userIdToInit, authority);

	const accountAlreadyExisted = await velocityClient
		.getUser(userIdToInit)
		?.exists();

	// Do the account initialization step
	let result = await callbacks.initializationStep();

	// Fetch account to make sure it's loaded
	await updateUserAccount(velocityClient.getUser(userIdToInit));

	if (!result) {
		return 'failed_initializationStep';
	}

	// Do the post-initialization step
	result = callbacks.postInitializationStep
		? await callbacks.postInitializationStep()
		: result;

	if (!result) {
		return 'failed_postInitializationStep';
	}

	// Await the account initialization step to update the blockchain
	result = await awaitAccountInitializationChainState(
		velocityClient,
		userIdToInit,
		authority
	);

	if (!result) {
		return 'failed_awaitAccountInitializationChainState';
	}

	await velocityClient.switchActiveUser(userIdToInit, authority);

	// Do the subscription step

	// Run the success handler
	result = callbacks.handleSuccessStep
		? await callbacks.handleSuccessStep(accountAlreadyExisted)
		: result;

	if (!result) {
		return 'failed_handleSuccessStep';
	}

	return 'ok';
};

async function updateUserAccount(user: User): Promise<void> {
	const publicKey = user.userAccountPublicKey;
	try {
		// TODO: cast to any to avoid "Type instantiation is excessively deep and possibly infinite." error from Anchor's generic types against the Velocity IDL. Fix once SDK is stable.
		const program = user.driftClient.program as any;
		const dataAndContext = await program.account.user.fetchAndContext(
			publicKey,
			'processed'
		);
		user.accountSubscriber.updateData(
			dataAndContext.data as UserAccount,
			dataAndContext.context.slot
		);
	} catch (e) {
		// noop
	}
}

export {
	ACCOUNT_INITIALIZATION_RETRY_DELAY_MS,
	ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS,
	awaitAccountInitializationChainState,
	initializeAndSubscribeToNewUserAccount,
};
