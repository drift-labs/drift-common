import { Observable, Subject } from 'rxjs';

/**
 * This class creates an interval which multiple "subscribers" can add their "props" to.
 *
 * The interval has a base tick rate, and the subscribers add their tick multiple and props to the interval.
 *
 * The interval will tick at the base rate, and for each tick it will the props of any subscribers whose tick multiple is a factor of the current tick.
 */
export class SharedInterval<SubscriberProps> {
	private tickRate: number;
	private interval: ReturnType<typeof setTimeout>;
	private tickCount = 0;
	private subscription: Subject<SubscriberProps[]> = new Subject<
		SubscriberProps[]
	>();

	private subscribers = new Map<
		string,
		{
			tickMultiple: number;
			props: SubscriberProps;
		}
	>();

	constructor(tickRate: number) {
		this.tickRate = tickRate;
	}

	addSubscriber(tickMultiple: number, id: string, props: SubscriberProps) {
		this.subscribers.set(id, {
			tickMultiple,
			props,
		});
	}

	removeSubscriber(id: string) {
		this.subscribers.delete(id);
	}

	start() {
		this.interval = setInterval(() => {
			this.tickCount++;

			const propsForTick = Array.from(this.subscribers.values()).map(
				(subscriber) => {
					if (this.tickCount % subscriber.tickMultiple === 0) {
						return subscriber.props;
					}
				}
			);

			this.subscription.next(propsForTick);
		}, this.tickRate);
	}

	stop() {
		clearInterval(this.interval);
	}

	subscribe(): Observable<SubscriberProps[]> {
		return this.subscription.asObservable();
	}
}
