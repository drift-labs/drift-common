import {
	// useDlobStore,
	DlobListeningSelection,
} from '../../stores/useDlobStore';
import { useSyncBlockchainDlob } from './useSyncBlockchainDlob';
import { useSyncOrderbookDisplayState } from './useSyncOrderbookDisplayState';
import { useSyncBackgroundDlobWithServerPolling } from './useSyncBackgroundDlobWithServerPolling';
import { useSyncBackgroundDlobWithServerWebsocket } from './useSyncBackgroundDlobWithServerWebsocket';
import { useEffect } from 'react';
import { DriftClient, OrderSubscriber } from '@drift-labs/sdk';
import { MarketId, UIMarket } from '@drift/common';
import { PublicKey } from '@solana/web3.js';
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
	dlobServerHttpUrl,
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
}: {
	marketsToTrack: MarketDlobLiquidityCategorisation;
	subscriberType: SubscriberType;
	dlobLevelsToTrack: (keyof MarketDlobLiquidityCategorisation)[];
	allSupportedUIMarket: UIMarket[];
	phoenixProgramId: PublicKey;
	serumProgramId: PublicKey;
	currentSlot: number;
	orderSubscriber: OrderSubscriber;
	dlobServerHttpUrl: string;
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
		driftClientIsReady,
	});
	useSyncBackgroundDlobWithServerPolling({
		enabled:
			dlobListeningSelection === DlobListeningSelection.DLOB_SERVER_POLLING,
		dlobServerHttpUrl,
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
		dlobServerHttpUrl,
		orderbookGroupingSize,
		currentMarketId,
		driftClient,
		driftClientIsReady,
	});
};
