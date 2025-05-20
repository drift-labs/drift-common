import { CandleResolution } from '@drift-labs/sdk';
import { MarketSymbol, Opaque } from '@drift/common';
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { DataApiWsClient } from './dataApiWsClient';
import { JsonCandle } from 'src/types';
import { JsonTrade } from 'src/types';
import { UIEnv } from '../types';
import assert from 'assert';

/*

# Internal explanation of the MarketDataFeed class

This class was implmented as a singleton so that we can avoid making duplicate websockets where they are not necessary.

One key thing to understand about the logic is that on the API side, there is only a "single" websocket available which is to subscribe to CANDLES.

Each of these "candles" websockets also returns the TRADES which resulted in the updated candle.

To ensure that trades and candles are in sync, we want to make sure that subscriptions for these things (which is done seperately) actually use the same websocket connection. Which is why this class is necessary.

## Explanation of terminology:
- A "subscription" is an actual underlying websocket connection to the Drift Data API. A subscription may have multiple subscribers attached to it, where the data coming through that subscription is sufficient for the subsciption config. A Subscription can have the data for both CANDLES and TRADES subscribers.
- A "subscriber" is a specific instance of an external party making a subscription. It is either a TRADE or CANDLE subscriber.
- A "subscriber subscription" represents the subscription information that we return to an external subscriber. It contains the subscription ID they can use to unsubscriber, an an observable to listen to the data.

## Explanation for tradeSubscriptionLookup and candleSubscriptionLookup:
This class supports subscribing to multiple arbitrary markets (and candle resolutions) at the same time. It also supports sharing a single websocket connection between multiple subscribers where possible. This creates one bit of complexity where we need to search for existing "compatible" subscriptions whenever a new subscriber comes through. Example:
- Imagine a CANDLE subscription for SOL-PERP-Resolution-1 (Subscription A).
- When a TRADE subscription comes through for SOL-PERP (Subscription B) we want it to use the same websocket connection as Subscription A, because they are for the same market - even though they are different subscription types. We use the `tradeSubscriptionLookup` to see that there is an existing subscription for this market and then attach the new trade subscriber to it.
- When another CANDLE subscription comes through for SOL-PERP-Resolution-5 (Subscription C), there is no existing subscription in the `candleSubscriptionsLookup`, because the resolution is different. Hence we create a new subscription.
- TO SUMMARISE :: A trade subscription can share any subscription with the same market. But a candle subscription must share the same market AND resolution. We use seperate lookup tables to index into compatible subscriptions.

There is a minor inefficiency remaining in this implementation, where to be optimal we may want to "re-organise" subscriptions when they close. E.g.:
- <open> SOL-PERP-Resolution-1 (Subscriber A) => will create new Subscription A
- <open> SOL-PERP-Resolution-5 (Subscriber B) => will create new Subscription B
- <open> SOL-PERP-TRADE (Subscriber C) => will use existing Subscription A
- <close> SOL-PERP-Resolution-1 (Subscriber A) => will keep Subscription A open because Subscriber C is still listening
- * We could more optimally close Subscription A and make Subscriber C use Subscription B
- * We're not doing this for the same of simplicity. In the future we could add this optimisation if it becomes necessary.
*/

type SubscriptionType = 'candles' | 'trades';

interface ISubscriptionConfig<T extends SubscriptionType> {
	readonly type: T;
	readonly env: UIEnv;
	marketSymbol: MarketSymbol;
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

const DEFAULT_CANDLE_RESOLUTION_FOR_TRADE_SUBSCRIPTIONS: CandleResolution = '1';

abstract class SubscriberSubscription<T> {
	public readonly id: SubscriberId;
	private readonly _subject: Subject<T>;

	public get observable() {
		return this._subject.asObservable();
	}

