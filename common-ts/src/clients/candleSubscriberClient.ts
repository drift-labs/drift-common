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

type CandleSubscriptionConfig = {
	startTs: number; // Seconds
	endTs: number; // Seconds
	resolution: CandleResolution;
	marketId: MarketId;
	env: DriftEnv;
};

type JsonCandle = {
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
	devnet: 'https://data-api-dev.drift.markets', // TODO
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

type CandleFetchConfig = {
	env: DriftEnv;
	marketId: MarketId;
	resolution: CandleResolution;
	startTs: number;
	countToFetch: number;
};

const getCandleFetchUrl = ({
	env,
	marketId,
	resolution,
	startTs,
	countToFetch,
}: CandleFetchConfig) => {
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

// Class responsible for storing a buffer of candles
class CandleBuffer {
	private readonly candles: JsonCandle[];

	constructor() {
		this.candles = [];
	}

	public addCandle(candle: JsonCandle) {
		this.candles.push(candle);
	}

	public addCandles(candles: JsonCandle[]) {
		this.candles.push(...candles);
	}

	public getCandles() {
		return this.candles;
	}

	public releaseCandles() {
		const candles = this.candles;
		// @ts-expect-error
		this.candles = [];
		return candles;
	}
}

/*

{ "type": "subscribe", "symbol": "SOL-PERP", "resolution": "1" }
▼ {"type":"init","symbol":"SOL-PERP","resolution":"1","data":[{"symbol":"SOL-PERP","resolution":"1","ts":1738828080,"fillOpen":202.1005,"fillHigh":202.1005,"fillClose":202.1,"fillLow":202.05,"oracleOpen":202.322574,"oracleHigh":202.322574,"oracleClose":202.293589,"oracleLow":202.254547,"quoteVolume":4615.322,"baseVolume":22.84,"lastTradeTs":1738828123}]}
▼ {"type":"subscription","message":"Subscribed to SOL-PERP 1","symbol":"SOL-PERP","resolution":"1"}
▼ {"type":"update","candle":{"symbol":"SOL-PERP","resolution":"1","ts":1738828080,"fillOpen":202.1005,"fillHigh":202.1324,"fillClose":202.1324,"fillLow":202.05,"oracleOpen":202.322574,"oracleHigh":202.322574,"oracleClose":202.293589,"oracleLow":202.254547,"quoteVolume":6636.646000000001,"baseVolume":32.84,"lastTradeTs":1738828124}}

*/

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

// This class is responsible for subscribing to the candles websocket endpoint and storing a buffer of candles which can be released at any time
class CandleSubscriber {
	private readonly config: CandleSubscriptionConfig;
	private readonly candleBuffer: CandleBuffer;
	private ws: WS;

	constructor(config: CandleSubscriptionConfig) {
		this.config = config;
		this.candleBuffer = new CandleBuffer();
	}

	private handleWsMessage = (message: string) => {
		const parsedMessage = JSON.parse(
			message
		) as WsSubscriptionMessage<WsSubscriptionMessageType>;

		switch (parsedMessage.type) {
			case 'update':
				this.candleBuffer.addCandle(
					(parsedMessage as WsCandleUpdateMessage).candle
				);
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
			// TODO
		};
	};

	public releaseCandles = () => {
		return this.candleBuffer.releaseCandles();
	};

	public killWs = () => {
		if (this.ws) {
			this.ws.close();
		}
	};
}

// This class is reponsible for fetching candles from the data API's GET endpoint
class CandleFetcher {
	private readonly config: CandleSubscriptionConfig;

	constructor(config: CandleSubscriptionConfig) {
		this.config = config;
	}

	private fetchCandlesFromApi = async (
		fetchUrl: string
	): Promise<JsonCandle[]> => {
		const response = await fetch(fetchUrl);
		const data = (await response.json()) as CandleFetchResponseJson;

		// TODO :: Handle error case where success is false
		return data.records;
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
			this.config.startTs,
			this.config.endTs
		);
		let startTsToFetch = this.config.startTs;
		let hitEndTsCutoff = false;

		const candles: JsonCandle[] = [];

		while (candlesRemainingToFetch > 0) {
			const candlesToFetch = Math.min(
				candlesRemainingToFetch,
				CANDLE_FETCH_LIMIT
			);

			const fetchUrl = getCandleFetchUrl({
				env: this.config.env,
				marketId: this.config.marketId,
				resolution: this.config.resolution,
				startTs: startTsToFetch,
				countToFetch: candlesToFetch,
			});

			const fetchedCandles = await this.fetchCandlesFromApi(fetchUrl);

			if (fetchedCandles.length === 0) {
				candlesRemainingToFetch = 0;
				break;
			}

			const lastCandle = fetchedCandles[fetchedCandles.length - 1];

			const hitPageSizeCutoff = fetchedCandles.length === CANDLE_FETCH_LIMIT;
			hitEndTsCutoff = lastCandle.ts > this.config.endTs;

			const requiresAnotherFetch = hitPageSizeCutoff && !hitEndTsCutoff; // If the number of candles returned is equal to the maximum number of candles that can be fetched in a single GET request, then we need to fetch more candles

			let candlesToAdd = fetchedCandles;

			if (requiresAnotherFetch) {
				// If we need to do another fetch, trim any candles with the same timestamp as the last candle in the previous fetch, because that is the pointer for our next fetch and we don't want to duplicate candles
				candlesToAdd = candlesToAdd.filter((candle) => {
					return candle.ts < lastCandle.ts;
				});

				startTsToFetch = lastCandle.ts - 1; // If we are doing another loop, then the trimmed candles have all the candles except for ones with the last candle's timestamp. For the next loop we want to fetch from that timestamp;
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
		}

		if (hitEndTsCutoff) {
			return candles.filter((candle) => candle.ts <= this.config.endTs);
		}

		return candles;
	};
}

export class CandleSubscriberClient {
	private config: CandleSubscriptionConfig;
	private candleSubscriber: CandleSubscriber;
	private candleFetcher: CandleFetcher;

	constructor(config: CandleSubscriptionConfig) {
		// TODO :: Validate config

		this.config = config;
		this.candleSubscriber = new CandleSubscriber(config);
		this.candleFetcher = new CandleFetcher(config);
	}

	public subscribeToCandles = async () => {
		await this.candleSubscriber.subscribeToCandles();
		return;
	};

	public fetchCandles = async () => {
		const candles = await this.candleFetcher.fetchCandles();
		return candles;
	};

	public updateConfig = (config: CandleSubscriptionConfig) => {
		this.candleSubscriber.killWs();
		this.config = config;
		this.candleSubscriber = new CandleSubscriber(config);
		this.candleFetcher = new CandleFetcher(config);
	};

	public releaseCandles = () => {
		return this.candleSubscriber.releaseCandles();
	};
}
