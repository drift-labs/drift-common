import {
	BigNum,
	DriftClient,
	L2OrderBook,
	MarketType,
	PRICE_PRECISION_EXP,
	ZERO,
} from '@drift-labs/sdk';
import { COMMON_UI_UTILS, ENUM_UTILS, MarketId } from '@drift/common';
import { useCallback, useEffect, useState } from 'react';
import { useDlobStore, DlobListeningSelection, DlobStore } from '../../stores';
import { L2WithOracle, MarketDlobLiquidityCategorisation } from '../../types';
import { PollingResponseManager } from '../../utils/PollingResponseManager';
import { deserializeL2Response } from '../../utils';

const DEFAULT_L2_STATE: L2WithOracle = {
	asks: [],
	bids: [],
	oraclePrice: ZERO,
};

const DEEP_PRICE_L2_DEPTH = 100;
const SHALLOW_PRICE_L2_DEPTH = 5;

const DEFAULT_TICK_INTERVAL_MS = 2e3;

const DLOB_HEALTH_REQUIREMENT_PCT = 50;
const DLOB_FETCH_SUCCESS_HISTORY_MAX_SIZE = 10;
let DLOB_FETCH_SUCCESS_HISTORY: boolean[] = [];

const DEV_FORCE_BAD_DLOB_RESPONSES = false;

type BulkL2FetchingParams = {
	markets: {
		marketIndex: number;
		marketType: string;
		depth: number;
		includeVamm: boolean;
		includePhoenix: boolean;
		includeSerum: boolean;
		includeOracle: boolean;
	}[];
	grouping?: number;
};

type DlobL2State = {
	marketIndex: number;
	marketType: MarketType;
	l2: L2OrderBook;
	oraclePrice: number;
}[];

const DEFAULT_BACKGROUND_L2: DlobL2State = [];

const BACKGROUND_L2_POLLING_KEY = Symbol('BACKGROUND_L2_POLLING_KEY');

const BULK_DLOB_L2_FETCHER = (
	dlobServerBatchL2Url: string,
	params: BulkL2FetchingParams
) => {
	const queryParamsMap = {
		marketType: params.markets.map((market) => market.marketType).join(','),
		marketIndex: params.markets.map((market) => market.marketIndex).join(','),
		depth: params.markets.map((market) => market.depth).join(','),
		includeVamm: params.markets.map((market) => market.includeVamm).join(','),
		includePhoenix: params.markets
			.map((market) => market.includePhoenix)
			.join(','),
		includeSerum: params.markets.map((market) => market.includeSerum).join(','),
		grouping: params.grouping
			? params.markets.map(() => params.grouping).join(',')
			: undefined,
		includeOracle: params.markets
			.map((market) => market.includeOracle)
			.join(','),
	};

	const queryParams = COMMON_UI_UTILS.encodeQueryParams(queryParamsMap);

	const handleSuccess = (wasSuccessful: boolean) => {
		DLOB_FETCH_SUCCESS_HISTORY = [
			wasSuccessful,
			...DLOB_FETCH_SUCCESS_HISTORY,
		].slice(0, DLOB_FETCH_SUCCESS_HISTORY_MAX_SIZE);
	};

	return new Promise<L2WithOracle[]>((res, rej) => {
		PollingResponseManager.poll(BACKGROUND_L2_POLLING_KEY, () => {
			return fetch(`${dlobServerBatchL2Url}?${queryParams}`);
		})
			.then(async (r) => {
				if (!r.ok || DEV_FORCE_BAD_DLOB_RESPONSES) {
					handleSuccess(false);
				} else {
					handleSuccess(true);
				}

				const resp = await r.json();

				const resultsArray = resp.l2s as any[];

				const deserializedL2 = resultsArray.map(deserializeL2Response);

				res(deserializedL2);
			})
			.catch((e) => {
				if (e === PollingResponseManager.LATE_RESPONSE_REJECTION) {
					rej();
				} else {
					handleSuccess(false);
					console.error('Error fetching dlob');
					console.error(e);
					res(params.markets.map(() => DEFAULT_L2_STATE));
				}
			});
	});
};

const getBulkDlobL2ForMarkets = async (props: {
	dlobServerBatchL2Url: string;
	markets: {
		marketId: MarketId;
		depth: number;
	}[];
	groupingSize?: number;
}): Promise<L2WithOracle[]> => {
	const l2State = await BULK_DLOB_L2_FETCHER(props.dlobServerBatchL2Url, {
		markets: props.markets.map((m) => ({
			marketIndex: m.marketId.marketIndex,
			marketType: m.marketId.marketTypeStr,
			depth: m.depth,
			includeVamm: m.marketId.isPerp,
			includePhoenix: m.marketId.isSpot,
			includeSerum: m.marketId.isSpot,
			includeOracle: true,
		})),
		grouping: props.groupingSize,
	});
	return l2State;
};

const fetchBulkMarketL2Data = async (
	dlobServerBatchL2Url: string,
	markets: {
		marketId: MarketId;
		depth: number;
	}[]
): Promise<L2WithOracle[]> => {
	const dlobL2 = await getBulkDlobL2ForMarkets({
		dlobServerBatchL2Url,
		markets,
	});

	return dlobL2;
};

