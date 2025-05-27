type EventMap = {
	[K: string]: any;
};

type EventKey<T extends EventMap> = string & keyof T;
type EventListener<T> = (params: T) => void;

export class StrictEventEmitter<T extends EventMap> {
	private listeners: {
		[K in EventKey<T>]?: Array<EventListener<T[K]>>;
	} = {};

	on<K extends EventKey<T>>(event: K, listener: EventListener<T[K]>): void {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event]!.push(listener);
	}

	off<K extends EventKey<T>>(event: K, listener: EventListener<T[K]>): void {
		const eventListeners = this.listeners[event];
		if (!eventListeners) return;

		const index = eventListeners.indexOf(listener);
		if (index > -1) {
			eventListeners.splice(index, 1);
		}

		if (eventListeners.length === 0) {
			delete this.listeners[event];
		}
	}

	once<K extends EventKey<T>>(event: K, listener: EventListener<T[K]>): void {
		const onceWrapper = (params: T[K]) => {
			listener(params);
			this.off(event, onceWrapper);
		};
		this.on(event, onceWrapper);
	}

	emit<K extends EventKey<T>>(event: K, params: T[K]): void {
		const eventListeners = this.listeners[event];
		if (!eventListeners) return;

		eventListeners.forEach((listener) => {
			listener(params);
		});
	}

	removeAllListeners<K extends EventKey<T>>(event?: K): void {
		if (event) {
			delete this.listeners[event];
		} else {
			this.listeners = {};
		}
	}

	listenerCount<K extends EventKey<T>>(event: K): number {
		const eventListeners = this.listeners[event];
		return eventListeners ? eventListeners.length : 0;
	}
}
