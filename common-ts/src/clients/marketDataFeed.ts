/**
 * This class will handle subscribing to market data from the Drift Data API's websocket.
 *
 * Currently only supports subscribing to candles and to trades.
 *
 * Implemented as a singleton to ensure that we don't have multiple open connections to the same market data feed.
 */

import { CandleResolution } from '@drift-labs/sdk';
import { MarketSymbol, Opaque } from '@drift/common';
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { DataApiWsClient, JsonCandle, JsonTrade } from './dataApiWsClient';
import { UIEnv } from '../types';

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

export class CandleSubscriberSubscription {
	public readonly id: SubscriberId;
	private readonly _subject: Subject<JsonCandle>;

	public get observable() {
		return this._subject.asObservable();
	}

	constructor(id: SubscriberId) {
		this.id = id;
		this._subject = new Subject<JsonCandle>();
	}
}

export class TradeSubscriberSubscription {
	public readonly id: SubscriberId;
	private readonly _subject: Subject<JsonTrade[]>;

	public get observable() {
		return this._subject.asObservable();
	}

	constructor(id: SubscriberId) {
		this.id = id;
		this._subject = new Subject<JsonTrade[]>();
	}
}

abstract class Subscriber {
	public readonly id: SubscriberId;
	public readonly config: SubscriptionConfig;
	protected _apiSubscription: ApiSubscription;

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
}

class CandleSubscriber extends Subscriber {
	public readonly config: CandleSubscriptionConfig;
	public readonly subscriberSubscription: CandleSubscriberSubscription;
	private readonly _subject: Subject<JsonCandle>;

	public get subject() {
		return this._subject;
	}

	constructor(config: CandleSubscriptionConfig) {
		super(config);
		this._subject = new Subject<JsonCandle>();
		this.subscriberSubscription = new CandleSubscriberSubscription(this.id);
	}
}

class TradeSubscriber extends Subscriber {
	public readonly config: TradeSubscriptionConfig;
	public readonly subscriberSubscription: TradeSubscriberSubscription;
	private readonly _subject: Subject<JsonTrade[]>;

	public get subject() {
		return this._subject;
	}

	constructor(config: TradeSubscriptionConfig) {
		super(config);
		this._subject = new Subject<JsonTrade[]>();
		this.subscriberSubscription = new TradeSubscriberSubscription(this.id);
	}
}

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
				subscriber.subject.next(candle);
			});
		});
		this.apiClient.tradesObservable.subscribe((trades) => {
			this.tradeSubscribers.forEach((subscriber) => {
				subscriber.subject.next(trades);
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

export class MarketDataFeed {
	constructor() {}

	// Stores all current subscribers
	private static subscribers = new Map<SubscriberId, Subscriber>();

	// Stores all current subscriptions :: subscribers:subscriptions is N:M (Subscribers may share a subscription but not vice versa)
	private static subscriptions = new Map<SubscriptionId, ApiSubscription>();

	// Lookup table for trade subscriptions
	private static tradeSubscriptionLookup = new Map<
		TradeSubscriptionLookupKey,
		ApiSubscription
	>();

	// Lookup table for candle subscriptions
	private static candleSubscriptionLookup = new Map<
		CandleSubscriptionLookupKey,
		ApiSubscription
	>();

	// Generate ID to lookup a subscription for a given candle subscription config
	private static getCandleSubscriptionLookupKey(
		config: Pick<CandleSubscriptionConfig, 'marketSymbol' | 'resolution'>
	): CandleSubscriptionLookupKey {
		return `${config.marketSymbol}:${config.resolution}` as CandleSubscriptionLookupKey;
	}

	// Generate ID to lookup a subscription for a given trade subscription config
	private static getTradeSubscriptionLookupKey(
		config: Pick<CandleSubscriptionConfig, 'marketSymbol'>
	): TradeSubscriptionLookupKey {
		return `${config.marketSymbol}` as TradeSubscriptionLookupKey;
	}

	/**
	 * Handles a new subscription by  adding it to the necessary lookup tables
	 * @param subscription
	 */
	private static handleNewSubscription(subscription: ApiSubscription) {
		const tradeSubscriptionLookupKey = this.getTradeSubscriptionLookupKey(
			subscription.config
		);

		const candleSubscriptionLookupKey = this.getCandleSubscriptionLookupKey(
			subscription.config
		);

		this.subscriptions.set(subscription.id, subscription);

		if (!this.tradeSubscriptionLookup.has(tradeSubscriptionLookupKey)) {
			this.tradeSubscriptionLookup.set(
				tradeSubscriptionLookupKey,
				subscription
			);
		}

		if (!this.candleSubscriptionLookup.has(candleSubscriptionLookupKey)) {
			this.candleSubscriptionLookup.set(
				candleSubscriptionLookupKey,
				subscription
			);
		}
	}

	private static handleNewCandleSubscriber(subscriber: CandleSubscriber) {
		const candleSubscriptionLookupKey = this.getCandleSubscriptionLookupKey(
			subscriber.config
		);
		const hasExistingSuitableSubscription = this.candleSubscriptionLookup.has(
			candleSubscriptionLookupKey
		);

		if (hasExistingSuitableSubscription) {
			const existingSubscription = this.candleSubscriptionLookup.get(
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
			this.handleNewSubscription(newSubscription);
		}
	}

	private static handleNewTradeSubscriber(subscriber: TradeSubscriber) {
		// Check if any existing subscriptions already suit the new subscriber
		const tradeSubscriptionLookupKey = this.getTradeSubscriptionLookupKey(
			subscriber.config
		);
		const hasExistingSuitableSubscription = this.tradeSubscriptionLookup.has(
			tradeSubscriptionLookupKey
		);

		if (hasExistingSuitableSubscription) {
			const existingSubscription = this.tradeSubscriptionLookup.get(
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
			this.handleNewSubscription(newSubscription);
		}
	}

	// This is an example of function overloading in TypeScript
	// The first two declarations are the function signatures, specifying:
	// 1. When passed a CandleSubscriptionConfig, returns CandleSubscriberSubscription
	// 2. When passed a TradeSubscriptionConfig, returns TradeSubscriberSubscription
	public static subscribe(
		config: CandleSubscriptionConfig
	): CandleSubscriberSubscription;
	public static subscribe(
		config: TradeSubscriptionConfig
	): TradeSubscriberSubscription;
	// This is the actual implementation that handles both cases
	// The parameter type is the union of both config types
	// The return type is the union of both subscription types
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

	private static cleanupSubscription(
		apiSubscription: Readonly<ApiSubscription>
	) {
		this.subscriptions.delete(apiSubscription.id);
		this.tradeSubscriptionLookup.delete(
			this.getTradeSubscriptionLookupKey(apiSubscription.config)
		);
		this.candleSubscriptionLookup.delete(
			this.getCandleSubscriptionLookupKey(apiSubscription.config)
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
			this.cleanupSubscription(apiSubscription);
		}
	}
}
