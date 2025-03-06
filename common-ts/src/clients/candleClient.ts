import {
	CandleResolution,
	DevnetPerpMarkets,
	DevnetSpotMarkets,
	DriftEnv,
	MainnetPerpMarkets,
	MainnetSpotMarkets,
} from '@drift-labs/sdk';
import { MarketId } from '../types';
import WS from 'isomorphic-ws';
import { CANDLE_UTILS } from '../utils/candleUtils';
import { StrictEventEmitter } from '../utils/StrictEventEmitter';

// Used by the subscriber client to fetch candles from the data API
type CandleFetchConfig = {
	env: DriftEnv;
	marketId: MarketId;
	resolution: CandleResolution;
	fromTs: number; // Seconds
	toTs: number; // Seconds
};

// Used by the subscriber client to subscribe to the candles websocket endpoint
type CandleSubscriptionConfig = {
	resolution: CandleResolution;
	marketId: MarketId;
	env: DriftEnv;
};

// This is what the client subscriber uses internally to fetch the candles from the data API
type CandleFetchUrlConfig = {
	env: DriftEnv;
	marketId: MarketId;
	resolution: CandleResolution;
	startTs?: number; // Seconds - now optional
	countToFetch: number;
};

// Type for the candles returned by the data API
export type JsonCandle = {
	ts: number;
	fillOpen: number;
	fillHigh: number;
	fillClose: number;
	fillLow: number;
	oracleOpen: number;
	oracleHigh: number;
	oracleClose: number;
	oracleLow: number;
	quoteVolume: number;
	baseVolume: number;
};

type CandleFetchResponseJson = {
	success: boolean;
	records: JsonCandle[];
};

const DATA_API_URLS: Record<DriftEnv, string> = {
	devnet: 'data-master.api.drift.trade',
	'mainnet-beta': 'data.api.drift.trade',
};

const getMarketSymbolForMarketId = (marketId: MarketId, env: DriftEnv) => {
	const isPerp = marketId.isPerp;

	if (isPerp) {
		const marketConfigs =
			env === 'mainnet-beta' ? MainnetPerpMarkets : DevnetPerpMarkets;
		const targetMarketConfig = marketConfigs.find(
			(config) => config.marketIndex === marketId.marketIndex
		);
		return targetMarketConfig.symbol;
	} else {
		const marketConfigs =
			env === 'mainnet-beta' ? MainnetSpotMarkets : DevnetSpotMarkets;
		const targetMarketConfig = marketConfigs.find(
			(config) => config.marketIndex === marketId.marketIndex
		);
		return targetMarketConfig.symbol;
	}
};

// This is the maximum number of candles that can be fetched in a single GET request
const CANDLE_FETCH_LIMIT = 1000;

const getCandleFetchUrl = ({
	env,
	marketId,
	resolution,
	startTs,
	countToFetch,
}: CandleFetchUrlConfig) => {
	// Base URL without startTs parameter
	let fetchUrl = `https://${
		DATA_API_URLS[env]
	}/market/${getMarketSymbolForMarketId(
		marketId,
		env
	)}/candles/${resolution}?limit=${Math.min(countToFetch, CANDLE_FETCH_LIMIT)}`;

	// Only add startTs parameter if it's provided
	if (startTs !== undefined) {
		fetchUrl += `&startTs=${startTs}`;
	}

	return fetchUrl;
};

const getCandleWsSubscriptionPath = (config: CandleSubscriptionConfig) => {
	return `wss://${DATA_API_URLS[config.env]}/ws`;
};

const getCandleWsSubscriptionMessage = (config: CandleSubscriptionConfig) => {
	return JSON.stringify({
		type: 'subscribe',
		symbol: getMarketSymbolForMarketId(config.marketId, config.env),
		resolution: `${config.resolution}`,
	});
};

type WsSubscriptionMessageType =
	| 'subscribe'
	| 'init'
	| 'subscription'
	| 'update'
	| 'create';

type WsSubscriptionMessage<T extends WsSubscriptionMessageType> = {
	type: T;
};

type WsCandleUpdateMessage = WsSubscriptionMessage<'update'> & {
	candle: JsonCandle;
};

type CandleSubscriberEvents = {
	'candle-update': JsonCandle;
};

// Separate event bus for candle events
class CandleEventBus extends StrictEventEmitter<CandleSubscriberEvents> {
	constructor() {
		super();
	}
}

// This class is responsible for subscribing to the candles websocket endpoint and forwarding events to the event bus
class CandleSubscriber {
	private readonly config: CandleSubscriptionConfig;
	private readonly eventBus: CandleEventBus;
	private ws: WS;

