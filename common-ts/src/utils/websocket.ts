import WS from 'isomorphic-ws';
import { Subject } from 'rxjs';

/**
 * Logic for websocket with a shared instance:
 * - Listeners with a common ws-key share a ws instance.
 * - Different ws instances can point at the same url if necessary (NOT IMPLEMENTED YET : TODO)
 * - Each ws creates a multiplexed subject which subscribers can listen to. (they need to filter messages for their own purposes)
 * - Websockets have a timeout which is used to detect when messages have stopped coming through.
 * - When a websocket times out it:
 * 	- increments its reconnect attempts
 * 		- calls the listeners error handlers if it exceeds its maximum retry attempts
 * 		- restarts the connections for all of its listeners if it doesn't exceed the maximum retry attempts
 * - When a websocket receives a message it:
 * 	- Resets its timeout
 * 	- Forwards the message to all listeners
 *
 * - Listeners need a:
 * 	- Websocket URL
 * 	- Subscribing message callback
 * 	- Handle Error callback
 * 	- ? Unsubscribing message callback // TODO - assume never unsubscribe just
 * 	- ? Handle Disconnect callback // TODO - assume error for now
 *
 * Each websockets reconnection attempts counter also decays so that healthy connections don't inevitably fall back from odd quiet periods
 */

// The websocket will try to reconnect if there is a larger gap than the reconnection delay between messages. At the minimum we expect a heartbeat from the ws server every 5 seconds. Double it to give breathing room.
const DEFAULT_RECONNECTION_DELAY_MS = 10_000;
const DEFAULT_MAX_RECONNECTION_DELAY_MS = 10_000;
// Times that the websocket will allow itself to reconnect before throwing an error (when we assume things are not working).
const DEFAULT_MAX_RECONNECTION_ATTEMPTS = 3;
// Time allowed for the first message from the websocket
const FIRST_CONNECTION_SAFE_TIMEOUT_MS = 2_000;
const DEFAULT_RECONNECT_COUNT_DECAY_MS = DEFAULT_MAX_RECONNECTION_DELAY_MS * 3;

const WS_KILLING_DELAY = 3_000;

export type WebSocketMessage = {
	channel: string;
	data: any;
};

type ListenerState = {
	subscribeMessage: string;
	unsubscribeMessage: string;
	onError: (err?: any) => void;
};

enum WEBSOCKET_CONNECTION_STATE {
	DISCONNECTED,
	CONNECTED,
	GOING_TO_CONNECT,
	GOING_TO_DISCONNECT,
}

type WebsocketState = {
	ws: WS;
	connectionState: WEBSOCKET_CONNECTION_STATE;
	reconnectAttempts: number;
	reconnectCountDecayInterval: ReturnType<typeof setInterval>;
	timeout: ReturnType<typeof setTimeout> | undefined;
	reconnectDelayMs: number;
	maxReconnectionAttempts: number;
	subject: Subject<WebSocketMessage>;
	listeners: Map<string, ListenerState>;
};

type ListenerProps = {
	wsUrl: string;
	listenerId: string;
	subscribeMessage: string;
	unsubscribeMessage: string;
	onError: (err?: any) => void;
};

const DEFAULT_WS_STATE = {
	reconnectAttempts: 0,
	timeout: undefined as ReturnType<typeof setTimeout> | undefined,
	reconnectDelayMs: DEFAULT_RECONNECTION_DELAY_MS,
	maxReconnectionAttempts: DEFAULT_MAX_RECONNECTION_ATTEMPTS,
};

/**
 * @deprecated Use MultiplexWebSocket instead
 */
class WebsocketUtilClass {
	private wsStateLookup = new Map<string, WebsocketState>();

	private addNewListenerToMap(
		props: ListenerProps,
		listenerMap: Map<string, ListenerState>
	) {
		listenerMap.set(props.listenerId, {
			onError: props.onError,
			subscribeMessage: props.subscribeMessage,
			unsubscribeMessage: props.unsubscribeMessage,
		});
	}

	private handleReconnectCountDecay(wsUrl: string) {
		const wsState = this.wsStateLookup.get(wsUrl);
		if (wsState && wsState.reconnectAttempts > 0) {
			wsState.reconnectAttempts--;
		}
	}

