import {
	DriftClient,
	IWallet,
	MarketType,
	PublicKey,
	User,
	UserAccount,
} from '@drift-labs/sdk';
import { ENUM_UTILS, sleep } from '../utils';
import { Keypair } from '@solana/web3.js';
import bcrypt from 'bcryptjs-react';
import crypto from 'crypto';
import * as ed from '@noble/ed25519';

// When creating an account, try 5 times over 5 seconds to wait for the new account to hit the blockchain.
const ACCOUNT_INITIALIZATION_RETRY_DELAY_MS = 1000;
const ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS = 5;

/**
 * Get a unique key for an authority's subaccount
 * @param userId
 * @param authority
 * @returns
 */
const getUserKey = (userId: number, authority: PublicKey) => {
	if (userId == undefined || !authority) return '';
	return `${userId}_${authority.toString()}`;
};

const fetchCurrentSubaccounts = (driftClient: DriftClient): UserAccount[] => {
	return driftClient.getUsers().map((user) => user.getUserAccount());
};

const fetchUserClientsAndAccounts = async (
	driftClient: DriftClient
): Promise<{ user: User; userAccount: UserAccount }[]> => {
	const accounts = fetchCurrentSubaccounts(driftClient);
	const allUsersAndUserAccounts = accounts.map((acct) => {
		return {
			user: driftClient.getUser(acct.subAccountId, acct.authority),
			userAccount: acct,
		};
	});

	return allUsersAndUserAccounts;
};

const awaitAccountInitializationChainState = async (
	driftClient: DriftClient,
	userId: number,
	authority: PublicKey
) => {
	const user = driftClient.getUser(userId, authority);
	if (user && user.getUserAccountAndSlot() !== undefined) {
		return true;
	}

	let retryCount = 0;

	while (retryCount < ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS) {
		await user.fetchAccounts();
		if (user.getUserAccountAndSlot() !== undefined) {
			return true;
		}
		retryCount++;
		await sleep(ACCOUNT_INITIALIZATION_RETRY_DELAY_MS);
	}

	throw new Error('awaitAccountInitializationFailed');
};

/**
 * Using your own callback to do the account initialization, this method will run the initialization step, switch to the drift user, await for the account to be available on chain, subscribe to the user account, and switch to the user account using the drift client.
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
	driftClient: DriftClient,
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
	await driftClient.addUser(userIdToInit, authority);

	const accountAlreadyExisted = await driftClient
		.getUser(userIdToInit)
		?.exists();

	// Do the account initialization step
	let result = await callbacks.initializationStep();

	// Fetch account to make sure it's loaded
	await driftClient.getUser(userIdToInit).fetchAccounts();

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
		driftClient,
		userIdToInit,
		authority
	);

	if (!result) {
		return 'failed_awaitAccountInitializationChainState';
	}

	driftClient.switchActiveUser(userIdToInit, authority);

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

const getMarketKey = (marketIndex: number, marketType: MarketType) =>
	`${ENUM_UTILS.toStr(marketType)}_${marketIndex}`;

const createThrowawayIWallet = (walletPubKey?: PublicKey) => {
	const newKeypair = walletPubKey
		? new Keypair({
				publicKey: walletPubKey.toBytes(),
				secretKey: new Keypair().publicKey.toBytes(),
		  })
		: new Keypair();

	const newWallet: IWallet = {
		publicKey: newKeypair.publicKey,
		//@ts-ignore
		signTransaction: () => {
			return Promise.resolve();
		},
		//@ts-ignore
		signAllTransactions: () => {
			return Promise.resolve();
		},
	};

	return newWallet;
};

const getSignatureVerificationMessageForSettings = (
	authority: PublicKey,
	signTs: number
): Uint8Array => {
	return new TextEncoder().encode(
		`Verify you are the owner of this wallet to update trade settings: \n${authority.toBase58()}\n\nThis signature will be valid for the next 30 minutes.\n\nTS: ${signTs.toString()}`
	);
};

const verifySignature = (
	signature: Uint8Array,
	message: Uint8Array,
	pubKey: PublicKey
): boolean => ed.verify(signature, message, pubKey.toBytes());

const hashSignature = async (signature: string): Promise<string> => {
	bcrypt.setRandomFallback((num: number) => {
		return Array.from(crypto.randomBytes(num));
	});
	const hashedSignature = await bcrypt.hash(signature, bcrypt.genSaltSync(10));
	return hashedSignature;
};

const compareSignatures = async (
	original: string,
	hashed: string
): Promise<boolean> => {
	const signaturesMatch = await bcrypt.compare(original, hashed);
	return signaturesMatch;
};

// --- Export The Utils

export const COMMON_UI_UTILS = {
	getUserKey,
	fetchUserClientsAndAccounts,
	fetchCurrentSubaccounts,
	initializeAndSubscribeToNewUserAccount,
	getMarketKey,
	createThrowawayIWallet,
	getSignatureVerificationMessageForSettings,
	verifySignature,
	hashSignature,
	compareSignatures,
};
