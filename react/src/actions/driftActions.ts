import { CommonDriftStore } from '../stores/useCommonDriftStore';
import {
	BulkAccountLoader,
	DriftClient,
	DriftClientConfig,
	DriftEnv,
	IWallet,
	PublicKey,
	RetryTxSender,
	Wallet,
	getMarketsAndOraclesForSubscription,
	initialize,
} from '@drift-labs/sdk';
import {
	COMMON_UI_UTILS,
	EnvironmentConstants,
	RpcEndpoint,
} from '@drift/common';
import { Commitment, Connection, Keypair } from '@solana/web3.js';
import { StoreApi } from 'zustand';

import type {
	Adapter,
	BaseMessageSignerWalletAdapter,
	// @ts-ignore
} from '@solana/wallet-adapter-base';

const DEFAULT_WALLET = new Wallet(new Keypair());
const POLLING_FREQUENCY_MS = 1000;
const DEFAULT_COMMITMENT_LEVEL: Commitment = 'confirmed';

const createDriftActions = (
	get: StoreApi<CommonDriftStore>['getState'],
	set: (x: (s: CommonDriftStore) => void) => void
) => {
	const subscribeToDriftClientData = async () => {
		try {
			const driftClient = get().driftClient.client;

			if (!driftClient) {
				return;
			}

			const subscriptionResult = await driftClient.subscribe();

			if (!subscriptionResult) {
				// retry once
				await driftClient.subscribe();
			}

			driftClient.eventEmitter.on('update', () => {
				set((s) => {
					s.driftClient.client = driftClient;
					s.driftClient.updateSignaler = {};
				});
			});

			set((s) => {
				s.driftClient.isSubscribed = subscriptionResult;
			});

			return subscriptionResult;
		} catch (err) {
			// Todo notify about this or retry?
			console.log(err);
		}
	};

	/**
	 * Updates connection AND creates new driftClient instance
	 */
	const updateConnection = async ({
		newRpc,
		newDriftEnv,
	}: {
		newRpc: RpcEndpoint;
		newDriftEnv?: DriftEnv;
		// initializing = false,
		// isRecoveryAttempt = false
	}) => {
		const storeState = get();
		const Env = storeState.env;
		const driftEnvToUse = newDriftEnv || Env.driftEnv;
		const sdkConfig = initialize({ env: driftEnvToUse });
		let rpcToUse = newRpc?.value;

		// Override rpc with one set from env variable
		if (Env.rpcOverride) {
			console.log(`overriding selected rpc with ${rpcToUse}`);
			rpcToUse = Env.rpcOverride;
		}

		let newConnection: Connection;
		try {
			newConnection = new Connection(rpcToUse, DEFAULT_COMMITMENT_LEVEL);
		} catch (e) {
			console.error('error connecting to rpc');

			// TODO -- decide how we want to handle notifications?
			// NOTIFICATION_UTILS.toast.warn(
			// 	'Error connecting to RPC. If the problem persists you may need to try restarting.'
			// );

			return;
		}

		const currentDriftClient = storeState.driftClient.client;
		if (currentDriftClient) {
			await currentDriftClient.unsubscribe();
		}

		const accountLoader = new BulkAccountLoader(
			newConnection,
			DEFAULT_COMMITMENT_LEVEL,
			POLLING_FREQUENCY_MS
		);

		const { oracleInfos, perpMarketIndexes, spotMarketIndexes } =
			getMarketsAndOraclesForSubscription(driftEnvToUse);

		const driftClientConfig: DriftClientConfig = {
			connection: newConnection,
			wallet: DEFAULT_WALLET,
			programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
			accountSubscription: {
				type: 'polling',
				accountLoader: accountLoader,
			},
			perpMarketIndexes: perpMarketIndexes,
			spotMarketIndexes: spotMarketIndexes,
			oracleInfos: oracleInfos,
			userStats: true,
			includeDelegates: true,
			env: driftEnvToUse,
			// dont waste rpc calls loading users for this made up wallet
			skipLoadUsers: true,
			txVersion: 0,
		};

		const newDriftClient = new DriftClient(driftClientConfig);

		const rpcs =
			EnvironmentConstants.rpcs[driftEnvToUse === 'devnet' ? 'dev' : 'mainnet'];

		const additionalConnections = rpcs
			.filter(
				(rpc) => rpc.value !== newRpc?.value && rpc.allowAdditionalConnection
			)
			.map((rpc) => new Connection(rpc.value, DEFAULT_COMMITMENT_LEVEL));

		newDriftClient.txSender = new RetryTxSender({
			connection: newConnection,
			additionalConnections,
			wallet: DEFAULT_WALLET,
		});

		set((s) => {
			s.bulkAccountLoader = accountLoader;
			s.connection = newConnection;
			s.driftClient.client = newDriftClient;
			s.env.driftEnv = driftEnvToUse;
			// s.currentRpc = newRpc;
			s.sdkConfig = sdkConfig;
		});

		await subscribeToDriftClientData();
	};

	/*
	 * Fetches user accounts and users for authority and subscribes to them
	 */
	const fetchAndSubscribeToUsersAndSubaccounts = async (
		driftClient: DriftClient,
		authority: PublicKey
	) => {
		// This method seems pretty slow, is there a better way?
		// Nothing else I've tried is working...
		const userAccounts = await driftClient.getUserAccountsForAuthority(
			authority
		);

		await Promise.all(
			userAccounts.map((account) =>
				driftClient.addUser(account.subAccountId, authority)
			)
		);

		const users = driftClient.getUsers();

		set((s) => {
			s.authority = authority;
			s.userAccountNotInitialized = users.length === 0;
			s.subscribedToSubaccounts = true;
			s.userAccounts = userAccounts;
		});

		return userAccounts;
	};

	const handleWalletDisconnect = async () => {
		const state = get();

		const driftClient = state.driftClient.client;

		if (driftClient) {
			// Switch to a random wallet to stop
			driftClient.updateWallet(new Wallet(new Keypair()));

			COMMON_UI_UTILS.unsubscribeUsersInDriftClient(driftClient);
		}

		state.clearUserData();
	};

	const handleWalletConnect = async (
		authority: PublicKey,
		adapter: Adapter
	) => {
		console.log('handleWalletConnect');
		const state = get();
		state.clearUserData();
		const driftClient = state?.driftClient?.client;

		if (!driftClient) return;

		try {
			driftClient.updateWallet(adapter as IWallet);
			const userAccounts = await fetchAndSubscribeToUsersAndSubaccounts(
				driftClient,
				authority
			);
			if (userAccounts.length > 0) {
				driftClient.switchActiveUser(userAccounts[0].subAccountId);
			}

			set((s) => {
				s.authority = authority;
				s.subscribedToSubaccounts = true;
			});
		} catch (err) {
			console.log('failed to subscribe to users');
			console.log(err);
			set((s) => {
				s.subscribedToSubaccounts = false;
			});
		}
	};

	const emulateAccount = async (props: { authority: PublicKey }) => {
		const state = get();
		const driftClient = state?.driftClient?.client;
		if (!driftClient) return;

		const newKeypair = new Keypair({
			publicKey: props.authority.toBytes(),
			secretKey: new Keypair().publicKey.toBytes(),
		});
		const newWallet: BaseMessageSignerWalletAdapter = {
			publicKey: newKeypair.publicKey,
			autoApprove: false,
			connected: true,
			//@ts-ignore
			signTransaction: () => {
				return Promise.resolve();
			},
			//@ts-ignore
			signAllTransactions: () => {
				return Promise.resolve();
			},
			//@ts-ignore
			connect: () => {},
			disconnect: async () => {},
			//@ts-ignore
			on: (_event: string, _fn: () => void) => {},
		};

		const success = await driftClient.updateWallet(newWallet as IWallet);
		if (!success) {
			console.log('Error emulating account');
			return;
		}

		const subscribeSuccess = await driftClient.subscribe();
		if (!subscribeSuccess) {
			console.log('Error subscribing to emulated account');
			return;
		}

		const userAccounts = await fetchAndSubscribeToUsersAndSubaccounts(
			driftClient,
			props.authority
		);
		if (userAccounts.length > 0) {
			driftClient.switchActiveUser(userAccounts[0].subAccountId);
		}
		set((s) => {
			s.emulationMode = true;
		});
	};

	return {
		handleWalletConnect,
		updateConnection,
		emulateAccount,
		handleWalletDisconnect,
	};
};

export default createDriftActions;
