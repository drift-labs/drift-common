/**
 * This class will handle subscribing to market data from the Drift Data API's websocket.
 *
 * Currently only supports subscribing to candles and to trades.
 *
 * Implemented as a singleton to ensure that we don't have multiple open connections to the same market data feed.
 */

import { CandleResolution } from '@drift-labs/sdk';
import { MarketId, Opaque } from '@drift/common';
import assert from 'assert';
import { v4 as uuidv4 } from 'uuid';

type SubscriptionType = 'candles' | 'trades';

interface ISubscriptionConfig<T extends SubscriptionType> {
	readonly type: T;
	marketId: MarketId;
}
type CandleSubscriptionConfig = ISubscriptionConfig<'candles'> & {
	resolution: CandleResolution;
};
type TradeSubscriptionConfig = ISubscriptionConfig<'trades'>;
type SubscriptionConfig = CandleSubscriptionConfig | TradeSubscriptionConfig;

type SubscriberId = Opaque<string, 'SubscriberId'>;
type SubscriptionId = Opaque<string, 'SubscriptionId'>;

type CandleSubscriptionLookupKey = Opaque<
	string,
	'CandleSubscriptionLookupKey'
>;
type TradeSubscriptionLookupKey = Opaque<string, 'TradeSubscriptionLookupKey'>;

interface Subscriber {
	id: SubscriberId;
	config: SubscriptionConfig;
}

interface Subscription {
	id: SubscriptionId;
	marketId: MarketId;
	resolution: CandleResolution;
	candleSubscribers: SubscriberId[];
	tradeSubscribers: SubscriberId[];
}

function generateSubscriberId(): SubscriberId {
	return uuidv4() as SubscriberId;
}

function generateSubscriptionId(): SubscriptionId {
	return uuidv4() as SubscriptionId;
}

function generateCandleSubscriptionId(
	props: Pick<CandleSubscriptionConfig, 'marketId' | 'resolution'>
): CandleSubscriptionLookupKey {
	return `${props.marketId.key}:${props.resolution}` as CandleSubscriptionLookupKey;
}

function generateTradeSubscriptionId(
	props: Pick<SubscriptionConfig, 'marketId'>
): TradeSubscriptionLookupKey {
	return `${props.marketId.key}` as TradeSubscriptionLookupKey;
}

const DEFAULT_CANDLE_RESOLUTION_FOR_TRADE_SUBSCRIPTIONS: CandleResolution = '1';

export class MarketDataFeed {
	constructor() {}

	// Stores all current subscribers
	private static subscribers = new Map<SubscriberId, Subscriber>();

	// Stores all current subscriptions :: subscribers:subscriptions is N:M (Subscribers may share a subscription but not vice versa)
	private static subscriptions = new Map<SubscriptionId, Subscription>();

	// Lookup table for trade subscriptions
	private static tradeSubscriptionLookup = new Map<
		TradeSubscriptionLookupKey,
		SubscriptionId
	>();

	// Lookup table for candle subscriptions
	private static candleSubscriptionLookup = new Map<
		CandleSubscriptionLookupKey,
		SubscriptionId
	>();

	private static attachNewCandleSubscriberToExistingSubscription(
		subscriberId: SubscriberId,
		config: CandleSubscriptionConfig
	) {
		const candleSubscriptionLookupKey = generateCandleSubscriptionId(config);
		const existingSubscriptionId = this.candleSubscriptionLookup.get(
			candleSubscriptionLookupKey
		);
		assert(
			existingSubscriptionId,
			'No existing subscription found when attaching new candle subscriber'
		);

		const existingSubscription = this.subscriptions.get(existingSubscriptionId);
		assert(
			existingSubscription,
			'Existing subscription not found when attaching new candle subscriber'
		);

		existingSubscription.candleSubscribers.push(subscriberId);
	}

