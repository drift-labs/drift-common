import {
	MarketType,
	PhoenixSubscriber,
	PublicKey,
	SpotMarketConfig,
} from '@drift-labs/sdk';
import { useEffect, useRef } from 'react';
import { ENUM_UTILS, MarketId } from '@drift/common';
import { MarketDlobLiquidityCategorisation, SubscriberType } from '../../types';
import { useCommonDriftStore, useDlobStore } from '../../stores';

/**
 * Given a list of markets to track (categorised into DLOB levels), this hook will make sure that the appropriate phoenix subscribers are in the store and subscribed or unsubscribed.
 * @param marketsToTrack
 */
export const useSyncPhoenixSubscriberList = ({
	marketsToTrack,
	supportedSpotMarketConfigs,
	subscriberType,
	phoenixProgramId,
	dlobLevelsToTrack,
	driftClientIsReady,
}: {
	marketsToTrack: Partial<MarketDlobLiquidityCategorisation>;
	supportedSpotMarketConfigs: SpotMarketConfig[];
	phoenixProgramId: PublicKey;
	subscriberType: SubscriberType;
	dlobLevelsToTrack: (keyof MarketDlobLiquidityCategorisation)[];
	driftClientIsReady: boolean;
}) => {
	const connection = useCommonDriftStore((s) => s.connection);
	const bulkAccountLoader = useCommonDriftStore((s) => s.bulkAccountLoader);
	const set = useDlobStore((s) => s.set);
	const previouslySubscribedMarkets = useRef<MarketId[]>([]);
	const getPhoenixSubscriberFromStore = useDlobStore(
		(s) => s.getPhoenixSubscriberForMarket
	);
	const phoenixEnabled = useDlobStore((s) => s.phoenixEnabled);

	const generatePhoenixSubscriber = async (marketIndex: number) => {
		const market = supportedSpotMarketConfigs.find(
			(spotMkt) => spotMkt.marketIndex === marketIndex
		);

		if (!market?.phoenixMarket || !connection || !bulkAccountLoader)
			return undefined;

		try {
			const phoenixSubscriber = new PhoenixSubscriber({
				connection: connection,
				programId: phoenixProgramId,
				marketAddress: market.phoenixMarket,
				accountSubscription: {
					type: subscriberType,
					accountLoader: bulkAccountLoader,
				},
			});
			return phoenixSubscriber;
		} catch (e) {
			console.log('Error setting phoenixSubscriber ', e);
			return undefined;
		}
	};

	const handleSubscribingNewMarket = async (marketId: MarketId) => {
		// Create the phoenix subscriber
		const subscriber = await generatePhoenixSubscriber(marketId.marketIndex);

		if (!subscriber) return;

		// Do the subscription
		await subscriber.subscribe();

		// Add it to the subscriber store
		set((s) => {
			s.phoenixSubscribers[marketId.key] = subscriber;
		});
	};

	const handleUnsubscribingNewMarket = (marketId: MarketId) => {
		const previousSubscriber = getPhoenixSubscriberFromStore(marketId);
		if (!previousSubscriber) return;

		// Unsubscribe the previous subscriber
		previousSubscriber.unsubscribe();

		// Remove it from the store
		set((s) => {
			delete s.phoenixSubscribers[marketId.key];
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
			const marketsWhichShouldBeSubscribed = phoenixEnabled
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
