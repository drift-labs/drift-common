import { useEffect } from 'react';
import { COMMON_UI_UTILS, ENUM_UTILS, UIMarket } from '@drift/common';
import {
	DEFAULT_TOP_OF_BOOK_QUOTE_AMOUNTS,
	L2Level,
	L2OrderBook,
	MarketType,
	OraclePriceData,
	OrderSubscriber,
	PerpMarketAccount,
	PublicKey,
	SpotMarketConfig,
	ZERO,
	getVammL2Generator,
	DriftClient,
	BulkAccountLoader,
} from '@drift-labs/sdk';
import { useIntervalWithInitialCallback } from '../useIntervalWithInitialCallback';
import { useSyncPhoenixSubscriberList } from './useSyncPhoenixSubscriberList';
import { useSyncSerumSubscriberList } from './useSyncSerumSubscriberList';
import { DlobStore, useDlobStore, useOraclePriceStore } from '../../stores';
import { MarketDlobLiquidityCategorisation, SubscriberType } from '../../types';
import { Connection } from '@solana/web3.js';

const DEFAULT_L2_STATE: L2OrderBook = { asks: [], bids: [] };
const DEFAULT_ORDERBOOK_ROWS = 20;

const getVammL2ForMarket = (
	marketType: MarketType,
	perpMarketAccount: PerpMarketAccount,
	priceData: OraclePriceData,
	groupingSize: number
): L2OrderBook => {
	if (!ENUM_UTILS.match(marketType, MarketType.PERP)) return DEFAULT_L2_STATE;

	const vammL2Generator = getVammL2Generator({
		marketAccount: perpMarketAccount,
		oraclePriceData: priceData,
		numOrders: groupingSize * DEFAULT_ORDERBOOK_ROWS,
		topOfBookQuoteAmounts: DEFAULT_TOP_OF_BOOK_QUOTE_AMOUNTS,
	});

	const vammAsksGenerator = vammL2Generator.getL2Asks();
	const vammBidsGenerator = vammL2Generator.getL2Bids();

	const vammL2 = {
		asks: Array.from(vammAsksGenerator),
		bids: Array.from(vammBidsGenerator),
	};

	return vammL2;
};

/**
 * Merge seperate sources of l2 orderbook together. During the merge it will sort by price (ascending) and merge sources where they share the same price
 * @param l2Data
 * @returns
 */
const mergeL2Data = (l2Data: L2OrderBook[]): L2OrderBook => {
	// Buckets to put bids and asks into when merging
	const askBuckets = new Map<string, L2Level>();
	const bidBuckets = new Map<string, L2Level>();

	const addOrAppendToBucketStorage = (
		key: string,
		currentL2Level: L2Level,
		bucketStorage: Map<string, L2Level>
	) => {
		const currentBucket = bucketStorage.get(key);

		if (currentBucket) {
			currentBucket.size = currentBucket.size.add(currentL2Level.size);
			currentBucket.sources = {
				...currentBucket.sources,
				...currentL2Level.sources,
			};
		} else {
			bucketStorage.set(key, currentL2Level);
		}
	};

	// Place all the bids and asks into the buckets
	for (const bid of l2Data.map((d) => d.bids).flat()) {
		const bidKey = bid.price.toString();
		addOrAppendToBucketStorage(bidKey, bid, bidBuckets);
	}
	for (const ask of l2Data.map((d) => d.asks).flat()) {
		const askKey = ask.price.toString();
		addOrAppendToBucketStorage(askKey, ask, askBuckets);
	}

	// Map the bids and asks back out into l2 orderbook
	const l2Orderbook = {
		bids: Array.from(bidBuckets.values()).sort((bidA, bidB) =>
			COMMON_UI_UTILS.sortBnDesc(bidA.price, bidB.price)
		),
		asks: Array.from(askBuckets.values()).sort((askA, askB) =>
			COMMON_UI_UTILS.sortBnAsc(askA.price, askB.price)
		),
	};

	return l2Orderbook;
};

