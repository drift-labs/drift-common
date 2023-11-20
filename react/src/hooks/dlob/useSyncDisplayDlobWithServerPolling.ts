import {
	BN,
	DriftClient,
	L2OrderBook,
	MarketType,
	ZERO,
} from '@drift-labs/sdk';
import { COMMON_UI_UTILS, ENUM_UTILS } from '@drift/common';
import { useCallback, useEffect, useState } from 'react';
import { useDlobStore, L2OrderBookForMarket } from '../../stores';
import { PollingResponseManager } from '../../utils';
import {
	GroupingSizeSelectionState,
	MarketDlobLiquidityCategorisation,
} from '../../types';
import { useValueWithUpdateInterval } from '../useValueWithUpdateInterval';

const DEFAULT_L2_STATE: L2OrderBook = { asks: [], bids: [], slot: undefined };

const DEFAULT_ORDERBOOK_ROWS = 20;

type L2FetchingParams = {
	marketIndex: number;
	marketType: string;
	depth: number;
	includeVamm: boolean;
	includePhoenix: boolean;
	includeSerum: boolean;
	grouping?: number;
};

const deserializeL2Orderbook = (serializedOrderbook: {
	asks: {
		price: string;
		size: string;
		sources: {
			[key: string]: string;
		};
	}[];
	bids: {
		price: string;
		size: string;
		sources: {
			[key: string]: string;
		};
	}[];
	slot?: number;
}): L2OrderBook => {
	return {
		asks: serializedOrderbook.asks.map((ask) => ({
			price: new BN(ask.price),
			size: new BN(ask.size),
			sources: Object.entries(ask.sources).reduce((previous, [key, val]) => {
				return {
					...previous,
					[key]: new BN(val),
				};
			}, {}),
		})),
		bids: serializedOrderbook.bids.map((bid) => ({
			price: new BN(bid.price),
			size: new BN(bid.size),
			sources: Object.entries(bid.sources).reduce((previous, [key, val]) => {
				return {
					...previous,
					[key]: new BN(val),
				};
			}, {}),
		})),
		slot: serializedOrderbook.slot,
	};
};

const DLOB_L2_POLL_KEY = Symbol('DLOB_L2_POLL_KEY');

const DLOB_L2_FETCHER = async (
	dlobServerHttpUrl: string,
	params: L2FetchingParams
) => {
	return new Promise<L2OrderBook>((res, rej) => {
		PollingResponseManager.poll(DLOB_L2_POLL_KEY, () => {
			return fetch(
				`${dlobServerHttpUrl}?${COMMON_UI_UTILS.encodeQueryParams(params)}`
			);
		})
			.then(async (r) => {
				const resp = await r.json();
				const deserializedL2 = deserializeL2Orderbook(resp);
				res(deserializedL2);
			})
			.catch((e) => {
				if (e === PollingResponseManager.LATE_RESPONSE_REJECTION) {
					rej();
				} else {
					console.error('Error fetching dlob');
					console.error(e);
					res(DEFAULT_L2_STATE);
				}
			});
	});
};

const getDlobL2ForMarket = async (props: {
	dlobServerHttpUrl: string;
	marketIndex: number;
	marketType: MarketType;
	depth: number;
	groupingSize?: number;
	opts: {
		vammIsEnabled: boolean;
		dlobIsEnabled: boolean;
	};
}): Promise<L2OrderBook> => {
	const l2State = await DLOB_L2_FETCHER(props.dlobServerHttpUrl, {
		marketIndex: props.marketIndex,
		marketType: ENUM_UTILS.toStr(props.marketType),
		depth: props.depth,
		grouping: props.groupingSize,
		includeVamm:
			props?.opts?.vammIsEnabled &&
			ENUM_UTILS.match(props.marketType, MarketType.PERP),
		includePhoenix:
			props?.opts?.dlobIsEnabled &&
			ENUM_UTILS.match(props.marketType, MarketType.SPOT),
		includeSerum:
			props?.opts?.dlobIsEnabled &&
			ENUM_UTILS.match(props.marketType, MarketType.SPOT),
	});

	return l2State;
};

const getOrderbookDisplayL2DataForMarket = async (
	dlobServerHttpUrl: string,
	marketIndex: number,
	marketType: MarketType,
	marketTickSize: number,
	groupingSize: number,
	opts: {
		vammIsEnabled: boolean;
		dlobIsEnabled: boolean;
	}
): Promise<L2OrderBook> => {
	const dlobL2 =
		!opts?.vammIsEnabled && !opts?.dlobIsEnabled
			? DEFAULT_L2_STATE
			: await getDlobL2ForMarket({
					dlobServerHttpUrl,
					marketIndex,
					marketType,
					depth: groupingSize * DEFAULT_ORDERBOOK_ROWS,
					// Expects grouping in PRICE_PRECISION => tickSize x grouping = size of groups in $
					groupingSize: groupingSize * marketTickSize,
					opts,
			  });

	if (opts?.vammIsEnabled && !opts?.dlobIsEnabled) {
		// If we ONLY WANT VAMM LIQUIDITY we need to parse the dlob liquidity out of the result, because the dlob server doesn't have an option to turn off the base dlob liquidity (only  serum+phonix etc.)
		const filteredDlob = {
			bids: dlobL2.bids
				.filter((bid) => bid.sources.vamm)
				.map((bid) => {
					return {
						...bid,
						size: bid.size.sub(bid?.sources?.dlob ?? ZERO),
						sources: { vamm: bid.sources.vamm },
					};
				}),
			asks: dlobL2.asks
				.filter((ask) => ask.sources.vamm)
				.map((ask) => {
					return {
						...ask,
						size: ask.size.sub(ask?.sources?.dlob ?? ZERO),
						sources: { vamm: ask.sources.vamm },
					};
				}),
			slot: dlobL2.slot,
		};

		return filteredDlob;
	}

	return dlobL2;
};