	private static createNewCandleSubscription(
		subscriberId: SubscriberId,
		config: CandleSubscriptionConfig
	) {
		const newSubscriptionId = generateSubscriptionId();
		this.subscriptions.set(newSubscriptionId, {
			id: newSubscriptionId,
			marketId: config.marketId,
			resolution: config.resolution,
			candleSubscribers: [subscriberId],
			tradeSubscribers: [],
		});

		this.candleSubscriptionLookup.set(
			generateCandleSubscriptionId(config),
			newSubscriptionId
		);

		// Even though this is for a candle subscription, we still add it to the trade lookup because the marketId may match that of a following trade subscription, which will need to connect to the matching existing subscription
		this.tradeSubscriptionLookup.set(
			generateTradeSubscriptionId(config),
			newSubscriptionId
		);
	}

	private static attachNewTradeSubscriberToExistingSubscription(
		subscriberId: SubscriberId,
		config: TradeSubscriptionConfig
	) {
		const tradeSubscriptionLookupKey = generateTradeSubscriptionId(config);
		const existingSubscriptionId = this.tradeSubscriptionLookup.get(
			tradeSubscriptionLookupKey
		);
		assert(
			existingSubscriptionId,
			'No existing subscription found when attaching new trade subscriber'
		);

		const existingSubscription = this.subscriptions.get(existingSubscriptionId);
		assert(
			existingSubscription,
			'Existing subscription not found when attaching new trade subscriber'
		);

		existingSubscription.tradeSubscribers.push(subscriberId);
	}

	private static createNewTradeSubscription(
		subscriberId: SubscriberId,
		config: TradeSubscriptionConfig
	) {
		const newSubscriptionId = generateSubscriptionId();
		this.subscriptions.set(newSubscriptionId, {
			id: newSubscriptionId,
			marketId: config.marketId,
			resolution: DEFAULT_CANDLE_RESOLUTION_FOR_TRADE_SUBSCRIPTIONS,
			candleSubscribers: [],
			tradeSubscribers: [subscriberId],
		});

		this.tradeSubscriptionLookup.set(
			generateTradeSubscriptionId(config),
			newSubscriptionId
		);

		// Even though this is for a trade subscription, we still add it to the candle lookup because the default resolution may match that of a following candle subscription, which will need to connect to the matching existing subscription
		this.candleSubscriptionLookup.set(
			generateCandleSubscriptionId({
				marketId: config.marketId,
				resolution: DEFAULT_CANDLE_RESOLUTION_FOR_TRADE_SUBSCRIPTIONS,
			}),
			newSubscriptionId
		);
	}

	private static handleNewSubscriber(
		subscriberId: SubscriberId,
		config: SubscriptionConfig
	) {
		// Add to current subscribers
		this.subscribers.set(subscriberId, {
			id: subscriberId,
			config,
		});

		switch (config.type) {
			case 'candles': {
				// Check if any existing subscriptions already suit the new subscriber
				const candleSubscriptionLookupKey =
					generateCandleSubscriptionId(config);
				const hasExistingSubscription = this.candleSubscriptionLookup.has(
					candleSubscriptionLookupKey
				);

				// Handle creating a new subscription or attaching to an existing subscription
				if (hasExistingSubscription) {
					// Attach to existing subscription
					this.attachNewCandleSubscriberToExistingSubscription(
						subscriberId,
						config
					);
				} else {
					// Create a new subscription
					this.createNewCandleSubscription(subscriberId, config);
				}
				break;
			}
			case 'trades': {
				// Check if any existing subscriptions already suit the new subscriber
				const tradeSubscriptionLookupKey = generateTradeSubscriptionId(config);
				const hasExistingSubscription = this.tradeSubscriptionLookup.has(
					tradeSubscriptionLookupKey
				);

				// Handle creating a new subscription or attaching to an existing subscription
				if (hasExistingSubscription) {
					this.attachNewTradeSubscriberToExistingSubscription(
						subscriberId,
						config
					);
				} else {
					this.createNewTradeSubscription(subscriberId, config);
				}
				break;
			}
			default: {
				const _never: never = config;
				throw new Error(`Unknown subscription type: ${_never}`);
			}
		}
	}

	// TODO :: Actually return some kind of subscription?
	public static subscribe(config: SubscriptionConfig): SubscriberId {
		const subscriberId = generateSubscriberId();
		this.handleNewSubscriber(subscriberId, config);
		return subscriberId;
	}
}
