import { Subject, Observable } from 'rxjs';
import { MarketId, MarketKey } from '../../../types/MarketId';
import {
	L2WithOracleAndMarketData,
	RawL2Output,
	deserializeL2Response,
} from '../../../utils/orderbook';
import { PollingSequenceGuard } from '../../../utils/pollingSequenceGuard';
import { PollingCategory } from '../constants/blockchain';

export interface PollingConfig {
	driftDlobServerHttpUrl: string;
	indicativeLiquidityEnabled?: boolean;
	groupingSize?: number;
}

export interface PollingInterval {
	id: string;
	intervalMultiplier: number;
	depth: number;
	markets: Set<MarketKey>;
	/**
	 * Used to track markets that were added to an interval in the current tick, so that they get polled on the next tick regardless of interval multiplier.
	 * Otherwise, they would only get polled on the next interval, which could be a long time if the interval multiplier is high.
	 */
	newlyAddedMarkets: Set<MarketKey>;
}

export interface MarketPollingData {
	marketId: MarketId;
	data: L2WithOracleAndMarketData;
}

export interface BulkL2FetchingQueryParams {
	marketIndex: number;
	marketType: string;
	depth: number;
	includeVamm: boolean;
	includePhoenix: boolean;
	includeOpenbook: boolean;
	includeSerum: boolean;
	includeOracle: boolean;
	includeIndicative: boolean;
}

export interface BulkL2FetchingParams {
	markets: (BulkL2FetchingQueryParams & { intervalMultiplier: number })[];
	grouping?: number;
}

const BACKGROUND_L2_POLLING_KEY = Symbol('BACKGROUND_L2_POLLING_KEY');

// Predefined interval multipliers from the original React hook
export const POLLING_INTERVALS = {
	LIVE_MARKET: 1,
	BACKGROUND_DEEP: 3, // Can be configured to 2 for interim usage
	BACKGROUND_SHALLOW: 30,
	IDLE_1: 30,
	IDLE_2: 60,
} as const;

export const POLLING_DEPTHS = {
	SHALLOW: 1,
	DEEP: 1,
	ORDERBOOK: 100,
} as const;

/**
 * PollingDlob - A configurable market data polling system.
 * The Drift DLOB (decentralized limit orderbook) server stores the current live state of the orderbook
 * across all Drift markets. This class is used to poll the DLOB server for the markets' current mark price,
 * while oracle price data is also provided alongside.
 *
 * Example usage:
 * ```typescript
 * import { PollingDlob, MarketId } from '@drift/common';
 *
 * const pollingDlob = new PollingDlob({
 *   dlobServerHttpUrl: 'https://dlob.drift.trade',
 *   indicativeLiquidityEnabled: true
 * });
 *
 * // Add different polling intervals
 * pollingDlob.addInterval('live', 1, 100);        // Every 1s with depth 100
 * pollingDlob.addInterval('background', 3, 1);    // Every 3s with depth 1
 * pollingDlob.addInterval('idle', 30, 1);         // Every 30s with depth 1
 *
 * // Add markets to intervals
 * const perpMarket = MarketId.createPerpMarket(0);
 * const spotMarket = MarketId.createSpotMarket(0);
 *
 * pollingDlob.addMarketToInterval('live', perpMarket);
 * pollingDlob.addMarketToInterval('background', spotMarket);
 *
 * // Subscribe to data updates
 * pollingDlob.onData().subscribe(marketData => {
 *   marketData.forEach(({ marketId, data, intervalId }) => {
 *     console.log(`Market ${marketId.key} data from ${intervalId}:`, data);
 *   });
 * });
 *
 * // Subscribe to errors
 * pollingDlob.onError().subscribe(error => {
 *   console.error('Polling error:', error);
 * });
 *
 * // Start polling
 * pollingDlob.start();
 *
 * // Stop when done
 * // pollingDlob.stop();
 * ```
 */