	constructor(config: CandleSubscriptionConfig, eventBus: CandleEventBus) {
		this.config = config;
		this.eventBus = eventBus;
	}

	private handleWsMessage = (message: string) => {
		const parsedMessage = JSON.parse(
			message
		) as WsSubscriptionMessage<WsSubscriptionMessageType>;

		let candle: JsonCandle;
		switch (parsedMessage.type) {
			case 'update':
				candle = (parsedMessage as WsCandleUpdateMessage).candle;
				this.eventBus.emit('candle-update', candle);
				break;
			default:
				break;
		}
	};

	public subscribeToCandles = async () => {
		this.ws = new WS(getCandleWsSubscriptionPath(this.config));

		this.ws.onopen = (_event) => {
			this.ws.send(getCandleWsSubscriptionMessage(this.config));
		};

		this.ws.onmessage = (incoming) => {
			// Forward message to all observers
			const message = incoming.data as string;
			this.handleWsMessage(message);
		};

		this.ws.onclose = (_event) => {
			console.debug(
				`candlesv2:: CANDLE_CLIENT WS CLOSED for ${this.config.marketId.key}`
			);
		};
	};

	public killWs = () => {
		if (this.ws) {
			this.ws.send(JSON.stringify({ type: 'unsubscribe' }));
			this.ws.close();
			delete this.ws;
		}
	};
}

// This class is reponsible for fetching candles from the data API's GET endpoint
class CandleFetcher {
	private readonly config: CandleFetchConfig;

	// Cache for storing recent candles by market ID and resolution
	public static recentCandlesCache: Map<
		string, // key: `${marketId.key}-${resolution}`
		{
			candles: JsonCandle[];
			earliestTs: number;
			latestTs: number;
			fetchTime: number;
		}
	> = new Map();

	// Helper method to generate a cache key from market ID and resolution
	public static getCacheKey(
		marketId: MarketId,
		resolution: CandleResolution
	): string {
		return `${marketId.key}-${resolution}`;
	}

	// Public method to clear the entire cache
	public static clearCache() {
		CandleFetcher.recentCandlesCache.clear();
		console.debug('candlesv2:: CANDLE_CLIENT CACHE CLEARED');
	}

	constructor(config: CandleFetchConfig) {
		this.config = config;
	}

	private fetchCandlesFromApi = async (
		fetchUrl: string
	): Promise<JsonCandle[]> => {
		const response = await fetch(fetchUrl);
		const parsedResponse = (await response.json()) as CandleFetchResponseJson;

		if (!parsedResponse.success) {
			console.debug(
				`candlesv2:: CANDLE_CLIENT FAILED to fetch candles from data API: ${fetchUrl}`,
				parsedResponse
			);
			throw new Error('Failed to fetch candles from data API');
		}

		return parsedResponse.records;
	};

	private getCountOfCandlesBetweenStartAndEndTs = (
		startTs: number,
		endTs: number
	) => {
		const diffInSeconds = endTs - startTs;
		const resolutionInSeconds =
			CANDLE_UTILS.resolutionStringToCandleLengthMs(this.config.resolution) /
			1000;
		const diffInCandles = diffInSeconds / resolutionInSeconds;
		return Math.ceil(diffInCandles);
	};