	private cleanupWs(wsUrl: string) {
		const wsState = this.wsStateLookup.get(wsUrl);
		if (!wsState) {
			return;
		}
		wsState.ws.close();
		clearTimeout(wsState.timeout);
		clearInterval(wsState.reconnectCountDecayInterval);
		this.wsStateLookup.delete(wsUrl);
	}

	private createNewWsState(props: ListenerProps) {
		if (this.wsStateLookup.get(props.wsUrl)) {
			throw new Error('Tried to override existing ws state');
		}

		const listenerMap = new Map<string, ListenerState>();
		this.addNewListenerToMap(props, listenerMap);

		const newWs = new WS(props.wsUrl);

		const newWsState: WebsocketState = {
			ws: newWs,
			connectionState: WEBSOCKET_CONNECTION_STATE.GOING_TO_CONNECT,
			reconnectAttempts: DEFAULT_WS_STATE.reconnectAttempts,
			reconnectCountDecayInterval: setInterval(() => {
				this.handleReconnectCountDecay(props.wsUrl);
			}, DEFAULT_RECONNECT_COUNT_DECAY_MS),
			timeout: DEFAULT_WS_STATE.timeout,
			reconnectDelayMs: DEFAULT_WS_STATE.reconnectDelayMs,
			maxReconnectionAttempts: DEFAULT_WS_STATE.maxReconnectionAttempts,
			listeners: listenerMap,
			subject: new Subject<WebSocketMessage>(),
		};

		this.wsStateLookup.set(props.wsUrl, newWsState);
	}

	private handleWebsocketStateForNewListener(props: ListenerProps): {
		isNewWs: boolean;
	} {
		const currentWsState = this.wsStateLookup.get(props.wsUrl);

		if (currentWsState) {
			if (currentWsState.listeners.get(props.listenerId)) {
				throw new Error(
					'Trying to subscribe two listeners with the same ID to the same websocket'
				);
			} else {
				this.addNewListenerToMap(props, currentWsState.listeners);
			}
			return { isNewWs: false };
		} else {
			this.createNewWsState(props);
			return { isNewWs: true };
		}
	}

	private startListenerSubscription(wsUrl: string, listenerId: string) {
		const wsState = this.wsStateLookup.get(wsUrl);
		if (!wsState) return;

		const ws = wsState.ws;

		if (ws.readyState === ws.OPEN) {
			const listenerState = wsState.listeners.get(listenerId);
			if (listenerState) {
				ws.send(listenerState.subscribeMessage);
			}
		} else {
			this.refreshConnection(wsUrl);
		}
	}

	private clearTimeout(wsUrl: string) {
		const wsState = this.wsStateLookup.get(wsUrl);
		if (wsState?.timeout) {
			clearTimeout(wsState.timeout);
		}
	}

	private removeListener(wsUrl: string, listenerId: string) {
		const wsState = this.wsStateLookup.get(wsUrl);

		if (wsState) {
			const listener = wsState.listeners.get(listenerId);
			wsState.listeners.delete(listenerId);

			if (wsState.ws.readyState === wsState.ws.OPEN && listener) {
				wsState.ws.send(listener.unsubscribeMessage);
			}

			if (wsState.listeners.size === 0) {
				setTimeout(() => {
					if (wsState.listeners.size === 0) {
						this.cleanupWs(wsUrl);
					}
				}, WS_KILLING_DELAY);
			}
		}
	}

	private handleExceededMaxReconnectAttempts(wsUrl: string) {
		const wsState = this.wsStateLookup.get(wsUrl);
		if (wsState) {
			for (const [listenerId, listener] of wsState.listeners.entries()) {
				this.removeListener(wsUrl, listenerId);
				listener.onError();
			}
		}
	}

	private refreshConnection(wsUrl: string) {
		const wsState = this.wsStateLookup.get(wsUrl);
		if (!wsState) return;

		const ws = wsState.ws;

		// Close the previous connection
		if (ws.readyState === ws.OPEN) {
			ws.close();
		} else {
			ws.onopen = () => {
				ws.onclose = () => {}; // Remove onclose event listener
				ws.close();
			};
		}

		// Create a new WS
		const newWs = new WS(wsUrl);

		// Add WS to state
		wsState.ws = newWs;

		// Link the new WS to the existing listeners
		this.handleNewWs(wsUrl);
	}