// Use a const here so that it's the same value between refreshes
const BLANK_MARKETS_TO_TRACK = {};

/**
 * Handles turning on the blockchain order listener and keeping it in sync with the DLOB class when the dlob listening gets enabled.
 * @param enabled
 */
export const useSyncBlockchainDlob = ({
	enabled,
	tickInterval,
	marketsToTrack,
	subscriberType,
	dlobLevelsToTrack,
	allSupportedUIMarket,
	phoenixProgramId,
	serumProgramId,
	currentSlot,
	orderSubscriber,
	driftClient,
	driftClientIsReady,
	connection,
	bulkAccountLoader,
}: {
	enabled: boolean;
	tickInterval: number;
	marketsToTrack: MarketDlobLiquidityCategorisation;
	subscriberType: SubscriberType;
	dlobLevelsToTrack: (keyof MarketDlobLiquidityCategorisation)[];
	allSupportedUIMarket: UIMarket[];
	phoenixProgramId: PublicKey;
	serumProgramId: PublicKey;
	currentSlot: number;
	orderSubscriber: OrderSubscriber;
	driftClient: DriftClient;
	driftClientIsReady: boolean;
	connection: Connection;
	bulkAccountLoader: BulkAccountLoader;
}) => {
	const dlobStore = useDlobStore();
	const priceStore = useOraclePriceStore();

	const getPhoenixSubscriber = useDlobStore(
		(s) => s.getPhoenixSubscriberForMarket
	);
	const getSerumSubscriber = useDlobStore((s) => s.getSerumSubscriberForMarket);

	const supportedSpotMarketConfigs = allSupportedUIMarket
		.filter((uiMarket) => uiMarket.isSpot)
		.map((uiMarket) => uiMarket.market) as SpotMarketConfig[];

	// If not enabled then pass a blank list of markets to track
	useSyncPhoenixSubscriberList({
		marketsToTrack: enabled ? marketsToTrack : BLANK_MARKETS_TO_TRACK,
		subscriberType,
		phoenixProgramId,
		dlobLevelsToTrack,
		supportedSpotMarketConfigs,
		driftClientIsReady,
		connection,
		bulkAccountLoader,
	});
	useSyncSerumSubscriberList({
		marketsToTrack: enabled ? marketsToTrack : BLANK_MARKETS_TO_TRACK,
		subscriberType,
		serumProgramId,
		dlobLevelsToTrack,
		supportedSpotMarketConfigs,
		driftClientIsReady,
		connection,
		bulkAccountLoader,
	});

	useEffect(() => {
		if (!orderSubscriber) return;

		if (enabled) {
			// Turn the blockchain listener on
			orderSubscriber.subscribe();
		} else {
			// Turn the blockchain listener off
			orderSubscriber.unsubscribe();
		}
	}, [enabled, orderSubscriber]);

	useIntervalWithInitialCallback(() => {
		if (!enabled) return;

		(async () => {
			if (!orderSubscriber || !driftClient) return;

			const marketsToGetDlobFor = allSupportedUIMarket.filter(
				(mkt) => !mkt.isUsdcMarket
			);

			const newDlob = await orderSubscriber.getDLOB(currentSlot);

			const newL2State: DlobStore['blockchainDlobState'] = {
				perp: {},
				spot: {},
			};

			// Get the DLOB state from the VAMM
			const vammL2State = marketsToGetDlobFor.map((mkt) => {
				if (ENUM_UTILS.match(MarketType.SPOT, mkt.marketType)) {
					return DEFAULT_L2_STATE;
				}

				const oraclePriceData =
					priceStore.getMarketPriceData(mkt)?.rawPriceData;
				const perpMarketAccount = driftClient.getPerpMarketAccount(
					mkt.marketIndex
				);

				if (!oraclePriceData || !perpMarketAccount) {
					return DEFAULT_L2_STATE;
				}

				return getVammL2ForMarket(
					mkt.marketType,
					perpMarketAccount,
					oraclePriceData,
					1
				);
			});

			// Get the DLOB state from phoenix
			const phoenixL2State: L2OrderBook[] = marketsToGetDlobFor.map((mkt) => {
				const phoenixSubscriber = getPhoenixSubscriber(mkt);
				if (!phoenixSubscriber) return DEFAULT_L2_STATE;

				const bids = Array.from(phoenixSubscriber.getL2Bids());
				const asks = Array.from(phoenixSubscriber.getL2Asks());

				return {
					bids,
					asks,
				};
			});

			// Get the DLOB state from serum
			const serumL2State: L2OrderBook[] = marketsToGetDlobFor.map((mkt) => {
				const serumSubscriber = getSerumSubscriber(mkt);
				if (!serumSubscriber) return DEFAULT_L2_STATE;

				const bids = Array.from(serumSubscriber.getL2Bids());
				const asks = Array.from(serumSubscriber.getL2Asks());

				return { bids, asks };
			});

			// Get the DLOB state for the Drift DLOB
			const driftDlobL2State = marketsToGetDlobFor.map((mkt) => {
				// Skip USDC market
				if (
					mkt.marketIndex === 0 &&
					ENUM_UTILS.match(mkt.marketType, MarketType.SPOT)
				)
					return;

				const oraclePriceData =
					priceStore.getMarketPriceData(mkt)?.rawPriceData;

				if (!oraclePriceData) {
					return DEFAULT_L2_STATE;
				}

				const bidsGenerator = newDlob.getRestingLimitBids(
					mkt.marketIndex,
					currentSlot,
					mkt.marketType,
					oraclePriceData
				);

				const asksGenerator = newDlob.getRestingLimitAsks(
					mkt.marketIndex,
					currentSlot,
					mkt.marketType,
					oraclePriceData
				);

				const bids: L2Level[] = Array.from(bidsGenerator).map((node) => {
					const size =
						node.order?.baseAssetAmount.sub(
							node.order?.baseAssetAmountFilled
						) ?? ZERO;
					return {
						price: node.getPrice(oraclePriceData, currentSlot),
						size,
						sources: { dlob: size },
					};
				});

				const asks: L2Level[] = Array.from(asksGenerator).map((node) => {
					const size =
						node.order?.baseAssetAmount.sub(
							node.order?.baseAssetAmountFilled
						) ?? ZERO;

					return {
						price: node.getPrice(oraclePriceData, currentSlot),
						size,
						sources: { dlob: size },
					};
				});

				if (ENUM_UTILS.match(mkt.marketType, MarketType.PERP)) {
					return {
						bids,
						asks,
					};
				} else {
					return {
						bids,
						asks,
					};
				}
			});

			// Merge the different DLOB sources
			const mergedDlobState = marketsToGetDlobFor.map((_mktInfo, index) => {
				const dlobValue = driftDlobL2State[index] ?? DEFAULT_L2_STATE;
				const vammValue = vammL2State[index];
				const phoenixValue = phoenixL2State[index];
				const serumValue = serumL2State[index];
				return mergeL2Data([dlobValue, vammValue, phoenixValue, serumValue]);
			});

			// Fill the new L2 state with the merged data
			marketsToGetDlobFor.forEach((mktInfo, index) => {
				const dlobStateForMarket = mergedDlobState[index];
				if (ENUM_UTILS.match(mktInfo.marketType, MarketType.PERP)) {
					newL2State.perp[mktInfo.marketIndex] = dlobStateForMarket;
				} else {
					newL2State.spot[mktInfo.marketIndex] = dlobStateForMarket;
				}
			});

			// Update the store state with the new L2 state
			dlobStore.set((s) => {
				s.blockchainDlobState = newL2State;
			});
		})();
	}, tickInterval);
};