export class PollingDlob {
	private config: PollingConfig;
	private baseTickIntervalMs = 1000;
	private intervals: Map<string, PollingInterval> = new Map();
	private _marketToIntervalMap: Map<MarketKey, string> = new Map();
	private dataSubject: Subject<MarketPollingData[]> = new Subject();
	private errorSubject: Subject<Error> = new Subject();
	private isStarted = false;
	private intervalHandle: NodeJS.Timeout | null = null;
	private tickCounter = 0;
	private consecutiveEmptyResponseCount = 0;
	private consecutiveErrorCount = 0;
	private readonly maxConsecutiveEmptyResponses = 3;
	private readonly maxConsecutiveErrors = 5;

	constructor(config: PollingConfig) {
		this.config = {
			indicativeLiquidityEnabled: true,
			...config,
		};
	}

	public getPollingIntervalForMarket(
		marketKey: MarketKey
	): PollingInterval | undefined {
		const intervalId = this._marketToIntervalMap.get(marketKey);
		if (!intervalId) {
			return undefined;
		}

		return this.intervals.get(intervalId);
	}

	public addInterval(
		id: string,
		intervalMultiplier: number,
		depth: number
	): void {
		if (this.intervals.has(id)) {
			throw new Error(`Interval with id '${id}' already exists`);
		}

		this.intervals.set(id, {
			id,
			intervalMultiplier,
			depth,
			markets: new Set(),
			newlyAddedMarkets: new Set(),
		});
	}

	public removeInterval(id: string): void {
		const interval = this.intervals.get(id);
		if (!interval) {
			return;
		}

		// Remove all markets from this interval
		interval.markets.forEach((market) => {
			this._marketToIntervalMap.delete(market);
		});

		this.intervals.delete(id);
	}

	/**
	 * Add a market to an interval.
	 * If the market is already in an interval, it will be removed from the existing interval.
	 * Newly added markets will be polled on the next tick regardless of interval multiplier.
	 */
	public addMarketToInterval(intervalId: string, marketKey: MarketKey): void {
		const interval = this.intervals.get(intervalId);
		if (!interval) {
			throw new Error(`Interval with id '${intervalId}' does not exist`);
		}

		// Remove market from any existing interval first
		const existingIntervalId = this._marketToIntervalMap.get(marketKey);

		if (existingIntervalId === intervalId) {
			// market is already in the interval
			return;
		}

		if (existingIntervalId) {
			this.removeMarketFromInterval(existingIntervalId, marketKey);
		}

		interval.markets.add(marketKey);
		// Mark as newly added so it gets polled on the next tick
		interval.newlyAddedMarkets.add(marketKey);
		this._marketToIntervalMap.set(marketKey, intervalId);
	}

	public addMarketsToInterval(
		intervalId: string,
		marketKeys: MarketKey[]
	): void {
		for (const marketKey of marketKeys) {
			this.addMarketToInterval(intervalId, marketKey);
		}
	}

	public removeMarketFromInterval(
		intervalId: string,
		marketKey: MarketKey
	): void {
		const interval = this.intervals.get(intervalId);
		if (!interval) {
			return;
		}

		interval.markets.delete(marketKey);
		interval.newlyAddedMarkets.delete(marketKey);
		this._marketToIntervalMap.delete(marketKey);
	}

	public getMarketInterval(marketKey: MarketKey): string | undefined {
		return this._marketToIntervalMap.get(marketKey);
	}

	public onData(): Observable<MarketPollingData[]> {
		return this.dataSubject.asObservable();
	}

	public onError(): Observable<Error> {
		return this.errorSubject.asObservable();
	}

	public start(): Promise<void> {
		if (this.isStarted) {
			return Promise.resolve();
		}

		this.isStarted = true;
		this.tickCounter = 0;

		const firstTickPromise = this.tick();

		this.intervalHandle = setInterval(() => {
			this.tick();
		}, this.baseTickIntervalMs);

		return firstTickPromise;
	}