	constructor(id: SubscriberId, subject: Subject<T>) {
		this.id = id;
		this._subject = subject;
	}
}

export class CandleSubscriberSubscription extends SubscriberSubscription<JsonCandle> {
	constructor(id: SubscriberId, subject: Subject<JsonCandle>) {
		super(id, subject);
	}
}

export class TradeSubscriberSubscription extends SubscriberSubscription<
	JsonTrade[]
> {
	constructor(id: SubscriberId, subject: Subject<JsonTrade[]>) {
		super(id, subject);
	}
}

abstract class _Subscriber<T> {
	public readonly id: SubscriberId;
	public readonly config: SubscriptionConfig;
	protected _apiSubscription: ApiSubscription;
	protected subject: Subject<T>;

	public get subscription(): Readonly<ApiSubscription> {
		return this._apiSubscription;
	}

	private generateSubscriberId(): SubscriberId {
		return uuidv4() as SubscriberId;
	}

	constructor(config: SubscriptionConfig) {
		this.id = this.generateSubscriberId();
		this.config = { ...config }; // Make a copy of the config to avoid mutability issues
	}

	setSubscription(subscription: ApiSubscription) {
		this._apiSubscription = subscription;
	}

	next(data: T) {
		this.subject.next(data);
	}
}

class CandleSubscriber extends _Subscriber<JsonCandle> {
	public readonly config: CandleSubscriptionConfig;
	public readonly subscriberSubscription: CandleSubscriberSubscription;

	constructor(config: CandleSubscriptionConfig) {
		super(config);
		this.subject = new Subject<JsonCandle>();
		this.subscriberSubscription = new CandleSubscriberSubscription(
			this.id,
			this.subject
		);
	}
}

class TradeSubscriber extends _Subscriber<JsonTrade[]> {
	public readonly config: TradeSubscriptionConfig;
	public readonly subscriberSubscription: TradeSubscriberSubscription;

	constructor(config: TradeSubscriptionConfig) {
		super(config);
		this.subject = new Subject<JsonTrade[]>();
		this.subscriberSubscription = new TradeSubscriberSubscription(
			this.id,
			this.subject
		);
	}
}

type Subscriber = CandleSubscriber | TradeSubscriber;

class ApiSubscription {
	public readonly id: SubscriptionId;
	public readonly candleSubscribers: Map<SubscriberId, CandleSubscriber>;
	public readonly tradeSubscribers: Map<SubscriberId, TradeSubscriber>;
	public readonly config: Pick<
		CandleSubscriptionConfig,
		'marketSymbol' | 'resolution' | 'env'
	>;
	private apiClient: DataApiWsClient;

	private generateSubscriptionId(): SubscriptionId {
		return uuidv4() as SubscriptionId;
	}

	constructor(
		marketSymbol: MarketSymbol,
		resolution: CandleResolution,
		env: UIEnv,
		initialSubscriber: Subscriber
	) {
		this.id = this.generateSubscriptionId();
		this.config = { marketSymbol, resolution, env };

		const initialSubscriberType = initialSubscriber.config.type;

		this.apiClient = new DataApiWsClient({
			marketSymbol: this.config.marketSymbol,
			resolution: this.config.resolution,
			env: this.config.env,
		});

		switch (initialSubscriberType) {
			case 'candles': {
				this.candleSubscribers = new Map([
					[initialSubscriber.id, initialSubscriber as CandleSubscriber],
				]);
				this.tradeSubscribers = new Map();
				break;
			}
			case 'trades': {
				this.candleSubscribers = new Map();
				this.tradeSubscribers = new Map([
					[initialSubscriber.id, initialSubscriber as TradeSubscriber],
				]);
				break;
			}
			default: {
				const _never: never = initialSubscriberType;
				throw new Error(`Unknown subscription type: ${_never}`);
			}
		}

		this.subscribeToApi();
	}

	private async subscribeToApi() {
		await this.apiClient.subscribe();
		this.apiClient.candlesObservable.subscribe((candle) => {
			this.candleSubscribers.forEach((subscriber) => {
				subscriber.next(candle);
			});
		});
		this.apiClient.tradesObservable.subscribe((trades) => {
			this.tradeSubscribers.forEach((subscriber) => {
				subscriber.next(trades);
			});
		});
	}

	public attachNewCandleSubscriberToExistingSubscription(
		subscriber: CandleSubscriber
	) {
		this.candleSubscribers.set(subscriber.id, subscriber);
	}