/**
 * Keeps L2 state in sync for all relevant markets.
 *
 * There are two different "types" of L2 data we store:
 *
 * - The L2 data for the currently selected market which we use to display in the orderbook component
 * => This data needs to be "deep", and needs to use the grouping size selected by the current user. It only ever needs to be for the currently selected market.
 *
 * - The L2 data for the user's currently open positions (perp positions + spot borrows) and the currently selected market, to be used when calculating price impacts while making a trade. We want to have this data loaded in the backgounr at "all times" because the user could open a close positions modal or enter values into the trade form at any time. We DON'T want to group this data by grouping size because then it would give incorrect slippage prices etc. Instead we just fetch a hardcoded number of price levels in each direction.
 * @returns
 */
export const useSyncDisplayDlobWithServerPolling = ({
	enabled,
	dlobServerHttpUrl,
	tickInterval,
	isDlobEnabled = true,
	isVammEnabled = true,
	marketsToTrack,
	orderbookGroupingSize,
	driftClient,
	driftClientIsReady,
}: {
	enabled: boolean;
	tickInterval: number;
	dlobServerHttpUrl: string;
	isVammEnabled: boolean;
	isDlobEnabled: boolean;
	marketsToTrack: MarketDlobLiquidityCategorisation;
	orderbookGroupingSize: GroupingSizeSelectionState;
	driftClient: DriftClient;
	driftClientIsReady: boolean;
}) => {
	const orderbookDisplayMarket = marketsToTrack.OrderbookDisplay;

	const setState = useDlobStore((s) => s.set);

	const setStoreOrderbookDisplayL2State = useCallback(
		(orderbookDisplayL2: {
			l2: {
				asks: L2OrderBookForMarket['asks'];
				bids: L2OrderBookForMarket['bids'];
			};
			marketIndex: L2OrderBookForMarket['marketIndex'];
			marketType: L2OrderBookForMarket['marketType'];
		}) => {
			setState((s) => {
				s.orderbookDisplayL2State = {
					asks: orderbookDisplayL2.l2.asks,
					bids: orderbookDisplayL2.l2.bids,
					marketIndex: orderbookDisplayL2.marketIndex,
					marketType: orderbookDisplayL2.marketType,
				};
			});
		},
		[]
	);

	// Ticker for the memoization hook to update on interval
	const [displayL2Ticker] = useValueWithUpdateInterval(
		() => ({}),
		tickInterval
	);

	const [orderbookDisplayL2, setOrderbookDisplayL2] = useState({
		marketIndex: orderbookDisplayMarket.marketIndex,
		marketType: orderbookDisplayMarket.marketType,
		l2: DEFAULT_L2_STATE,
	});

	useEffect(() => {
		(async () => {
			try {
				if (!enabled) {
					return;
				}

				if (!driftClientIsReady || !enabled || !driftClient) {
					setOrderbookDisplayL2({
						marketIndex: orderbookDisplayMarket.marketIndex,
						marketType: orderbookDisplayMarket.marketType,
						l2: DEFAULT_L2_STATE,
					});

					return;
				}

				const isSpotMarket = orderbookDisplayMarket.isSpot;

				const spotMarketAccount = isSpotMarket
					? driftClient.getSpotMarketAccount(orderbookDisplayMarket.marketIndex)
					: undefined;

				const perpMarketAccount = isSpotMarket
					? undefined
					: driftClient.getPerpMarketAccount(
							orderbookDisplayMarket.marketIndex
					  );

				const tickSize =
					(isSpotMarket
						? spotMarketAccount?.orderTickSize
						: perpMarketAccount?.amm.orderTickSize) ?? ZERO;

				const l2Data = await getOrderbookDisplayL2DataForMarket(
					dlobServerHttpUrl,
					orderbookDisplayMarket.marketIndex,
					orderbookDisplayMarket.marketType,
					tickSize.toNumber(),
					orderbookGroupingSize.options[orderbookGroupingSize.selectionIndex],
					{
						vammIsEnabled: isVammEnabled,
						dlobIsEnabled: isDlobEnabled,
					}
				);

				setOrderbookDisplayL2({
					marketIndex: orderbookDisplayMarket.marketIndex,
					marketType: orderbookDisplayMarket.marketType,
					l2: l2Data,
				});
			} catch (e) {
				// Do Nothing
			}
		})();
	}, [
		dlobServerHttpUrl,
		displayL2Ticker,
		orderbookDisplayMarket,
		driftClient,
		driftClientIsReady,
		enabled,
	]);

	// Sync Orderbook Display L2 Data to Store
	useEffect(() => {
		if (!enabled) return;

		setStoreOrderbookDisplayL2State(orderbookDisplayL2);
	}, [orderbookDisplayL2, enabled]);
};
