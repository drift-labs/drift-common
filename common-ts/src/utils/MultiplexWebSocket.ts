import { Subject, catchError, Subscription } from 'rxjs';
import WebSocket, { MessageEvent } from 'isomorphic-ws';

export type WebSocketMessage = {
	channel: string;
	data: any;
};

type WebSocketSubscriptionProps = {
	wsUrl: string;
	subscriptionId: string;
	subscribeMessage: string;
	unsubscribeMessage: string;
	onError: (err?: any) => void;
	onMessage: (message: WebSocketMessage) => void;
	messageFilter: (message: WebSocketMessage) => boolean;
	errorMessageFilter: (message: WebSocketMessage) => boolean;
	onClose?: () => void;
};

type WebSocketSubscriptionState = WebSocketSubscriptionProps & {
	hasSentSubscribeMessage?: boolean;
	subjectSubscription?: Subscription;
};

type WebSocketUrl = string;
type SubscriptionId = string;

enum WebSocketConnectionState {
	CONNECTING,
	CONNECTED,
	DISCONNECTING,
	DISCONNECTED,
}

type IMultiplexWebSocket = {
	wsUrl: WebSocketUrl;
	webSocket: WebSocket;
	customConnectionState: WebSocketConnectionState;
	subject: Subject<WebSocketMessage>;
	subscriptions: Map<
		SubscriptionId,
		Omit<WebSocketSubscriptionProps, 'wsUrl' | 'subscriptionId'>
	>;
	healthCheck: {
		lastMessageTimestamp: number;
		reconnectTimeStamps: number[];
		interval: ReturnType<typeof setInterval>;
	};
};

/**
 * MultiplexWebSocket allows for multiple subscriptions to a single websocket of the same URL, improving efficiency and reducing the number of open connections.
 *
 * This implementation assumes the following:
 * - All websocket streams are treated equally - health checks and reconnection attempts are performed at the same standards
 * - All messages returned are in the `WebSocketMessage` format
 *
 * Internal implementation details:
 * - There is a health check that runs at an interval
 * - The websocket is closed when the number of subscriptions is 0 (occurs during health check)
 * - The websocket will be refreshed (new instance) when it is unhealthy, until it reaches the maximum number of reconnect attempts
 */
export class MultiplexWebSocket implements IMultiplexWebSocket {
	/**
	 * A lookup of all websockets by their URL.
	 */
	static WEBSOCKETS_LOOKUP = new Map<WebSocketUrl, MultiplexWebSocket>();

	/**
	 * The maximum number of reconnect attempts for a websocket, before throwing an error.
	 */
	static MAX_RECONNECT_ATTEMPTS = 3;

	/**
	 * The interval at which the websocket will check if it is still connected.
	 */
	static CONNECTION_HEALTH_CHECK_INTERVAL_MS = 5_000;

	/**
	 * The number of milliseconds between messages before considering the websocket unhealthy.
	 */
	static CONNECTION_HEALTH_CHECK_UNHEALTHY_THRESHOLD_MS = 10_000;

	/**
	 * The number of milliseconds to consider when checking if the websocket has exceeded the maximum number of reconnect attempts.
	 * A buffer is added to account for the time it takes for the websocket to reconnect.
	 */
	static RECONNECTION_ATTEMPTS_SLIDING_WINDOW_MS =
		MultiplexWebSocket.CONNECTION_HEALTH_CHECK_UNHEALTHY_THRESHOLD_MS *
		MultiplexWebSocket.MAX_RECONNECT_ATTEMPTS *
		1.5;

	wsUrl: WebSocketUrl;
	#webSocket: WebSocket;
	customConnectionState: WebSocketConnectionState;
	subject: Subject<WebSocketMessage>;
	subscriptions: Map<
		SubscriptionId,
		Omit<WebSocketSubscriptionState, 'wsUrl' | 'subscriptionId'>
	>;
	healthCheck: {
		lastMessageTimestamp: number;
		reconnectTimeStamps: number[];
		interval: ReturnType<typeof setInterval>;
	};

