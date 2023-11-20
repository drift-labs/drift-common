import { useSyncDisplayDlobWithServerPolling } from './useSyncDisplayDlobWithServerPolling';
import { MarketId } from '@drift/common';
import { DlobListeningSelection, useDlobStore } from '../../stores';
import { useIntervalWithInitialCallback } from '../useIntervalWithInitialCallback';
import {
	GroupingSizeSelectionState,
	MarketDlobLiquidityCategorisation,
} from '../../types';
import { DriftClient } from '@drift-labs/sdk';

const ORDERBOOK_DISPLAY_POLLING_INTERVAL = 1000;

/**
 * A hook which keeps DLOB state in sync for the orderbook display component. Depending on the DLOB synching settings (server vs on-chain listening) will sync differently.
 */
export const useSyncOrderbookDisplayState = ({
	isVammEnabled = true,
	isDlobEnabled = true,
	marketsToTrack,
	tickInterval = ORDERBOOK_DISPLAY_POLLING_INTERVAL,
	dlobServerHttpUrl,
	orderbookGroupingSize,
	currentMarketId,
	driftClient,
	driftClientIsReady,
}: {
	isVammEnabled?: boolean;
	isDlobEnabled?: boolean;
	marketsToTrack: MarketDlobLiquidityCategorisation;
	tickInterval: number;
	dlobServerHttpUrl: string;
	orderbookGroupingSize: GroupingSizeSelectionState;
	currentMarketId: MarketId;
	driftClient: DriftClient;
	driftClientIsReady: boolean;
}) => {
	const listeningSelection = useDlobStore((s) => s.listeningSelection);
	const getDlobStateForMarket = useDlobStore((s) => s.getDlobStateForMarket);
	const setDlobState = useDlobStore((s) => s.set);

	const shouldUseServersidePollingDlob =
		listeningSelection === DlobListeningSelection.DLOB_SERVER_POLLING;

	// If syncing with server side then this hook will handle keeping the state in sync
	useSyncDisplayDlobWithServerPolling({
		enabled: shouldUseServersidePollingDlob,
		isDlobEnabled,
		isVammEnabled,
		marketsToTrack,
		tickInterval,
		dlobServerHttpUrl,
		orderbookGroupingSize,
		driftClient,
		driftClientIsReady,
	});

	// If syncing with blockchain then this hook will make the orderbook state match the state of the current market loaded in from the blockchain each second
	useIntervalWithInitialCallback(() => {
		if (!shouldUseServersidePollingDlob) {
			let l2StateForMarket = getDlobStateForMarket(currentMarketId);

			if (!l2StateForMarket) {
				l2StateForMarket = {
					bids: [],
					asks: [],
				};
			}

			const filteredL2StateForMarket = {
				bids: l2StateForMarket.bids.filter((bid) => {
					if (isVammEnabled && bid.sources.vamm) return bid;
					if (
						(isDlobEnabled && bid.sources.dlob) ||
						bid.sources.phoenix ||
						bid.sources.serum
					)
						return bid;
					return false;
				}),
				asks: l2StateForMarket.asks.filter((ask) => {
					if (isVammEnabled && ask.sources.vamm) return ask;
					if (
						(isDlobEnabled && ask.sources.dlob) ||
						ask.sources.phoenix ||
						ask.sources.serum
					)
						return ask;
					return false;
				}),
				slot: l2StateForMarket.slot,
				marketIndex: currentMarketId.marketIndex,
				marketType: currentMarketId.marketType,
			};

			setDlobState((s) => {
				s.orderbookDisplayL2State = filteredL2StateForMarket;
			});
		}
	}, 1000);
};
