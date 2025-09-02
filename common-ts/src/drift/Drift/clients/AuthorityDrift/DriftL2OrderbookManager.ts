import { Subject, Subscription } from 'rxjs';
import { MarketId } from '../../../../types';
import {
	L2WithOracleAndMarketData,
	RawL2Output,
	deserializeL2Response,
} from '../../../../utils/orderbook';
import { MultiplexWebSocket } from '../../../../utils/MultiplexWebSocket';
import {
	DLOB_SERVER_WEBSOCKET_UTILS,
	OrderbookGrouping,
} from '../../../../utils/dlob-server/DlobServerWebsocketUtils';
import { DEFAULT_ORDERBOOK_SUBSCRIPTION_CONFIG } from '../../constants/orderbook';

interface DriftL2OrderbookSubscription {
	marketId: MarketId;
	channel: 'orderbook_indicative' | 'orderbook';
	grouping: OrderbookGrouping;
}

interface DlobMessage {
	channel: string;
	data: string;
	error?: any;
}

export interface DriftL2OrderbookManagerConfig {
	wsUrl: string;
	subscriptionConfig?: DriftL2OrderbookSubscription;
}

export class DriftL2OrderbookManager {
	private _orderbook: L2WithOracleAndMarketData | null = null;
	private wsUrl: string;
	private _subscriptionConfig?: DriftL2OrderbookSubscription;
	private updatesSubject$ = new Subject<L2WithOracleAndMarketData>();
	private websocketSubscription: { unsubscribe: () => void } | null = null;

	constructor(config: DriftL2OrderbookManagerConfig) {
		this.wsUrl = config.wsUrl;
		this._subscriptionConfig = config.subscriptionConfig;
	}

	get store() {
		return this._orderbook ? { ...this._orderbook } : null;
	}

	get subscriptionConfig() {
		return this._subscriptionConfig;
	}

	/**
	 * Subscribe to orderbook updates via websocket
	 */
	public async subscribe(): Promise<void> {
		if (this.websocketSubscription) {
			console.error('There is already a subscription to the orderbook');
			return;
		}

		if (!this._subscriptionConfig) {
			return;
		}

		const subscriptionId = `orderbook-${Date.now()}`;
		const grouping = 100;

		const subscribeMessage = JSON.stringify(
			DLOB_SERVER_WEBSOCKET_UTILS.getSubscriptionProps({
				type: 'orderbook_indicative',
				market: this._subscriptionConfig.marketId,
				grouping,
			})
		);

		const unsubscribeMessage = JSON.stringify(
			DLOB_SERVER_WEBSOCKET_UTILS.getUnsubscriptionProps({
				type: 'orderbook_indicative',
				market: this._subscriptionConfig.marketId,
				grouping,
			})
		);

		const messageFilter = DLOB_SERVER_WEBSOCKET_UTILS.getMessageFilter({
			type: this._subscriptionConfig.channel,
			market: this._subscriptionConfig.marketId,
			grouping,
		});

		this.websocketSubscription = MultiplexWebSocket.createWebSocketSubscription(
			{
				wsUrl: this.wsUrl,
				subscriptionId,
				subscribeMessage,
				unsubscribeMessage,
				onMessage: (message: DlobMessage) => {
					this.handleWebSocketMessage(message);
				},
				onError: (error) => {
					console.error('OrderbookManager WebSocket error:', error);
				},
				messageFilter: (message: DlobMessage) => {
					return messageFilter(message);
				},
				errorMessageFilter: (message: DlobMessage) => {
					return !!message.error;
				},
				onClose: () => {
					console.log('OrderbookManager WebSocket connection closed');
				},
				enableHeartbeatMonitoring: true,
			}
		);
	}

	/**
	 * Unsubscribe from orderbook updates
	 */
	public unsubscribe(): void {
		if (this.websocketSubscription) {
			this.websocketSubscription.unsubscribe();
			this.websocketSubscription = null;
		}
	}

	/**
	 * Update market keys for subscription
	 */
	public updateSubscription(
		orderbookSubscription: Pick<DriftL2OrderbookSubscription, 'marketId'> &
			Partial<DriftL2OrderbookSubscription>
	): void {
		// check if subscription config is changing

		this._subscriptionConfig = {
			...this._subscriptionConfig,
			...orderbookSubscription,
			...DEFAULT_ORDERBOOK_SUBSCRIPTION_CONFIG,
		};

		this.unsubscribe();
		this.subscribe();
	}

	private tryParse(data: unknown): unknown {
		try {
			return JSON.parse(data as string, (key, value) => {
				// If the value is a number and it's too large to be safely represented as a JavaScript number,
				// convert it to a string to prevent precision loss
				if (typeof value === 'number' && !Number.isSafeInteger(value)) {
					return value.toString();
				}
				return value;
			});
		} catch (e) {
			return data;
		}
	}

	/**
	 * Handle incoming websocket messages
	 */
	private handleWebSocketMessage({ data }: DlobMessage): void {
		try {
			const parsedData = this.tryParse(data) as RawL2Output;

			// TODO: result slot incrementer

			const deserializedOrderbook = deserializeL2Response(parsedData);
			this._orderbook = deserializedOrderbook;
			this.updatesSubject$.next(deserializedOrderbook);
		} catch (error) {
			console.error('Error processing orderbook websocket message:', error);
		}
	}

	/**
	 * Get orderbook data for a specific market
	 */
	public getOrderbookData(): L2WithOracleAndMarketData | null {
		return this._orderbook || null;
	}

	/**
	 * Subscribe to orderbook updates
	 */
	public onUpdate(
		callback: (orderbookLookup: L2WithOracleAndMarketData) => void
	): Subscription {
		return this.updatesSubject$.subscribe(callback);
	}

	/**
	 * Destroy the manager and clean up resources
	 */
	public destroy(): void {
		this.unsubscribe();
		this.updatesSubject$.complete();
		this._orderbook = null;
	}
}
