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
	startTs: number; // Seconds
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
	const fetchUrl = `https://${
		DATA_API_URLS[env]
	}/market/${getMarketSymbolForMarketId(
		marketId,
		env
	)}/candles/${resolution}?startTs=${startTs}&limit=${Math.min(
		countToFetch,
		CANDLE_FETCH_LIMIT
	)}`;
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
	 */
	public fetchCandles = async () => {
		let candlesRemainingToFetch = this.getCountOfCandlesBetweenStartAndEndTs(
			this.config.fromTs,
			this.config.toTs
		);
		let currentStartTs = this.config.toTs; // The data API takes "startTs" as the "first timestamp you want going backwards in time" e.g. all candles will be returned with descending time backwards from the startTs
		let hitEndTsCutoff = false;
		let loopCount = 0;

		const candles: JsonCandle[] = [];

		console.debug(
			`candlesv2:: CANDLE_CLIENT TOTAL CANDLES TO FETCH: ${candlesRemainingToFetch}`
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
				startTs: currentStartTs,
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