	private constructor(wsUrl: WebSocketUrl) {
		if (MultiplexWebSocket.WEBSOCKETS_LOOKUP.has(wsUrl)) {
			throw new Error(
				`Attempting to create a new websocket for ${wsUrl}, but it already exists`
			);
		}

		this.wsUrl = wsUrl;
		this.customConnectionState = WebSocketConnectionState.CONNECTING;
		this.subject = new Subject<WebSocketMessage>();
		this.subscriptions = new Map<
			SubscriptionId,
			Omit<WebSocketSubscriptionProps, 'wsUrl' | 'subscriptionId'>
		>();
		this.healthCheck = {
			lastMessageTimestamp: Date.now(),
			reconnectTimeStamps: [],
			interval: setInterval(() => {
				this.startHealthCheck();
			}, MultiplexWebSocket.CONNECTION_HEALTH_CHECK_INTERVAL_MS),
		};
		this.webSocket = new WebSocket(wsUrl);

		MultiplexWebSocket.WEBSOCKETS_LOOKUP.set(wsUrl, this);
	}

	/**
	 * Creates a new virtual websocket subscription. If an existing websocket for the given URL exists, the subscription will be added to the existing websocket.
	 * Returns a function that can be called to unsubscribe from the subscription.
	 */
	public static createWebSocketSubscription(
		props: WebSocketSubscriptionProps
	): { unsubscribe: () => void } {
		const { wsUrl } = props;

		const doesWebSocketForWsUrlExist =
			MultiplexWebSocket.WEBSOCKETS_LOOKUP.has(wsUrl);

		if (doesWebSocketForWsUrlExist) {
			return this.handleNewSubForExistingWsUrl(props);
		} else {
			return this.handleNewSubForNewWsUrl(props);
		}
	}

	private static handleNewSubForNewWsUrl(
		newSubscriptionProps: WebSocketSubscriptionProps
	) {
		const newMWS = new MultiplexWebSocket(newSubscriptionProps.wsUrl);

		newMWS.subscribe(newSubscriptionProps);

		return {
			unsubscribe: () => {
				newMWS.unsubscribe(newSubscriptionProps.subscriptionId);
			},
		};
	}

	private static handleNewSubForExistingWsUrl(
		newSubscriptionProps: WebSocketSubscriptionProps
	) {
		const { wsUrl, subscriptionId } = newSubscriptionProps;

		if (!MultiplexWebSocket.WEBSOCKETS_LOOKUP.has(wsUrl)) {
			throw new Error(
				`Attempting to subscribe to ${subscriptionId} on websocket ${wsUrl}, but websocket does not exist yet`
			);
		}

		const existingMWS = MultiplexWebSocket.WEBSOCKETS_LOOKUP.get(wsUrl);

		// Track new subscription for existing websocket
		existingMWS.subscribe(newSubscriptionProps);

		return {
			unsubscribe: () => {
				existingMWS.unsubscribe(newSubscriptionProps.subscriptionId);
			},
		};
	}

	get webSocket() {
		return this.#webSocket;
	}

	/**
	 * Setting the WebSocket instance will automatically add event handlers to the WebSocket instance.
	 * When the WebSocket is connected, all existing subscriptions will be subscribed to.
	 */
	set webSocket(webSocket: WebSocket) {
		webSocket.onopen = () => {
			this.customConnectionState = WebSocketConnectionState.CONNECTED;
			// sends subscription message for each subscription for those that are added before the websocket is connected
			for (const [subscriptionId] of this.subscriptions.entries()) {
				this.subscribeToWebSocket(subscriptionId);
			}
		};

		webSocket.onmessage = (messageEvent: MessageEvent) => {
			this.healthCheck.lastMessageTimestamp = Date.now();
			const message = JSON.parse(
				messageEvent.data as string
			) as WebSocketMessage;
			this.subject.next(message);
		};

		webSocket.onclose = () => {
			this.customConnectionState = WebSocketConnectionState.DISCONNECTED;
		};

		this.#webSocket = webSocket;
	}

	private subscribeToWebSocket(subscriptionId: SubscriptionId) {
		const subscriptionState = this.subscriptions.get(subscriptionId);

		const {
			subscribeMessage,
			onError,
			onMessage,
			messageFilter,
			errorMessageFilter,
			onClose,
		} = subscriptionState;

		this.webSocket.send(subscribeMessage);
		if (subscriptionState) {
			subscriptionState.hasSentSubscribeMessage = true;
		}

		const subjectSubscription = this.subject
			.pipe(
				catchError((err) => {
					console.error('Caught websocket error', err);
					onError();
					return [];
				})
			)
			.subscribe({
				next: (message: WebSocketMessage) => {
					try {
						if (!messageFilter(message)) return;

						if (errorMessageFilter(message)) {
							onError();
							return;
						}

						onMessage(message);
					} catch (err) {
						console.error('Error parsing websocket message', err);
						onError();
					}
				},
				error: (err) => {
					console.error('Error subscribing to websocket', err);
					onError();
				},
				complete: () => {
					if (onClose) {
						onClose();
					}
				},
			});

		subscriptionState.subjectSubscription = subjectSubscription;
	}

