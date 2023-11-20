import { Config, MarketId } from '@drift/common';
import { useEffect, useRef } from 'react';
import { DlobListeningSelection, useDlobStore } from '../../stores';
import {
	L2WithOracle,
	MarketDlobLiquidityCategorisation,
	RawL2Output,
} from '../../types';
import { deserializeL2Response } from '../../utils';
import { Subscription } from 'rxjs';

const getMarketWebsocketChannelKey = (marketId: MarketId) => {
	if (marketId.isPerp) {
		const marketConfig = Config.perpMarketsLookup[marketId.marketIndex];
		return marketConfig.symbol;
	} else {
		const marketConfig = Config.spotMarketsLookup[marketId.marketIndex];
		return marketConfig.symbol;
	}
};

export const useSyncBackgroundDlobWithServerWebsocket = ({
	enabled,
	marketsToTrack,
	websocketSubscribe,
}: {
	enabled: boolean;
	marketsToTrack: MarketDlobLiquidityCategorisation;
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
}) => {
	const deepPriceMarkets = marketsToTrack.DeepPriceData;
	const shallowPriceMarkets = marketsToTrack.ShallowPriceData;

	const setDlobState = useDlobStore((s) => s.set);
	const setDlobListeningSelection = useDlobStore(
		(s) => s.setListeningSelection
	);

	const subscriptions = useRef<Map<string, Subscription>>(new Map());

	const mergeL2Intostore = (marketId: MarketId, data: L2WithOracle) => {
		setDlobState((state) => {
			const key = marketId.isPerp ? 'perp' : 'spot';

			state.dlobServerDlobState[key][marketId.marketIndex] = {
				bids: data.bids,
				asks: data.asks,
			};
		});
	};

	useEffect(() => {
		if (!enabled) return;

		const allMarkets = [...deepPriceMarkets, ...shallowPriceMarkets];

		allMarkets.forEach((marketId) => {
			const marketKey = marketId.key;
			const marketChannelKey = getMarketWebsocketChannelKey(marketId);

			try {
				const marketSubscription = websocketSubscribe(
					`dlob_liquidity_${marketKey}`,
					{
						onSubMessage: () => {
							return { type: 'subscribe', channel: marketChannelKey };
						},
						onUnSubMessage: () => {
							return { type: 'unsubscribe', channel: marketChannelKey };
						},
						onMessageCallback: (message: { channel: string; data: string }) => {
							const deserialized1 = JSON.parse(message.data) as RawL2Output;

							const deserialized2 = deserializeL2Response(deserialized1);

							mergeL2Intostore(marketId, deserialized2);
						},
						messageFilter: (message: { channel: string; data: string }) => {
							return message.channel === marketChannelKey;
						},
						onErrorCallback: () => {
							console.log(
								`CAUGHT ERROR IN WEBSOCKET: SWITCHING FROM DLOB-SERVER WEBSOCKET TO POLLING`
							);
							setDlobListeningSelection(
								DlobListeningSelection.DLOB_SERVER_POLLING
							);
						},
					}
				);

				subscriptions.current.set(marketKey, marketSubscription);
			} catch (e) {
				console.log(
					`CAUGHT ERROR SUBSCRIBING TO WEBSOCKET: SWITCHING FROM DLOB-SERVER WEBSOCKET TO POLLING`
				);
				setDlobListeningSelection(DlobListeningSelection.DLOB_SERVER_POLLING);
			}
		});

		return () => {
			allMarkets.forEach((marketId) => {
				const marketKey = marketId.key;
				const currentSubscription = subscriptions.current.get(marketKey);
				currentSubscription?.unsubscribe();
			});
		};
	}, [enabled]);

	useEffect(() => {
		if (enabled) return;

		subscriptions.current.forEach((value) => {
			value.unsubscribe();
		});
	}, [enabled]);
};