	public attachNewTradeSubscriberToExistingSubscription(
		subscriber: TradeSubscriber
	) {
		this.tradeSubscribers.set(subscriber.id, subscriber);
	}

	private unsubscribeFromApi() {
		this.apiClient.kill();
	}

	public removeSubscriber(subscriberId: SubscriberId): {
		noMoreSubscribers: boolean;
	} {
		this.candleSubscribers.delete(subscriberId);
		this.tradeSubscribers.delete(subscriberId);

		// Handle the case where there are no more subscribers for this subscription
		if (this.candleSubscribers.size === 0 && this.tradeSubscribers.size === 0) {
			this.unsubscribeFromApi();
			return { noMoreSubscribers: true };
		}

		return { noMoreSubscribers: false };
	}
}

/**
 * This class will handle subscribing to market data from the Drift Data API's websocket. See https://data.api.drift.trade/playground for more information about the API.
 *
 * It currently supports subscribing to candles and to trades.
 */
export class MarketDataFeed {
	constructor() {}

	// Stores all current subscribers
	private static subscribers = new Map<SubscriberId, Subscriber>();

	// Stores all current subscriptions :: subscribers:subscriptions is N:M (Subscribers may share a subscription but not vice versa)
	private static subscriptions = new Map<SubscriptionId, ApiSubscription>();

	// Lookup table for any trade subscriptions which can share an underlying subscription
	private static compatibleTradeSubscriptionLookup = new Map<
		TradeSubscriptionLookupKey,
		ApiSubscription
	>();

	// Lookup table for any candle subscriptions which can share an underlying subscription
	private static compatibleCandleSubscriptionLookup = new Map<
		CandleSubscriptionLookupKey,
		ApiSubscription
	>();

	private static getCompatibleCandleSubscriptionLookupKey(
		config: Pick<CandleSubscriptionConfig, 'marketSymbol' | 'resolution'>
	): CandleSubscriptionLookupKey {
		return `${config.marketSymbol}:${config.resolution}` as CandleSubscriptionLookupKey;
	}

	private static getCompatibleTradeSubscriptionLookupKey(
		config: Pick<CandleSubscriptionConfig, 'marketSymbol'>
	): TradeSubscriptionLookupKey {
		return `${config.marketSymbol}` as TradeSubscriptionLookupKey;
	}

	/**
	 * Handles a new subscription by  adding it to the necessary lookup tables
	 * @param subscription
	 */
	private static handleNewApiSubscription(subscription: ApiSubscription) {
		const tradeSubscriptionLookupKey =
			this.getCompatibleTradeSubscriptionLookupKey(subscription.config);
		const candleSubscriptionLookupKey =
			this.getCompatibleCandleSubscriptionLookupKey(subscription.config);

		this.subscriptions.set(subscription.id, subscription);

		// Add to the trade subscription compatibility lookup if a previous one suiting this subscription doesn't already exist
		if (
			!this.compatibleTradeSubscriptionLookup.has(tradeSubscriptionLookupKey)
		) {
			this.compatibleTradeSubscriptionLookup.set(
				tradeSubscriptionLookupKey,
				subscription
			);
		}

		// Add to the candle subscription compatibility lookup if a previous one suiting this subscription doesn't already exist
		if (
			!this.compatibleCandleSubscriptionLookup.has(candleSubscriptionLookupKey)
		) {
			this.compatibleCandleSubscriptionLookup.set(
				candleSubscriptionLookupKey,
				subscription
			);
		}
	}

	private static handleNewCandleSubscriber(subscriber: CandleSubscriber) {
		const candleSubscriptionLookupKey =
			this.getCompatibleCandleSubscriptionLookupKey(subscriber.config);
		const hasExistingSuitableSubscription =
			this.compatibleCandleSubscriptionLookup.has(candleSubscriptionLookupKey);

		if (hasExistingSuitableSubscription) {
			const existingSubscription = this.compatibleCandleSubscriptionLookup.get(
				candleSubscriptionLookupKey
			);
			existingSubscription.attachNewCandleSubscriberToExistingSubscription(
				subscriber
			);
		} else {
			const newSubscription = new ApiSubscription(
				subscriber.config.marketSymbol,
				subscriber.config.resolution,
				subscriber.config.env,
				subscriber
			);
			this.handleNewApiSubscription(newSubscription);
		}

		assert(
			this.subscribers.has(subscriber.id),
			'Subscriber should be added to subscribers map'
		);
	}