	private subscribe(props: WebSocketSubscriptionProps) {
		const {
			subscriptionId,
			subscribeMessage,
			unsubscribeMessage,
			onError,
			onMessage,
			messageFilter,
			errorMessageFilter,
			onClose,
		} = props;

		if (this.subscriptions.get(subscriptionId)) {
			throw new Error(
				`Attempting to subscribe to ${subscriptionId} on websocket ${this.wsUrl}, but subscription already exists`
			);
		}

		this.subscriptions.set(subscriptionId, {
			subscribeMessage,
			unsubscribeMessage,
			onError,
			onMessage,
			messageFilter,
			errorMessageFilter,
			onClose,
			hasSentSubscribeMessage: false,
		});

		if (this.customConnectionState === WebSocketConnectionState.CONNECTED) {
			this.subscribeToWebSocket(subscriptionId);
		} else if (
			this.customConnectionState === WebSocketConnectionState.CONNECTING
		) {
			// do nothing, subscription will automatically start when websocket is connected
		} else {
			// handle case where websocket is disconnecting/disconnected
			this.refreshWebSocket();
		}
	}

	private unsubscribe(subscriptionId: SubscriptionId) {
		const subscriptionState = this.subscriptions.get(subscriptionId);
		if (subscriptionState) {
			subscriptionState.subjectSubscription?.unsubscribe();
			this.webSocket.send(subscriptionState.unsubscribeMessage);
			this.subscriptions.delete(subscriptionId);
		}
	}

	private close() {
		for (const [subscriptionId] of this.subscriptions.entries()) {
			this.unsubscribe(subscriptionId);
		}

		this.subscriptions.clear();
		this.webSocket.close();
		clearInterval(this.healthCheck.interval);
		MultiplexWebSocket.WEBSOCKETS_LOOKUP.delete(this.wsUrl);
	}

	private refreshWebSocket() {
		const currentWebSocket = this.webSocket;
		currentWebSocket.onopen = () => {
			// in the event where the websocket has yet to connect, we close the connection after it is connected
			currentWebSocket.onclose = () => {};
			currentWebSocket.close();
		};
		currentWebSocket.close();

		this.subscriptions.forEach((subscription) => {
			subscription.hasSentSubscribeMessage = false;
		});

		this.webSocket = new WebSocket(this.wsUrl);
	}

	/**
	 * The health check is used to determine if the websocket is still connected.
	 * If there isn't any subscriptions, the websocket will be closed.
	 * If the websocket is unhealthy, it will be refreshed until it reaches the maximum number of reconnect attempts, where it will then be closed.
	 */
	private startHealthCheck() {
		if (
			[
				WebSocketConnectionState.DISCONNECTING,
				WebSocketConnectionState.DISCONNECTED,
			].includes(this.customConnectionState)
		) {
			// do nothing, since the websocket is already in the process of disconnecting/disconnected
			return;
		}

		if (this.subscriptions.size === 0) {
			this.close();
			return;
		}

		const isUnhealthy =
			Date.now() - this.healthCheck.lastMessageTimestamp >
			MultiplexWebSocket.CONNECTION_HEALTH_CHECK_UNHEALTHY_THRESHOLD_MS;

		if (isUnhealthy) {
			const numOfReconnectsInWindow =
				this.healthCheck.reconnectTimeStamps.filter(
					(timestamp) =>
						timestamp >
						Date.now() -
							MultiplexWebSocket.RECONNECTION_ATTEMPTS_SLIDING_WINDOW_MS
				).length;

			const exceedsMaxReconnectAttempts =
				numOfReconnectsInWindow >= MultiplexWebSocket.MAX_RECONNECT_ATTEMPTS;

			if (exceedsMaxReconnectAttempts) {
				for (const [
					subscriptionId,
					subscriptionState,
				] of this.subscriptions.entries()) {
					subscriptionState.onError();
					this.unsubscribe(subscriptionId);
				}
			} else {
				this.refreshWebSocket();
				this.healthCheck.reconnectTimeStamps.push(Date.now());
			}
		}
	}
}
