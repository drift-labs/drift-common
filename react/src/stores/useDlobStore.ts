import {
	L2OrderBook,
	MarketType,
	PhoenixSubscriber,
	SerumSubscriber,
} from '@drift-labs/sdk';
import { produce } from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MarketId } from '@drift/common';

export enum DlobListeningSelection {
	DLOB_SERVER_WEBSOCKET = 'DLOB_SERVER_WEBSOCKET',
	DLOB_SERVER_POLLING = 'DLOB_SERVER_POLLING',
	BLOCKCHAIN = 'BLOCKCHAIN',
}
export type L2OrderBookForMarket = L2OrderBook & {
	marketIndex: number | undefined;
	marketType: MarketType;
};

export interface DlobStore {
	set: (x: (s: DlobStore) => void) => void;
	get: () => DlobStore;
	listeningSelection: DlobListeningSelection;
	blockchainDlobState: {
		perp: {
			[marketIndex: number]: L2OrderBook;
		};
		spot: {
			[marketIndex: number]: L2OrderBook;
		};
	};
	dlobServerDlobState: {
		perp: {
			[marketIndex: number]: L2OrderBook;
		};
		spot: {
			[marketIndex: number]: L2OrderBook;
		};
	};
	dlobServerOracleState: {
		perp: {
			[marketIndex: number]: {
				price: number;
			};
		};
		spot: {
			[marketIndex: number]: {
				price: number;
			};
		};
	};
	orderbookDisplayL2State: L2OrderBookForMarket;
	getDlobStateForMarket: (marketId: MarketId) => L2OrderBook;
	phoenixEnabled: boolean;
	serumEnabled: boolean;
	phoenixSubscribers: {
		[marketKey: string]: PhoenixSubscriber;
	};
	serumSubscribers: {
		[marketKey: string]: SerumSubscriber;
	};
	getPhoenixSubscriberForMarket: (marketId: MarketId) => PhoenixSubscriber;
	getSerumSubscriberForMarket: (marketId: MarketId) => SerumSubscriber;
	getDlobServerOraclePriceForMarket: (marketId: MarketId) => number;
	setListeningSelection: (newSelection: DlobListeningSelection) => void;
}

export const useDlobStore = create(
	devtools<DlobStore>((set, get): DlobStore => {
		const setState = (fn: (s: DlobStore) => void) => set(produce(fn));

		const DEFAULT_DLOB_LISTENING_SELECTION =
			DlobListeningSelection.DLOB_SERVER_POLLING;
		// TODO: think of way to make this dynamic, currently Config.sdkConfig returns undefined
		// const DEFAULT_DLOB_LISTENING_SELECTION =
		// 	Config.sdkConfig.ENV === 'devnet'
		// 		? DlobListeningSelection.DLOB_SERVER_WEBSOCKET
		// 		: DlobListeningSelection.DLOB_SERVER_POLLING;

		console.log(
			`USING DEFAULT_DLOB_LISTENING_SELECTION:${DEFAULT_DLOB_LISTENING_SELECTION}`
		);

		return {
			set: setState,
			get: () => get(),
			// Should default to the DLOB_SERVER .. A hook ensures that we switch to blockchain listening if the dlob server is unhealthy
			listeningSelection: DEFAULT_DLOB_LISTENING_SELECTION,
			blockchainDlobState: {
				perp: {},
				spot: {},
			},
			dlobServerDlobState: {
				perp: {},
				spot: {},
			},
			dlobServerOracleState: {
				perp: {},
				spot: {},
			},
			orderbookDisplayL2State: {
				bids: [],
				asks: [],
				marketIndex: undefined,
				marketType: MarketType.PERP,
			},
			getDlobStateForMarket: (marketId: MarketId) => {
				const dlobState =
					get().listeningSelection === DlobListeningSelection.BLOCKCHAIN
						? get().blockchainDlobState
						: get().dlobServerDlobState;
				const marketLookup = marketId.isPerp ? dlobState.perp : dlobState.spot;
				const dlobStateForMarket = marketLookup[marketId.marketIndex];

				if (!dlobStateForMarket) {
					return {
						bids: [],
						asks: [],
					} as L2OrderBook;
				}

				return dlobStateForMarket;
			},
			getDlobServerOraclePriceForMarket: (marketId: MarketId) => {
				const oracleState = get().dlobServerOracleState;

				return (
					(marketId.isPerp ? oracleState.perp : oracleState.spot)?.[
						marketId.marketIndex
					]?.price ?? 0
				);
			},
			phoenixSubscribers: {},
			serumSubscribers: {},
			getPhoenixSubscriberForMarket: (marketId: MarketId) => {
				const phoenixSubscribers = get().phoenixSubscribers;
				const marketKey = marketId.key;
				return phoenixSubscribers[marketKey];
			},
			getSerumSubscriberForMarket: (marketId: MarketId) => {
				const serumSubscribers = get().serumSubscribers;
				const marketKey = marketId.key;
				return serumSubscribers[marketKey];
			},
			phoenixEnabled: true,
			serumEnabled: true,
			setListeningSelection: (
				newListeningSelection: DlobListeningSelection
			) => {
				console.log(`UPDATING DLOB SELECTION TO : ${newListeningSelection}`);
				setState((s) => {
					s.listeningSelection = newListeningSelection;
				});
			},
		};
	})
);
