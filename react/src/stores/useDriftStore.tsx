import { StoreApi, UseBoundStore, create } from 'zustand';
import { produce } from 'immer';
import {
	BigNum,
	BulkAccountLoader,
	DepositRecord,
	DriftClient,
	DriftEnv,
	QUOTE_PRECISION_EXP,
	SpotPosition,
	User,
	UserAccount,
	initialize,
	Event,
	SwapRecord,
} from '@drift-labs/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { RpcEndpoint } from '@drift/common';

// @ts-ignore
import type { WalletContextState } from '@solana/wallet-adapter-react';

// any relevant user data we can keep up to date here
export type UserData = {
	user: User | undefined;
	userAccount: UserAccount | undefined;
	spotPositions: SpotPosition[];
	leverage: number;
	accountId: number | undefined;
};

const DEFAULT_USER_DATA: UserData = {
	user: undefined,
	userAccount: undefined,
	spotPositions: [],
	leverage: 0,
	accountId: undefined,
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

const DEFAULT_SPOT_MARKET_DATA = {
	tvl: BigNum.zero(),
	deposits: BigNum.zero(),
	borrows: BigNum.zero(),
	currentPrice: BigNum.zero(),
	solBorrowCapacityRemaining: BigNum.zero(),
	percentOfCapUsed: 0,
};

export interface CommonDriftStore {
	authority: PublicKey | null | undefined;
	authorityString: string;
	currentlyConnectedWalletContext: WalletContextState | null;
	currentSolBalance: {
		value: BigNum;
		loaded: boolean;
	};
	currentUserAccount: UserData;
	userAccounts: UserAccount[];
	userAccountNotInitialized: boolean | undefined;
	subscribedToSubaccounts: boolean | undefined;
	sdkConfig: ReturnType<typeof initialize> | undefined;
	currentRpc: RpcEndpoint | undefined;
	connection: Connection | undefined;
	env: {
		driftEnv: DriftEnv;
		historyServerUrl: string;
		basePollingRateMs: number;
		rpcOverride: string | undefined;
		// nextEnv?: string;
		isDev?: boolean;
	};
	driftEnv: DriftEnv;
	driftClient: {
		client?: DriftClient;
		updateSignaler: any;
		isSubscribed: boolean;
	};
	bulkAccountLoader: BulkAccountLoader | undefined;
	spotMarketData: SpotMarketData;
	emulationMode: boolean;
	isGeoblocked: boolean | undefined;
	set: (x: (s: CommonDriftStore) => void) => void;
	get: () => CommonDriftStore;
	clearUserData: () => void;
	eventRecords: {
		mostRecentTx: string | undefined;
		depositRecords: Event<DepositRecord>[];
		swapRecords: Event<SwapRecord>[];
	};
}

const defaultState = {
	authority: undefined,
	authorityString: '',
	currentSolBalance: DEFAULT_SOL_BALANCE,
	currentlyConnectedWalletContext: null,
	currentUserAccount: DEFAULT_USER_DATA,
	userAccounts: [],
	userAccountNotInitialized: undefined,
	subscribedToSubaccounts: undefined,
	sdkConfig: undefined,
	currentRpc: undefined,
	connection: undefined,
	driftClient: {
		client: undefined,
		updateSignaler: {},
		isSubscribed: false,
	},
	bulkAccountLoader: undefined,
	isGeoblocked: undefined,
	spotMarketData: DEFAULT_SPOT_MARKET_DATA,
	emulationMode: false,
	eventRecords: {
		mostRecentTx: undefined,
		depositRecords: [],
		swapRecords: [],
	},
};

let useCommonDriftStore: UseBoundStore<StoreApi<CommonDriftStore>>;

const initializeDriftStore = (Env: {
	driftEnv: DriftEnv;
	historyServerUrl: string;
	basePollingRateMs: number;
	rpcOverride: string | undefined;
	// nextEnv?: string;
	isDev?: boolean;
}) => {
	if (!useCommonDriftStore) {
		useCommonDriftStore = create<CommonDriftStore>()((set, get) => {
			const setProducerFn = (fn: (s: CommonDriftStore) => void) =>
				set(produce(fn));
			return {
				...defaultState,
				driftEnv: Env.driftEnv,
				env: Env,
				set: setProducerFn,
				get: () => get(),
				clearUserData: () => {
					setProducerFn((s) => {
						s.authority = undefined;
						s.authorityString = '';
						s.currentSolBalance = DEFAULT_SOL_BALANCE;
						s.currentlyConnectedWalletContext = null;
						s.currentUserAccount = DEFAULT_USER_DATA;
						s.userAccounts = [];
						s.userAccountNotInitialized = undefined;
						s.subscribedToSubaccounts = undefined;
						s.eventRecords = {
							depositRecords: [],
							swapRecords: [],
							mostRecentTx: undefined,
						};
					});
				},
			};
		});
	}
};

export { initializeDriftStore, useCommonDriftStore };