	private handleNoMessageTimeout(wsUrl: string) {
		const wsState = this.wsStateLookup.get(wsUrl);
		if (!wsState) return;

		if (
			wsState.connectionState === WEBSOCKET_CONNECTION_STATE.DISCONNECTED ||
			wsState.connectionState === WEBSOCKET_CONNECTION_STATE.GOING_TO_DISCONNECT
		) {
			return;
		}

		this.clearTimeout(wsUrl);

		wsState.reconnectAttempts++;
		if (wsState.reconnectAttempts >= wsState.maxReconnectionAttempts) {
			wsState.connectionState = WEBSOCKET_CONNECTION_STATE.GOING_TO_DISCONNECT;
			this.handleExceededMaxReconnectAttempts(wsUrl);
		} else {
			wsState.reconnectDelayMs = Math.min(
				wsState.reconnectDelayMs * 2,
				DEFAULT_MAX_RECONNECTION_DELAY_MS
			);
			this.refreshConnection(wsUrl);
			this.restartNoMessageTimeout(wsUrl);
		}
	}

	private restartNoMessageTimeout(wsUrl: string, firstTimeout?: boolean) {
		this.clearTimeout(wsUrl);
		const wsState = this.wsStateLookup.get(wsUrl);
		if (!wsState) return;

		if (
			wsState.connectionState === WEBSOCKET_CONNECTION_STATE.GOING_TO_DISCONNECT
		) {
			return;
		}

		// Use a different timeout for the first connection because we know it can be a little bit slower
		const timeoutDelay = firstTimeout
			? FIRST_CONNECTION_SAFE_TIMEOUT_MS
			: wsState.reconnectDelayMs;
		wsState.timeout = setTimeout(() => {
			this.handleNoMessageTimeout(wsUrl);
		}, timeoutDelay);
	}

	/**
	 * Send subscription message for all relevant listeners
	 * @param wsUrl
	 */
	private handleWsConnected(wsUrl: string) {
		const wsState = this.wsStateLookup.get(wsUrl);
		if (wsState) {
			for (const [listenerId, _listenerState] of wsState.listeners) {
				this.startListenerSubscription(wsUrl, listenerId);
			}
		}
	}

	private handleNewWs(wsUrl: string) {
		const wsState = this.wsStateLookup.get(wsUrl);
		if (!wsState) return;

		const ws = wsState.ws;

		ws.onopen = (_event) => {
			wsState.connectionState = WEBSOCKET_CONNECTION_STATE.CONNECTED;
			this.handleWsConnected(wsUrl);
		};

		ws.onmessage = (incoming) => {
			this.restartNoMessageTimeout(wsUrl);

			// Forward message to all observers
			const messageData = incoming.data as string;
			// Use JSON.parse with reviver to preserve large numbers as strings
			const message = JSON.parse(messageData, (key, value) => {
				// If the value is a number and it's too large to be safely represented as a JavaScript number,
				// convert it to a string to prevent precision loss
				if (typeof value === 'number') {
					const isSafe = Number.isSafeInteger(value);
					if (!isSafe) {
						return value.toString();
					}
				}
				return value;
			}) as WebSocketMessage;
			wsState.subject.next(message);
		};

		ws.onclose = () => {
			wsState.connectionState = WEBSOCKET_CONNECTION_STATE.DISCONNECTED;
		};

		this.restartNoMessageTimeout(wsUrl, true);
	}

	public createWebsocketListener(props: ListenerProps): {
		unsubscribe: () => void;
		subject: Subject<WebSocketMessage>;
	} {
		const { isNewWs } = this.handleWebsocketStateForNewListener(props);

		if (isNewWs) {
			this.handleNewWs(props.wsUrl);
		}

		const wsState = this.wsStateLookup.get(props.wsUrl);
		if (!wsState) {
			throw new Error('WebSocket state not found after creation');
		}
		const subject = wsState.subject;

		if (!isNewWs) {
			// Only fire this immediately if it's an existing ws. If it's a new WS then the listener will start once the ws has finished connecting.
			this.startListenerSubscription(props.wsUrl, props.listenerId);
		}

		return {
			unsubscribe: () => {
				this.removeListener(props.wsUrl, props.listenerId);
			},
			subject,
		};
	}
}

export default WebsocketUtilClass;