	private static handleNewTradeSubscriber(subscriber: TradeSubscriber) {
		// Check if any existing subscriptions already suit the new subscriber
		const tradeSubscriptionLookupKey =
			this.getCompatibleTradeSubscriptionLookupKey(subscriber.config);
		const hasExistingSuitableSubscription =
			this.compatibleTradeSubscriptionLookup.has(tradeSubscriptionLookupKey);

		if (hasExistingSuitableSubscription) {
			const existingSubscription = this.compatibleTradeSubscriptionLookup.get(
				tradeSubscriptionLookupKey
			);
			existingSubscription.attachNewTradeSubscriberToExistingSubscription(
				subscriber
			);
		} else {
			const newSubscription = new ApiSubscription(
				subscriber.config.marketSymbol,
				DEFAULT_CANDLE_RESOLUTION_FOR_TRADE_SUBSCRIPTIONS,
				subscriber.config.env,
				subscriber
			);
			this.handleNewApiSubscription(newSubscription);
		}

		assert(
			this.subscribers.has(subscriber.id),
			'Subscriber should be added to subscribers map'
		);
	}

	// Function overload, ensures the correct type is returned based on the config type
	public static subscribe(
		config: CandleSubscriptionConfig
	): CandleSubscriberSubscription;
	public static subscribe(
		config: TradeSubscriptionConfig
	): TradeSubscriberSubscription;
	public static subscribe(
		config: SubscriptionConfig
	): CandleSubscriberSubscription | TradeSubscriberSubscription {
		const subscriberSubscription = this.handleNewSubscriber(config);
		return subscriberSubscription;
	}

	private static handleNewSubscriber(
		config: SubscriptionConfig
	): CandleSubscriberSubscription | TradeSubscriberSubscription {
		switch (config.type) {
			case 'candles': {
				// Create the new Subscriber
				const newSubscriber = new CandleSubscriber(config);

				// Add to current subscribers
				this.subscribers.set(newSubscriber.id, newSubscriber);

				this.handleNewCandleSubscriber(newSubscriber);

				return newSubscriber.subscriberSubscription;
			}
			case 'trades': {
				// Create the new Subscriber
				const newSubscriber = new TradeSubscriber(config);

				// Add to current subscribers
				this.subscribers.set(newSubscriber.id, newSubscriber);

				this.handleNewTradeSubscriber(newSubscriber);

				return newSubscriber.subscriberSubscription;
			}
			default: {
				const _never: never = config;
				throw new Error(`Unknown subscription type: ${_never}`);
			}
		}
	}

	private static cleanupApiSubscription(
		apiSubscription: Readonly<ApiSubscription>
	) {
		// We can delete the subscription from the lookup table when we're cleaning up an ApiSubscription
		this.subscriptions.delete(apiSubscription.id);

		// Need to delete the compatible lookup entries using this ApiSubscription so following subscriptions don't try to reuse it
		this.compatibleTradeSubscriptionLookup.delete(
			this.getCompatibleTradeSubscriptionLookupKey(apiSubscription.config)
		);
		this.compatibleCandleSubscriptionLookup.delete(
			this.getCompatibleCandleSubscriptionLookupKey(apiSubscription.config)
		);
	}

	public static unsubscribe(subscriberId: SubscriberId) {
		const subscriber = this.subscribers.get(subscriberId);

		if (!subscriber) {
			throw new Error(`Subscriber not found: ${subscriberId}`);
		}

		const apiSubscription = subscriber.subscription;

		const { noMoreSubscribers } =
			apiSubscription.removeSubscriber(subscriberId);

		if (noMoreSubscribers) {
			this.cleanupApiSubscription(apiSubscription);
		}
	}
}
