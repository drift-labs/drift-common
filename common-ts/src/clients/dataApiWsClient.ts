import { CandleResolution } from '@drift-labs/sdk';
import WS from 'isomorphic-ws';
import { EnvironmentConstants } from '../EnvironmentConstants';
import { JsonCandle, JsonTrade, MarketSymbol, UIEnv } from '../types';
import { Observable, Subject } from 'rxjs';

const getBaseDataApiUrl = (env: UIEnv) => {
	const constantEnv: keyof typeof EnvironmentConstants.dataServerUrl =
		env.isStaging ? 'staging' : env.isDevnet ? 'dev' : 'mainnet';
	const dataApiUrl = EnvironmentConstants.dataServerUrl[constantEnv];
	return dataApiUrl.replace('https://', '');
};

// Used by the subscriber client to subscribe to the candles websocket endpoint
type DataApiWsSubscriptionConfig = {
	resolution: CandleResolution;
	marketSymbol: MarketSymbol;
	env: UIEnv;
};

const getWsSubscriptionPath = (config: DataApiWsSubscriptionConfig) => {
	const baseDataApiUrl = getBaseDataApiUrl(config.env);
	return `wss://${baseDataApiUrl}/ws`;
};

const getWsSubscriptionMessage = (config: DataApiWsSubscriptionConfig) => {
	return JSON.stringify({
		type: 'subscribe',
		symbol: config.marketSymbol,
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

type WsUpdateMessage = WsSubscriptionMessage<'update'> & {
	candle: JsonCandle;
	trades: JsonTrade[];
};

export class DataApiWsClient {
	public readonly config: DataApiWsSubscriptionConfig;
	private ws: WS;
	private readonly candleSubject: Subject<JsonCandle>;
	private readonly tradesSubject: Subject<JsonTrade[]>;
	private readonly _candleObservable: Observable<JsonCandle>;
	private readonly _tradesObservable: Observable<JsonTrade[]>;

	constructor(config: DataApiWsSubscriptionConfig) {
		this.config = config;
		this.candleSubject = new Subject<JsonCandle>();
		this.tradesSubject = new Subject<JsonTrade[]>();
		this._candleObservable = this.candleSubject.asObservable();
		this._tradesObservable = this.tradesSubject.asObservable();
	}

	private handleWsMessage = (message: string) => {
		const parsedMessage = JSON.parse(
			message
		) as WsSubscriptionMessage<WsSubscriptionMessageType>;

		switch (parsedMessage.type) {
			case 'update':
				{
					const candle = (parsedMessage as WsUpdateMessage).candle;
					const trades = (parsedMessage as WsUpdateMessage).trades;
					if (candle) this.candleSubject.next(candle); // Candle should always be attached to update but doing this for safety
					if (trades) this.tradesSubject.next(trades); // Trades should always be attached to update but doing this for safety
				}
				break;
			default:
				break;
		}
	};

	public subscribe = async () => {
		this.ws = new WS(getWsSubscriptionPath(this.config));

		this.ws.onopen = (_event) => {
			this.ws.send(getWsSubscriptionMessage(this.config));
		};

		this.ws.onmessage = (incoming) => {
			// Forward message to all observers
			const message = incoming.data as string;
			this.handleWsMessage(message);
		};

		this.ws.onclose = (_event) => {
			console.debug(
				`candlesv2:: CANDLE_CLIENT WS CLOSED for ${this.config.marketSymbol}`
			);
		};
	};

	public kill = () => {
		// TODO :: Need to handle the case where the ws is not connected yet
		if (this.ws) {
			this.ws.send(JSON.stringify({ type: 'unsubscribe' }));
			this.ws.close();
			delete this.ws;
		}
		this.candleSubject.complete();
		this.tradesSubject.complete();
	};

	/**
	 * Get the candle updates stream
	 * @returns An observable that emits candle updates
	 */
	public get candlesObservable(): Observable<JsonCandle> {
		return this._candleObservable;
	}

	/**
	 * Get the trade updates stream
	 * @returns An observable that emits trade updates
	 */
	public get tradesObservable(): Observable<JsonTrade[]> {
		return this._tradesObservable;
	}
}