	/**
	 * This class needs to fetch candles based on the config.
	 *
	 * If the number of candles requested exceeds the maximum number of candles that can be fetched in a single GET request, then it needs to loop multiple get requests, using the last candle's timestamp as the offset startTs for each subsequent request. If the number of candles returned is less than the requested number of candles, then we have fetched all the candles available.
	 *
	 * For recent candles (ones where fromTs > now - candleLength*1000), we avoid using startTs in the URL to improve caching,
	 * and instead fetch the most recent 1000 candles and then trim the result.
	 */
	public fetchCandles = async () => {
		// Check cache first
		// Generate cache key for the current request
		const cacheKey = CandleFetcher.getCacheKey(
			this.config.marketId,
			this.config.resolution
		);
		const cachedCandles = CandleFetcher.recentCandlesCache.get(cacheKey);

		// Check if we have cached candles for this market and resolution
		if (cachedCandles) {
			// Check if the requested time range is within the bounds of cached candles
			if (
				this.config.fromTs >= cachedCandles.earliestTs &&
				this.config.toTs <= cachedCandles.latestTs
			) {
				console.debug(
					`candlesv2:: CANDLE_CLIENT USING CACHED CANDLES for ${this.config.marketId.key}-${this.config.resolution} (${this.config.fromTs}-${this.config.toTs})`
				);

				// Filter cached candles to the requested time range
				const filteredCandles = cachedCandles.candles.filter(
					(candle) =>
						candle.ts >= this.config.fromTs && candle.ts <= this.config.toTs
				);

				return filteredCandles;
			}
		}

		// Calculate the candle length in seconds for the current resolution
		const candleLengthMs = CANDLE_UTILS.resolutionStringToCandleLengthMs(
			this.config.resolution
		);
		const candleLengthSeconds = candleLengthMs / 1000;

		// Get current time in seconds
		const nowSeconds = Math.floor(Date.now() / 1000);

		// Calculate cutoff time for "recent" candles (now - 1000 candles worth of time)
		const recentCandlesCutoffTs =
			nowSeconds - candleLengthSeconds * CANDLE_FETCH_LIMIT;

		// Check if we're fetching recent candles based on the fromTs
		const isRequestingRecentCandles =
			this.config.fromTs >= recentCandlesCutoffTs;

		// If requesting recent candles, fetch without startTs for better caching
		if (isRequestingRecentCandles) {
			console.debug(
				`candlesv2:: CANDLE_CLIENT FETCHING RECENT CANDLES without startTs (fromTs=${this.config.fromTs}, cutoff=${recentCandlesCutoffTs}, cacheable=true)`
			);

			// Fetch recent candles without specifying startTs
			const fetchUrl = getCandleFetchUrl({
				env: this.config.env,
				marketId: this.config.marketId,
				resolution: this.config.resolution,
				countToFetch: CANDLE_FETCH_LIMIT, // Ask for max candles to ensure we get enough
			});

			// Get the candles and reverse them (into ascending order)
			const fetchedCandles = await this.fetchCandlesFromApi(fetchUrl);
			fetchedCandles.reverse();

			if (fetchedCandles.length === 0) {
				return [];
			}

			console.debug(
				`candlesv2:: CANDLE_CLIENT RECEIVED ${
					fetchedCandles.length
				} RECENT CANDLES between\n${new Date(
					fetchedCandles[0].ts * 1000
				).toISOString()} =>\n${new Date(
					fetchedCandles[fetchedCandles.length - 1].ts * 1000
				).toISOString()}`
			);

			// Store the full fetchedCandles in cache before filtering
			if (fetchedCandles.length > 0) {
				// Sort candles by timestamp to find earliest and latest
				const sortedCandles = [...fetchedCandles].sort((a, b) => a.ts - b.ts);
				const earliestTs = sortedCandles[0].ts;
				const latestTs = sortedCandles[sortedCandles.length - 1].ts;

				// Update or add to cache
				CandleFetcher.recentCandlesCache.set(cacheKey, {
					candles: sortedCandles,
					earliestTs,
					latestTs,
					fetchTime: nowSeconds,
				});

				console.debug(
					`candlesv2:: CANDLE_CLIENT CACHING ${sortedCandles.length} FULL CANDLES for ${this.config.marketId.key}-${this.config.resolution}`
				);
			}

			// Filter to only include candles in the requested time range
			const filteredCandles = fetchedCandles.filter(
				(candle) =>
					candle.ts >= this.config.fromTs && candle.ts <= this.config.toTs
			);

			console.debug(
				`candlesv2:: CANDLE_CLIENT RETURNING ${filteredCandles.length} FILTERED RECENT CANDLES`
			);

			return filteredCandles;
		}

		// For historical candles (older than the last 1000 candles), use the previous approach
		// with startTs for pagination
		let candlesRemainingToFetch = this.getCountOfCandlesBetweenStartAndEndTs(
			this.config.fromTs,
			this.config.toTs
		);

		let currentStartTs = this.config.toTs; // The data API takes "startTs" as the "first timestamp you want going backwards in time" e.g. all candles will be returned with descending time backwards from the startTs
		let hitEndTsCutoff = false;
		let loopCount = 0;

		const candles: JsonCandle[] = [];

		console.debug(
			`candlesv2:: CANDLE_CLIENT TOTAL HISTORICAL CANDLES TO FETCH: ${candlesRemainingToFetch}`
		);

		while (candlesRemainingToFetch > 0) {
			const candlesToFetch = Math.min(
				candlesRemainingToFetch,
				CANDLE_FETCH_LIMIT
			);

			const fetchUrl = getCandleFetchUrl({
				env: this.config.env,
				marketId: this.config.marketId,
				resolution: this.config.resolution,
				startTs: currentStartTs, // Include startTs for historical candles
				countToFetch: candlesToFetch,
			});

			console.debug(
				`candlesv2:: CANDLE_CLIENT LOOP ${loopCount} ASKING for ${candlesToFetch} before \n${new Date(
					currentStartTs * 1000
				).toISOString()}`
			);

			const fetchedCandles = await this.fetchCandlesFromApi(fetchUrl);

			// Reverse candles into ascending order
			fetchedCandles.reverse();

			console.debug(
				`candlesv2:: CANDLE_CLIENT RETURNING ${
					fetchedCandles.length
				} between\n${new Date(
					fetchedCandles[0].ts * 1000
				).toISOString()} =>\n${new Date(
					fetchedCandles[fetchedCandles.length - 1].ts * 1000
				).toISOString()}`
			);

			if (fetchedCandles.length === 0) {
				candlesRemainingToFetch = 0;
				break;
			}

			const lastCandle = fetchedCandles[fetchedCandles.length - 1];

			const hitPageSizeCutoff = fetchedCandles.length === CANDLE_FETCH_LIMIT;
			hitEndTsCutoff = lastCandle.ts < this.config.fromTs;

			const requiresAnotherFetch = hitPageSizeCutoff && !hitEndTsCutoff; // If the number of candles returned is equal to the maximum number of candles that can be fetched in a single GET request, then we need to fetch more candles

			let candlesToAdd = fetchedCandles;

			if (requiresAnotherFetch) {
				// If we need to do another fetch, trim any candles with the same timestamp as the last candle in the previous fetch, because that is the pointer for our next fetch and we don't want to duplicate candles
				candlesToAdd = candlesToAdd.filter((candle) => {
					return candle.ts > lastCandle.ts;
				});

				currentStartTs = lastCandle.ts; // If we are doing another loop, then the trimmed candles have all the candles except for ones with the last candle's timestamp. For the next loop we want to fetch from that timestamp;
			}

			candles.push(...candlesToAdd);
			candlesRemainingToFetch -= candlesToAdd.length;

			if (!requiresAnotherFetch && candlesRemainingToFetch > 0) {
				throw new Error(
					`Candles remaining to fetch is greater than 0 but we didn't expect another fetch to be necessary`
				);
			}

			if (!requiresAnotherFetch && candlesRemainingToFetch !== 0) {
				throw new Error(
					`Expect candlesRemainingToFetch to be exactly 0 if another fetch is not necessary`
				);
			}

			loopCount++;
		}

		if (hitEndTsCutoff) {
			return candles.filter((candle) => candle.ts <= this.config.toTs);
		}

		return candles;
	};
}