export const useSyncBackgroundDlobWithServerPolling = ({
	enabled,
	dlobServerBatchL2Url,
	tickInterval = DEFAULT_TICK_INTERVAL_MS,
	marketsToTrack,
	driftClient,
	driftClientIsReady,
}: {
	enabled: boolean;
	dlobServerBatchL2Url: string;
	tickInterval: number;
	marketsToTrack: MarketDlobLiquidityCategorisation;
	driftClient: DriftClient;
	driftClientIsReady: boolean;
}) => {
	const dlobStore = useDlobStore();

	const deepPriceMarkets = marketsToTrack.DeepPriceData;
	const shallowPriceMarkets = marketsToTrack.ShallowPriceData;

	const setDlobListeningSelection = useDlobStore(
		(s) => s.setListeningSelection
	);

	const [backgroundL2, setBackgroundL2] = useState(DEFAULT_BACKGROUND_L2);

	/**
	 * Switch to BLOCKCHAIN listening if the dlob server is in bad health
	 */
	const handleBadDlobServerHealth = () => {
		console.log(`SWITCHING TO BLOCKCHAIN LISTENING`);
		setDlobListeningSelection(DlobListeningSelection.BLOCKCHAIN);
	};

	const getStateObjWithL2DataMerged = useCallback(
		(
			marketIndex: number,
			marketType: MarketType,
			l2State: L2OrderBook,
			storeL2State: DlobStore['dlobServerDlobState']
		) => {
			const key = ENUM_UTILS.match(marketType, MarketType.PERP)
				? 'perp'
				: 'spot';
			const innerState = storeL2State[key];

			return {
				...storeL2State,
				[key]: {
					...innerState,
					[marketIndex]: l2State,
				},
			};
		},
		[]
	);

	const setDlobStoreBackgroundL2States = useCallback(
		(
			l2States: {
				marketIndex: number;
				marketType: MarketType;
				l2: L2OrderBook;
			}[]
		) => {
			dlobStore.set((s) => {
				const newState = l2States.reduce((previous, l2ForMarket) => {
					return getStateObjWithL2DataMerged(
						l2ForMarket.marketIndex,
						l2ForMarket.marketType,
						l2ForMarket.l2,
						previous
					);
				}, s.dlobServerDlobState);

				s.dlobServerDlobState = newState;
			});
		},
		[]
	);

	const setDlobStoreOracleState = useCallback((l2Data: DlobL2State) => {
		const newState: DlobStore['dlobServerOracleState'] = l2Data.reduce(
			(previousState, marketL2Data) => {
				const isPerp = ENUM_UTILS.match(
					marketL2Data.marketType,
					MarketType.PERP
				);

				if (isPerp) {
					previousState.perp[marketL2Data.marketIndex] = {
						price: marketL2Data.oraclePrice,
					};
				} else {
					previousState.spot[marketL2Data.marketIndex] = {
						price: marketL2Data.oraclePrice,
					};
				}

				return previousState;
			},
			{ perp: {}, spot: {} } as DlobStore['dlobServerOracleState']
		);

		dlobStore.set((s) => {
			s.dlobServerOracleState = newState;
		});
	}, []);

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const newBackgroundL2 = await (async () => {
					if (
						!driftClientIsReady ||
						deepPriceMarkets.length === 0 ||
						!enabled
					) {
						return Promise.resolve([]) as Promise<DlobL2State>;
					}

					// Maps markets into necessary params to fetch L2 data
					const getBulkFetchingParams = (
						marketId: MarketId,
						depth: 'deep' | 'shallow'
					) => {
						return {
							marketId,
							depth:
								depth === 'deep' ? DEEP_PRICE_L2_DEPTH : SHALLOW_PRICE_L2_DEPTH,
						};
					};

					const deepPriceFetchingParams = deepPriceMarkets.map((market) =>
						getBulkFetchingParams(market, 'deep')
					);

					const shallowPriceFetchingParams = shallowPriceMarkets.map((market) =>
						getBulkFetchingParams(market, 'shallow')
					);

					const backgroundL2Data = await fetchBulkMarketL2Data(
						dlobServerBatchL2Url,
						[...deepPriceFetchingParams, ...shallowPriceFetchingParams]
					);

					return Promise.resolve(
						[...deepPriceMarkets, ...shallowPriceMarkets].map(
							(market, index) => ({
								oraclePrice: BigNum.from(
									backgroundL2Data[index].oraclePrice,
									PRICE_PRECISION_EXP
								).toNum(),
								l2: backgroundL2Data[index],
								marketIndex: market.marketIndex,
								marketType: market.marketType,
							})
						)
					);
				})();

				setBackgroundL2(newBackgroundL2);
			} catch (e) {
				// Do nothing
			}
		}, tickInterval);

		return () => {
			clearInterval(interval);
		};
	}, [
		tickInterval,
		deepPriceMarkets,
		shallowPriceMarkets,
		driftClient,
		driftClientIsReady,
		enabled,
	]);

	const checkDlobServerHealth = () => {
		if (DLOB_FETCH_SUCCESS_HISTORY.length < 5) {
			// Ignore health check if we haven't fetched enough times to make any conclusions
			return;
		}

		const numerator = DLOB_FETCH_SUCCESS_HISTORY.filter(
			(success) => !!success
		).length;

		const denominator = Math.min(
			DLOB_FETCH_SUCCESS_HISTORY.length,
			DLOB_FETCH_SUCCESS_HISTORY_MAX_SIZE
		);

		const successPct = (numerator / denominator) * 100;

		if (successPct < DLOB_HEALTH_REQUIREMENT_PCT) {
			handleBadDlobServerHealth();
		}
	};

	// Sync Background L2 Data to Store
	useEffect(() => {
		if (!enabled) return;

		(async () => {
			const l2Data = await backgroundL2;
			checkDlobServerHealth();
			setDlobStoreBackgroundL2States(l2Data);
			setDlobStoreOracleState(l2Data);
		})();
	}, [backgroundL2, enabled]);
};