	public stop(): void {
		if (!this.isStarted) {
			return;
		}

		this.isStarted = false;

		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
			this.intervalHandle = null;
		}
	}

	public isRunning(): boolean {
		return this.isStarted;
	}

	public getConfig(): PollingConfig {
		return { ...this.config };
	}

	public updateConfig(newConfig: Partial<PollingConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	public getMarketCount(): number {
		return this._marketToIntervalMap.size;
	}

	public getIntervalCount(): number {
		return this.intervals.size;
	}

	public getAllMarkets(): MarketKey[] {
		const allMarkets: MarketKey[] = [];
		this.intervals.forEach((interval) => {
			allMarkets.push(...Array.from(interval.markets));
		});
		return allMarkets;
	}

	public getMarketsForInterval(intervalId: string): MarketKey[] {
		const interval = this.intervals.get(intervalId);
		return interval ? Array.from(interval.markets) : [];
	}

	public getStats(): {
		isRunning: boolean;
		tickCounter: number;
		intervalCount: number;
		marketCount: number;
		consecutiveEmptyResponses: number;
		consecutiveErrors: number;
	} {
		return {
			isRunning: this.isStarted,
			tickCounter: this.tickCounter,
			intervalCount: this.intervals.size,
			marketCount: this._marketToIntervalMap.size,
			consecutiveEmptyResponses: this.consecutiveEmptyResponseCount,
			consecutiveErrors: this.consecutiveErrorCount,
		};
	}

	public resetErrorCounters(): void {
		this.consecutiveEmptyResponseCount = 0;
		this.consecutiveErrorCount = 0;
	}

	/**
	 * Factory method to create a PollingDlob with common interval configurations
	 */
	public static createWithCommonIntervals(config: PollingConfig): PollingDlob {
		const pollingDlob = new PollingDlob(config);

		// Add common intervals based on the original React hook
		pollingDlob.addInterval(
			PollingCategory.SELECTED_MARKET,
			POLLING_INTERVALS.LIVE_MARKET,
			POLLING_DEPTHS.ORDERBOOK
		);
		pollingDlob.addInterval(
			PollingCategory.USER_INVOLVED,
			POLLING_INTERVALS.BACKGROUND_DEEP,
			POLLING_DEPTHS.DEEP
		);
		pollingDlob.addInterval(
			PollingCategory.USER_NOT_INVOLVED,
			POLLING_INTERVALS.BACKGROUND_SHALLOW,
			POLLING_DEPTHS.SHALLOW
		);

		return pollingDlob;
	}

	private async tick(): Promise<void> {
		this.tickCounter++;

		// Find intervals that should be polled this tick
		const intervalsToPoll = Array.from(this.intervals.values()).filter(
			(interval) => {
				const hasMarkets = interval.markets.size > 0;
				const hasNewlyAddedMarkets = interval.newlyAddedMarkets.size > 0;
				const isFirstTick = this.tickCounter === 1;
				const isRegularInterval =
					this.tickCounter % interval.intervalMultiplier === 0;

				return (
					hasMarkets &&
					(isFirstTick || isRegularInterval || hasNewlyAddedMarkets)
				);
			}
		);

		if (intervalsToPoll.length === 0) {
			return;
		}

		try {
			const allMarketPollingData: MarketPollingData[] = [];

			// Combine all markets from different intervals into a single request
			const combinedMarketRequests: {
				marketId: MarketId;
				depth: number;
				intervalMultiplier: number;
			}[] = [];

			for (const interval of intervalsToPoll) {
				const marketsArray = Array.from(interval.markets);
				if (marketsArray.length === 0) {
					continue;
				}

				for (const marketKey of marketsArray) {
					combinedMarketRequests.push({
						marketId: MarketId.getMarketIdFromKey(marketKey),
						depth: interval.depth,
						intervalMultiplier: interval.intervalMultiplier,
					});
				}
			}

			if (combinedMarketRequests.length === 0) {
				return;
			}

			// Make a single bulk fetch for all markets
			const l2Data = await this.fetchBulkMarketL2Data(
				combinedMarketRequests.map((req) => ({
					marketId: req.marketId,
					depth: req.depth,
					intervalMultiplier: req.intervalMultiplier,
				}))
			);

			// Map the results back to MarketPollingData with correct interval IDs
			const intervalData: MarketPollingData[] = l2Data.map((data, index) => ({
				marketId: combinedMarketRequests[index].marketId,
				data,
			}));

			allMarketPollingData.push(...intervalData);

			if (allMarketPollingData.length > 0) {
				this.consecutiveEmptyResponseCount = 0;
				this.consecutiveErrorCount = 0;
				this.dataSubject.next(allMarketPollingData);

				// Clear newly added markets flags for intervals that were polled
				intervalsToPoll.forEach((interval) => {
					interval.newlyAddedMarkets.clear();
				});
			} else {
				this.consecutiveEmptyResponseCount++;
				if (
					this.consecutiveEmptyResponseCount >=
					this.maxConsecutiveEmptyResponses
				) {
					this.errorSubject.next(
						new Error(
							`Received ${this.maxConsecutiveEmptyResponses} consecutive empty responses`
						)
					);
				}
			}
		} catch (error) {
			this.consecutiveErrorCount++;
			const errorInstance =
				error instanceof Error ? error : new Error(String(error));

			if (this.consecutiveErrorCount >= this.maxConsecutiveErrors) {
				this.errorSubject.next(
					new Error(
						`Received ${this.maxConsecutiveErrors} consecutive errors. Latest: ${errorInstance.message}`
					)
				);
			} else {
				this.errorSubject.next(errorInstance);
			}
		}
	}

	private async fetchBulkMarketL2Data(
		markets: {
			marketId: MarketId;
			depth: number;
			intervalMultiplier: number;
		}[]
	): Promise<L2WithOracleAndMarketData[]> {
		const fetchingParams: BulkL2FetchingParams = {
			markets: markets.map((m) => ({
				marketIndex: m.marketId.marketIndex,
				marketType: m.marketId.marketTypeStr,
				depth: m.depth,
				includeVamm: m.marketId.isPerp,
				includePhoenix: m.marketId.isSpot,
				includeSerum: m.marketId.isSpot,
				includeOpenbook: m.marketId.isSpot,
				includeOracle: true,
				includeIndicative: this.config.indicativeLiquidityEnabled ?? false,
				intervalMultiplier: m.intervalMultiplier,
			})),
			grouping: this.config.groupingSize,
		};

		return this.bulkDlobL2Fetcher(fetchingParams);
	}

	private async bulkDlobL2Fetcher(
		params: BulkL2FetchingParams
	): Promise<L2WithOracleAndMarketData[]> {
		const queryParamsMap: {
			[K in keyof BulkL2FetchingQueryParams]: string;
		} & {
			grouping?: string;
		} = {
			marketType: params.markets.map((market) => market.marketType).join(','),
			marketIndex: params.markets.map((market) => market.marketIndex).join(','),
			depth: params.markets.map((market) => market.depth).join(','),
			includeVamm: params.markets.map((market) => market.includeVamm).join(','),
			includePhoenix: params.markets
				.map((market) => market.includePhoenix)
				.join(','),
			includeOpenbook: params.markets
				.map((market) => market.includeOpenbook)
				.join(','),
			includeSerum: params.markets
				.map((market) => market.includeSerum)
				.join(','),
			grouping: params.grouping
				? params.markets.map(() => params.grouping).join(',')
				: undefined,
			includeOracle: params.markets
				.map((market) => market.includeOracle)
				.join(','),
			includeIndicative: params.markets
				.map((market) => market.includeIndicative)
				.join(','),
		};

		const queryParams = this.encodeQueryParams(queryParamsMap);

		// Use cached endpoint when exclusively fetching background markets
		const useCachedEndpoint = !params.markets.some(
			(market) => market.depth !== 1
		);

		const endpoint = useCachedEndpoint
			? `${this.config.driftDlobServerHttpUrl}/batchL2Cache`
			: `${this.config.driftDlobServerHttpUrl}/batchL2`;

		return new Promise<L2WithOracleAndMarketData[]>((resolve, reject) => {
			PollingSequenceGuard.fetch(BACKGROUND_L2_POLLING_KEY, () => {
				return fetch(`${endpoint}?${queryParams}`);
			})
				.then(async (response) => {
					const responseData = await response.json();
					const resultsArray = responseData.l2s as RawL2Output[];
					const deserializedL2 = resultsArray.map(deserializeL2Response);
					resolve(deserializedL2);
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	private encodeQueryParams(
		params: Record<string, string | undefined>
	): string {
		return Object.entries(params)
			.filter(([_, value]) => value !== undefined)
			.map(
				([key, value]) =>
					`${encodeURIComponent(key)}=${encodeURIComponent(value!)}`
			)
			.join('&');
	}
}
