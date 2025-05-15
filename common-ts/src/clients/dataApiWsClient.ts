import { CandleResolution } from '@drift-labs/sdk';
import WS from 'isomorphic-ws';
import { EnvironmentConstants } from '../EnvironmentConstants';
import { MarketSymbol, UIEnv } from '../types';
import { Observable, Subject } from 'rxjs';

const getBaseDataApiUrl = (env: UIEnv) => {
	const constantEnv: keyof typeof EnvironmentConstants.dataServerUrl =
		env.isStaging ? 'staging' : env.isDevnet ? 'dev' : 'mainnet';
	const dataApiUrl = EnvironmentConstants.dataServerUrl[constantEnv];
	return dataApiUrl.replace('https://', '');
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

export type JsonTrade = {
	action: string;
	actionExplanation: string;
	baseAssetAmountFilled: number;
	bitFlags: number;
	createdAt: number;
	entity: string;
	fillRecordId: string;
	filler: string;
	fillerReward: number;
	maker: string;
	makerFee: number;
	makerOrderBaseAssetAmount: number;
	makerOrderCumulativeBaseAssetAmountFilled: number;
	makerOrderCumulativeQuoteAssetAmountFilled: number;
	makerOrderDirection: string;
	makerOrderId: number;
	makerRebate: number;
	marketFilter: string;
	marketIndex: number;
	marketType: string;
	oraclePrice: number;
	price: number;
	quoteAssetAmountFilled: number;
	quoteAssetAmountSurplus: number;
	referrerReward: number;
	slot: number;
	spotFulfillmentMethodFee: number;
	symbol: string;
	taker: string;
	takerFee: number;
	takerOrderBaseAssetAmount: number;
	takerOrderCumulativeBaseAssetAmountFilled: number;
	takerOrderCumulativeQuoteAssetAmountFilled: number;
	takerOrderDirection: string;
	takerOrderId: number;
	ts: number;
	txSig: string;
	txSigIndex: number;
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
					this.candleSubject.next(candle);
					this.tradesSubject.next(trades);
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