export class CandleClient {
	private activeSubscriptions: Map<
		string,
		{
			subscriber: CandleSubscriber;
			eventBus: CandleEventBus;
		}
	> = new Map();

	constructor() {}

	public subscribe = async (
		config: CandleSubscriptionConfig,
		subscriptionKey: string
	) => {
		console.debug(
			`candlesv2:: CANDLE_CLIENT SUBSCRIBING for ${subscriptionKey}`
		);

		// Kill any existing subscription with the same key before creating a new one
		if (this.activeSubscriptions.has(subscriptionKey)) {
			this.unsubscribe(subscriptionKey);
		}

		const eventBus = new CandleEventBus();
		const subscriber = new CandleSubscriber(config, eventBus);
		await subscriber.subscribeToCandles();

		this.activeSubscriptions.set(subscriptionKey, {
			subscriber,
			eventBus,
		});

		return;
	};

	public fetch = async (config: CandleFetchConfig): Promise<JsonCandle[]> => {
		const candleFetcher = new CandleFetcher(config);
		const candles = await candleFetcher.fetchCandles();
		return candles;
	};

	public unsubscribe = (subscriptionKey: string) => {
		console.debug(
			`candlesv2:: CANDLE_CLIENT UNSUBSCRIBING for ${subscriptionKey}`
		);
		const subscription = this.activeSubscriptions.get(subscriptionKey);
		if (subscription) {
			subscription.subscriber.killWs();
			subscription.eventBus.removeAllListeners();
			this.activeSubscriptions.delete(subscriptionKey);
		}
	};

	public unsubscribeAll = () => {
		console.debug(`candlesv2:: CANDLE_CLIENT UNSUBSCRIBING ALL`);
		for (const subscriptionKey of this.activeSubscriptions.keys()) {
			this.unsubscribe(subscriptionKey);
		}
	};

	public on(
		subscriptionKey: string,
		event: keyof CandleSubscriberEvents,
		listener: (candle: JsonCandle) => void
	) {
		console.debug(`candlesv2:: CANDLE_CLIENT ON for ${subscriptionKey}`);
		const subscription = this.activeSubscriptions.get(subscriptionKey);
		if (subscription) {
			subscription.eventBus.on(event, listener);
		} else {
			console.warn(`No active subscription found for key: ${subscriptionKey}`);
		}
	}
}
