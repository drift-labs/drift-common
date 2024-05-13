import { StoreApi, UseBoundStore, create } from 'zustand';
import { produce } from 'immer';
import {
	BigNum,
	BulkAccountLoader,
	DriftClient,
	DriftEnv,
	QUOTE_PRECISION_EXP,
	SpotPosition,
	User,
	UserAccount,
	initialize,
} from '@drift-labs/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

// @ts-ignore
import type { WalletContextState } from '@solana/wallet-adapter-react';
import createDriftActions from '../actions/driftActions';

// any relevant user data we can keep up to date here
export type UserData = {
	user: User | undefined;
	userAccount: UserAccount | undefined;
	spotPositions: SpotPosition[];
	leverage: number;
	accountId: number | undefined;
};

const DEFAULT_SOL_BALANCE = {
	value: BigNum.zero(QUOTE_PRECISION_EXP),
	loaded: false,
};

export type SpotMarketData = {
	tvl: BigNum;
	deposits: BigNum;
	borrows: BigNum;
	currentPrice: BigNum;
	solBorrowCapacityRemaining: BigNum;
	percentOfCapUsed: number;
};
export interface CommonDriftStore {
	authority: PublicKey | null | undefined;
	authorityString: string;
	currentlyConnectedWalletContext: WalletContextState | null;
	currentSolBalance: {
		value: BigNum;
		loaded: boolean;
	};
	connection: Connection | undefined;
	env: {
		driftEnv: DriftEnv;
		historyServerUrl: string;
		basePollingRateMs: number;
		priorityFeePollingMultiplier: number;
		rpcOverride: string | undefined;
		isDev?: boolean;
		subscribeToAccounts?: boolean;
	};
	sdkConfig: ReturnType<typeof initialize> | undefined;
	driftClient: {
		client?: DriftClient;
		updateSignaler: any;
		isSubscribed: boolean;
	};
	checkIsDriftClientReady: () => boolean;
	subscribedToSubaccounts: boolean | undefined;
	isGeoBlocked: boolean;
	emulationMode: boolean;
	pollingMultiplier: number;
	bulkAccountLoader: BulkAccountLoader | undefined;
	userAccounts: UserAccount[];
	userAccountNotInitialized: boolean | undefined;
	set: (x: (s: CommonDriftStore) => void) => void;
	get: () => CommonDriftStore;
	clearUserData: () => void;
	actions: ReturnType<typeof createDriftActions>;
}

const defaultState = {
	authority: undefined,
	authorityString: '',
	currentlyConnectedWalletContext: null,
	currentSolBalance: DEFAULT_SOL_BALANCE,
	connection: undefined,
	sdkConfig: undefined,
	driftClient: {
		client: undefined,
		updateSignaler: {},
		isSubscribed: false,
	},
	subscribedToSubaccounts: undefined,
	isGeoBlocked: false,
	emulationMode: false,
	pollingMultiplier: 1,
	bulkAccountLoader: undefined,
	userAccounts: [],
	userAccountNotInitialized: undefined,
};

let useCommonDriftStore: UseBoundStore<StoreApi<CommonDriftStore>>;

const initializeDriftStore = (Env: {
	driftEnv: DriftEnv;
	historyServerUrl: string;
	basePollingRateMs: number;
	rpcOverride: string | undefined;
	priorityFeePollingMultiplier: number;
	isDev?: boolean;
}) => {
	if (!useCommonDriftStore) {
		useCommonDriftStore = create<CommonDriftStore>()((set, get) => {
			const setProducerFn = (fn: (s: CommonDriftStore) => void) =>
				set(produce(fn));

			const actions = createDriftActions(get, setProducerFn);

			return {
				...defaultState,
				env: Env,
				set: setProducerFn,
				get: () => get(),
				checkIsDriftClientReady: () => {
					const driftClient = get().driftClient;
					return (
						!!driftClient.client &&
						driftClient.client.isSubscribed &&
						driftClient.isSubscribed
					);
				},
				clearUserData: () => {
					setProducerFn((s) => {
						s.authority = undefined;
						s.authorityString = '';
						s.currentSolBalance = DEFAULT_SOL_BALANCE;
						s.currentlyConnectedWalletContext = null;
						s.userAccounts = [];
						s.userAccountNotInitialized = undefined;
					});
				},
				actions,
			};
		});
	}
};

export { initializeDriftStore, useCommonDriftStore };
