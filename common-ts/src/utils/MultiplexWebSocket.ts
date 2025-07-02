import { Subject, catchError, Subscription } from 'rxjs';
import WebSocket, { MessageEvent } from 'isomorphic-ws';

type WebSocketMessage<T = Record<string, unknown>> = T;

type HealthCheckConfig =
	| { enabled: false }
	| {
			enabled: true;
			intervalMs: number;
			unhealthyThresholdMs: number;
			maxReconnectAttempts: number;
			reconnectionWindowMs: number;
	  };

type WebSocketSubscriptionProps<T = Record<string, unknown>> = {
	wsUrl: string;
	subscriptionId: string;
	subscribeMessage: string;
	unsubscribeMessage: string;
	onError: (err?: any) => void;
	onMessage: (message: WebSocketMessage<T>) => void;
	messageFilter: (message: WebSocketMessage<T>) => boolean;
	errorMessageFilter: (message: WebSocketMessage<T>) => boolean;
	onClose?: () => void;
	healthCheck?: HealthCheckConfig;
};

type WebSocketSubscriptionState<T = Record<string, unknown>> =
	WebSocketSubscriptionProps<T> & {
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

type IMultiplexWebSocket<T = Record<string, unknown>> = {
	wsUrl: WebSocketUrl;
	webSocket: WebSocket;
	customConnectionState: WebSocketConnectionState;
	subject: Subject<WebSocketMessage<T>>;
	subscriptions: Map<
		SubscriptionId,
		Omit<WebSocketSubscriptionProps<T>, 'wsUrl' | 'subscriptionId'>
	>;
	healthCheck: {
		enabled: boolean;
		config: HealthCheckConfig;
		lastMessageTimestamp: number;
		reconnectTimeStamps: number[];
		interval?: ReturnType<typeof setInterval>;
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
export class MultiplexWebSocket<T = Record<string, unknown>>
	implements IMultiplexWebSocket<T>
{
	/**
	 * A lookup of all websockets by their URL.
	 */
	private static URL_TO_WEBSOCKETS_LOOKUP = new Map<
		WebSocketUrl,
		MultiplexWebSocket<any>
	>();

	/**
	 * A lookup from websocket URL to all subscription IDs for that URL.
	 */
	private static URL_TO_SUBSCRIPTION_IDS_LOOKUP = new Map<
		WebSocketUrl,
		Set<SubscriptionId>
	>();

	wsUrl: WebSocketUrl;
	#webSocket: WebSocket;
	customConnectionState: WebSocketConnectionState;
	subject: Subject<WebSocketMessage<T>>;
	subscriptions: Map<
		SubscriptionId,
		Omit<WebSocketSubscriptionState<T>, 'wsUrl' | 'subscriptionId'>
	>;
	healthCheck: {
		enabled: boolean;
		config: HealthCheckConfig;
		lastMessageTimestamp: number;
		reconnectTimeStamps: number[];
		interval?: ReturnType<typeof setInterval>;
	};

	private constructor(
		wsUrl: WebSocketUrl,
		initialHealthCheckConfig?: HealthCheckConfig
	) {
		if (MultiplexWebSocket.URL_TO_WEBSOCKETS_LOOKUP.has(wsUrl)) {
			throw new Error(
				`Attempting to create a new websocket for ${wsUrl}, but it already exists`
			);
		}

		this.wsUrl = wsUrl;
		this.customConnectionState = WebSocketConnectionState.CONNECTING;
		this.subject = new Subject<WebSocketMessage<T>>();
		this.subscriptions = new Map<
			SubscriptionId,
			Omit<WebSocketSubscriptionProps<T>, 'wsUrl' | 'subscriptionId'>
		>();

		// Default to health check disabled
		const healthCheckConfig: HealthCheckConfig = initialHealthCheckConfig || {
			enabled: false,
		};

		this.healthCheck = {
			enabled: healthCheckConfig.enabled,
			config: healthCheckConfig,
			lastMessageTimestamp: Date.now(),
			reconnectTimeStamps: [],
		};

		if (healthCheckConfig.enabled) {
			this.healthCheck.interval = setInterval(() => {
				this.startHealthCheck();
			}, healthCheckConfig.intervalMs);
		}

		this.webSocket = new WebSocket(wsUrl);

		MultiplexWebSocket.URL_TO_WEBSOCKETS_LOOKUP.set(wsUrl, this);
	}

	/**
	 * Creates a new virtual websocket subscription. If an existing websocket for the given URL exists, the subscription will be added to the existing websocket.
	 * Returns a function that can be called to unsubscribe from the subscription.
	 */
	public static createWebSocketSubscription<T = Record<string, unknown>>(
		props: WebSocketSubscriptionProps<T>
	): { unsubscribe: () => void } {
		const { wsUrl } = props;

		const doesWebSocketForWsUrlExist =
			MultiplexWebSocket.URL_TO_WEBSOCKETS_LOOKUP.has(wsUrl);

		if (doesWebSocketForWsUrlExist) {
			return this.handleNewSubForExistingWsUrl<T>(props);
		} else {
			// Create new websocket for new URL or reopen previously closed websocket
			return this.handleNewSubForNewWsUrl<T>(props);
		}
	}

	private static handleNewSubForNewWsUrl<T = Record<string, unknown>>(
		newSubscriptionProps: WebSocketSubscriptionProps<T>
	) {
		const newMWS = new MultiplexWebSocket<T>(
			newSubscriptionProps.wsUrl,
			newSubscriptionProps.healthCheck
		);

		newMWS.subscribe(newSubscriptionProps);

		return {
			unsubscribe: () => {
				newMWS.unsubscribe(newSubscriptionProps.subscriptionId);
			},
		};
	}

	private static handleNewSubForExistingWsUrl<T = Record<string, unknown>>(
		newSubscriptionProps: WebSocketSubscriptionProps<T>
	) {
		const { wsUrl, subscriptionId } = newSubscriptionProps;

		if (!MultiplexWebSocket.URL_TO_WEBSOCKETS_LOOKUP.has(wsUrl)) {
			throw new Error(
				`Attempting to subscribe to ${subscriptionId} on websocket ${wsUrl}, but websocket does not exist yet`
			);
		}

		const existingMWS = MultiplexWebSocket.URL_TO_WEBSOCKETS_LOOKUP.get(
			wsUrl
		) as MultiplexWebSocket<T>;

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
			if (this.healthCheck.enabled) {
				this.healthCheck.lastMessageTimestamp = Date.now();
			}
			const message = JSON.parse(
				messageEvent.data as string
			) as WebSocketMessage<T>;
			this.subject.next(message);
		};

		webSocket.onclose = () => {
			this.customConnectionState = WebSocketConnectionState.DISCONNECTED;
		};

		webSocket.onerror = (error) => {
			console.error('MultiplexWebSocket Error', { error, webSocket });

			// Forward error to all subscriptions for this websocket URL
			const subscriptionIds =
				MultiplexWebSocket.URL_TO_SUBSCRIPTION_IDS_LOOKUP.get(this.wsUrl);
			if (subscriptionIds) {
				for (const subscriptionId of subscriptionIds) {
					const subscription = this.subscriptions.get(subscriptionId);
					if (subscription) {
						subscription.onError(error);
					}
				}
			}
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
				next: (message: WebSocketMessage<T>) => {
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

	private subscribe(props: WebSocketSubscriptionProps<T>) {
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

		// Update URL to subscription IDs lookup
		if (!MultiplexWebSocket.URL_TO_SUBSCRIPTION_IDS_LOOKUP.has(this.wsUrl)) {
			MultiplexWebSocket.URL_TO_SUBSCRIPTION_IDS_LOOKUP.set(
				this.wsUrl,
				new Set()
			);
		}
		MultiplexWebSocket.URL_TO_SUBSCRIPTION_IDS_LOOKUP.get(this.wsUrl)!.add(
			subscriptionId
		);

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

			// Only send unsubscribe message if websocket is connected and ready to send.
			//// Otherwise, when the websocket DOES connect we don't have to worry about this subscription because we are deleting it from the subscriptions map. (Which only trigger their connections once the websocket becomes connected)
			if (
				this.customConnectionState === WebSocketConnectionState.CONNECTED &&
				this.webSocket.readyState === WebSocket.OPEN
			) {
				this.webSocket.send(subscriptionState.unsubscribeMessage);
			}

			this.subscriptions.delete(subscriptionId);

			// Update URL to subscription IDs lookup
			const subscriptionIds =
				MultiplexWebSocket.URL_TO_SUBSCRIPTION_IDS_LOOKUP.get(this.wsUrl);
			if (subscriptionIds) {
				subscriptionIds.delete(subscriptionId);
				if (subscriptionIds.size === 0) {
					MultiplexWebSocket.URL_TO_SUBSCRIPTION_IDS_LOOKUP.delete(this.wsUrl);
					// Close websocket when last subscriber unsubscribes
					this.close();
				}
			}
		}
	}

	private close() {
		for (const [subscriptionId] of this.subscriptions.entries()) {
			this.unsubscribe(subscriptionId);
		}

		this.subscriptions.clear();
		this.webSocket.close();
		if (this.healthCheck.interval) {
			clearInterval(this.healthCheck.interval);
		}
		MultiplexWebSocket.URL_TO_WEBSOCKETS_LOOKUP.delete(this.wsUrl);
		MultiplexWebSocket.URL_TO_SUBSCRIPTION_IDS_LOOKUP.delete(this.wsUrl);
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
	 * This method only runs if health check is enabled.
	 */
	private startHealthCheck() {
		if (!this.healthCheck.enabled) {
			return;
		}

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

		// Type guard to ensure we have enabled config with all required properties
		if (!this.healthCheck.config.enabled) {
			return;
		}

		const config = this.healthCheck.config;
		const isUnhealthy =
			Date.now() - this.healthCheck.lastMessageTimestamp >
			config.unhealthyThresholdMs;

		if (isUnhealthy) {
			const numOfReconnectsInWindow =
				this.healthCheck.reconnectTimeStamps.filter(
					(timestamp) => timestamp > Date.now() - config.reconnectionWindowMs
				).length;

			const exceedsMaxReconnectAttempts =
				numOfReconnectsInWindow >= config.maxReconnectAttempts;

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
