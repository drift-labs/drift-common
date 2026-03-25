export type SystemEvents = {
	system_unmatched_error: {
		error_message?: string;
		error_stack?: string;
		error_raw: unknown;
		wallet?: string;
	};
	system_transaction_error: {
		errorClass?: string;
		errorId?: string;
	};
	system_unhandled_error: {
		error_message: string | unknown;
		source?: string;
		lineno?: number;
		colno?: number;
		stack?: string;
		url: string;
		timestamp: string;
		authority?: string;
	};
	system_unhandled_promise_rejection: {
		error_message: string;
		stack?: string;
		url: string;
		timestamp: string;
		authority?: string;
	};
	system_performance_snapshot: {
		requestsPerMinute?: number;
		maxSlotGapMs?: number;
		maxSlotGapCount?: number;
		totalJSHeapSize?: number;
		usedJSHeapSize?: number;
		eventLoopLag?: number[];
		dlobSource?: {
			source: string;
			marketId: string;
		};
		primarySubscriptionMethod?: string;
		metricsId?: string;
		historyServerRequestsTarget?: unknown;
		historyServerRequestsSource?: unknown;
	};
	system_startup_time: {
		metricKey: string;
		timeMs: number;
	};
};
