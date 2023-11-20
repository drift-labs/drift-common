import {
	// useDlobStore,
	DlobListeningSelection,
} from '../../stores/useDlobStore';
import { useSyncBlockchainDlob } from './useSyncBlockchainDlob';
import { useSyncOrderbookDisplayState } from './useSyncOrderbookDisplayState';
import { useSyncBackgroundDlobWithServerPolling } from './useSyncBackgroundDlobWithServerPolling';
import { useSyncBackgroundDlobWithServerWebsocket } from './useSyncBackgroundDlobWithServerWebsocket';
import { useEffect } from 'react';
import {
	BulkAccountLoader,
	DriftClient,
	OrderSubscriber,
} from '@drift-labs/sdk';
import { MarketId, UIMarket } from '@drift/common';
import { Connection, PublicKey } from '@solana/web3.js';
import {
	GroupingSizeSelectionState,
	MarketDlobLiquidityCategorisation,
	SubscriberType,
} from '../../types';
import { Subscription } from 'rxjs';

/**
 * Runs all of the utility hooks to keep the dlob state in sync
 */
export const useSyncDlobState = ({
	marketsToTrack,
	subscriberType,
	dlobLevelsToTrack,
	allSupportedUIMarket,
	phoenixProgramId,
	serumProgramId,
	currentSlot,
	orderSubscriber,
	dlobServerL2Url,
	dlobServerBatchL2Url,
	isVammEnabled,
	isDlobEnabled,
	orderbookDlobPollInterval,
	blockchainDlobPollInterval,
	backgroundDlobPollInterval,
	orderbookGroupingSize,
	currentMarketId,
	websocketSubscribe,
	driftClient,
	driftClientIsReady,
	dlobListeningSelection,
	connection,
	bulkAccountLoader,
}: {
	marketsToTrack: MarketDlobLiquidityCategorisation;
	subscriberType: SubscriberType;
	dlobLevelsToTrack: (keyof MarketDlobLiquidityCategorisation)[];
	allSupportedUIMarket: UIMarket[];
	phoenixProgramId: PublicKey;
	serumProgramId: PublicKey;
	currentSlot: number;
	orderSubscriber: OrderSubscriber;
	dlobServerL2Url: string;
	dlobServerBatchL2Url: string;
	isVammEnabled?: boolean;
	isDlobEnabled?: boolean;
	orderbookDlobPollInterval: number;
	blockchainDlobPollInterval: number;
	backgroundDlobPollInterval: number;
	orderbookGroupingSize: GroupingSizeSelectionState;
	currentMarketId: MarketId;
	websocketSubscribe: (
		topicKey: string,
		subscribeProps: {
			onSubMessage: () => any; // Return the message to send when subscribing to a websocket
			onUnSubMessage: () => any; // Return the message to send when unsubscribing from a websocket
			messageFilter: (message: any) => boolean; // Filter messages for this particular subscription
			onMessageCallback: (message: any) => void; // Callback to handle the messages from the webhook subscription
			onErrorCallback: () => void;
		}
	) => Subscription;
	driftClient: DriftClient; // TODO: use common drift store if possible; currently not implemented that way because main UI has not integrated common drift store
	driftClientIsReady: boolean;
	dlobListeningSelection: DlobListeningSelection;
	connection: Connection;
	bulkAccountLoader: BulkAccountLoader;
}) => {
	// const dlobStore = useDlobStore();
	// const dlobListeningSelection = dlobStore.listeningSelection;

	useEffect(() => {
		console.log(`SYNCING DLOB USING : ${dlobListeningSelection}`);
	}, [dlobListeningSelection]);

	useSyncBlockchainDlob({
		enabled: dlobListeningSelection === DlobListeningSelection.BLOCKCHAIN,
		tickInterval: blockchainDlobPollInterval,
		marketsToTrack,
		subscriberType,
		dlobLevelsToTrack,
		allSupportedUIMarket,
		phoenixProgramId,
		serumProgramId,
		currentSlot,
		orderSubscriber,
		driftClient,
		driftClientIsReady,
		connection,
		bulkAccountLoader,
	});
	useSyncBackgroundDlobWithServerPolling({
		enabled:
			dlobListeningSelection === DlobListeningSelection.DLOB_SERVER_POLLING,
		dlobServerBatchL2Url,
		marketsToTrack,
		tickInterval: backgroundDlobPollInterval,
		driftClient,
		driftClientIsReady,
	});
	useSyncBackgroundDlobWithServerWebsocket({
		enabled:
			dlobListeningSelection === DlobListeningSelection.DLOB_SERVER_WEBSOCKET,
		marketsToTrack,
		websocketSubscribe,
	});

	useSyncOrderbookDisplayState({
		tickInterval: orderbookDlobPollInterval,
		isVammEnabled,
		isDlobEnabled,
		marketsToTrack,
		dlobServerL2Url,
		orderbookGroupingSize,
		currentMarketId,
		driftClient,
		driftClientIsReady,
	});
};
