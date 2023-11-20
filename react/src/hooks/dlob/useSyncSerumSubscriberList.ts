import {
	BulkAccountLoader,
	MarketType,
	PublicKey,
	SerumSubscriber,
	SpotMarketConfig,
} from '@drift-labs/sdk';
import { useEffect, useRef } from 'react';
import { ENUM_UTILS, MarketId } from '@drift/common';
import { useDlobStore } from '../../stores';
import { MarketDlobLiquidityCategorisation, SubscriberType } from '../../types';
import { Connection } from '@solana/web3.js';

/**
 * Given a list of markets to track (categorised into DLOB levels), this hook will ensure that the
 * appropriate serum subscribers are in the store and subscribed or unsubscribed.
 * @param marketsToTrack
 */
export const useSyncSerumSubscriberList = ({
	marketsToTrack,
	supportedSpotMarketConfigs,
	serumProgramId,
	subscriberType,
	dlobLevelsToTrack,
	driftClientIsReady,
	connection,
	bulkAccountLoader,
}: {
	marketsToTrack: Partial<MarketDlobLiquidityCategorisation>;
	supportedSpotMarketConfigs: SpotMarketConfig[];
	serumProgramId: PublicKey;
	subscriberType: SubscriberType;
	dlobLevelsToTrack: (keyof MarketDlobLiquidityCategorisation)[];
	driftClientIsReady: boolean;
	connection: Connection;
	bulkAccountLoader: BulkAccountLoader;
}) => {
	const set = useDlobStore((s) => s.set);
	const previouslySubscribedMarkets = useRef<MarketId[]>([]);
	const getSerumSubscriberFromStore = useDlobStore(
		(s) => s.getSerumSubscriberForMarket
	);
	const serumEnabled = useDlobStore((s) => s.serumEnabled);

	const generateSerumSubscriber = async (marketIndex: number) => {
		const market = supportedSpotMarketConfigs.find(
			(spotMkt) => spotMkt.marketIndex === marketIndex
		);

		if (!market?.serumMarket || !connection || !bulkAccountLoader) {
			return undefined;
		}

		try {
			const serumSubscriber = new SerumSubscriber({
				connection: connection,
				programId: serumProgramId,
				marketAddress: market.serumMarket,
				accountSubscription: {
					type: subscriberType,
					accountLoader: bulkAccountLoader,
				},
			});
			return serumSubscriber;
		} catch (e) {
			console.log('Error setting serumSubscriber ', e);
			return undefined;
		}
	};

	const handleSubscribingNewMarket = async (marketId: MarketId) => {
		// Create the serum subscriber
		const subscriber = await generateSerumSubscriber(marketId.marketIndex);

		if (!subscriber) return;

		// Do the subscription
		await subscriber.subscribe();

		// Add it to the subscriber store
		set((s) => {
			s.serumSubscribers[marketId.key] = subscriber;
		});
	};

	const handleUnsubscribingNewMarket = (marketId: MarketId) => {
		const previousSubscriber = getSerumSubscriberFromStore(marketId);
		if (!previousSubscriber) return;

		// Unsubscribe the previous subscriber
		previousSubscriber.unsubscribe();

		// Remove it from the store
		set((s) => {
			delete s.serumSubscribers[marketId.key];
		});
	};

	const isPreviouslySubscribed = (marketId: MarketId) => {
		// Note : This only works assuming that we're only ever subsccribing to SPOT markets
		return previouslySubscribedMarkets.current.find(
			(market) => market.marketIndex === marketId.marketIndex
		);
	};

	useEffect(() => {
		if (!driftClientIsReady) return;

		(async () => {
			const marketsWhichShouldBeSubscribed = serumEnabled
				? Object.entries(marketsToTrack)
						.filter(([key]) => {
							return dlobLevelsToTrack.includes(
								key as keyof MarketDlobLiquidityCategorisation
							);
						})
						.map(([_key, val]) => val)
						.flat()
						.filter((mkt) => ENUM_UTILS.match(mkt.marketType, MarketType.SPOT))
				: [];

			// Want to find markets to unsubscrbe from .. these are the markets which ARE previously subscribed but not in the list of expected subscribed markets
			const marketsToUnsubscribe = previouslySubscribedMarkets.current.filter(
				(mkt) =>
					!marketsWhichShouldBeSubscribed.find(
						(mktToBeSubscribed) =>
							mktToBeSubscribed.marketIndex === mkt.marketIndex
					)
			);

			// Want to find markets to newly subscribe to
			const marketsToNewlySubscribe = marketsWhichShouldBeSubscribed.filter(
				(mkt) => !isPreviouslySubscribed(mkt)
			);

			marketsToUnsubscribe.forEach(handleUnsubscribingNewMarket);
			marketsToNewlySubscribe.forEach(handleSubscribingNewMarket);
		})();
	}, [driftClientIsReady, marketsToTrack]);
};
