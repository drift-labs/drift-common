import { CandleType, MarketId } from '../types';
import {
	CandleResolution,
	DriftClient,
	PerpMarketConfig,
	PerpMarkets,
	PRICE_PRECISION_EXP,
	SpotMarketConfig,
	SpotMarkets,
} from '@drift-labs/sdk';
import { CandleClient, JsonCandle } from './candleClient';
import { PollingSequenceGuard } from '../utils/pollingSequenceGuard';
import { CANDLE_UTILS } from '../utils/candleUtils';
import { UIEnv } from '../types/UIEnv';

const DRIFT_V2_START_TS = 1668470400; // 15th November 2022 ... 2022-11-15T00:00:00.000Z

const resolutions = [
	'1',
	'3',
	'5',
	'15',
	'30',
	'60',
	'240',
	'6H',
	'8H',
	'1D',
	'3D',
	'1W',
	'1M',
];

const tvResolutionStringToStandardResolutionString = (
	tvResolutionString
): CandleResolution => {
	switch (tvResolutionString) {
		case '1':
			return '1';
		case '5':
			return '5';
		case '15':
			return '15';
		case '60':
			return '60';
		case '240':
			return '240';
		case 'D':
		case '1D':
			return 'D';
		case 'W':
		case '1W':
			return 'W';
		case 'M':
		case '1M':
			return 'M';
	}
};

type TVMarketInfo = {
	symbol: string;
	full_name: string;
	description: string;
	exchange: string;
	ticker: string;
	type: string;
};

const DATAFEED_CONFIG = {
	exchanges: [],
	supported_resolutions: [...resolutions],
	currency_codes: [],
	supports_marks: false,
	supports_time: false,
	supports_timescale_marks: false,
	symbols_types: [],
};

type TVBar = {
	/** Bar time.
	 * Amount of **milliseconds** since Unix epoch start in **UTC** timezone.
	 * `time` for daily, weekly, and monthly bars is expected to be a trading day (not session start day) at 00:00 UTC.
	 * The library adjusts time according to `session` from {@link LibrarySymbolInfo}.
	 */
	time: number;
	/** Opening price */
	open: number;
	/** High price */
	high: number;
	/** Low price */
	low: number;
	/** Closing price */
	close: number;
	/** Trading Volume */
	volume?: number;
};

const findMarketBySymbol = (
	symbol: string,
	uiEnv: UIEnv
):
	| {
			type: 'perp';
			config: PerpMarketConfig;
	  }
	| {
			type: 'spot';
			config: SpotMarketConfig;
	  } => {
	const sdkEnv = uiEnv.sdkEnv;

	const perpMarketConfigs =
		sdkEnv === 'mainnet-beta'
			? PerpMarkets['mainnet-beta']
			: PerpMarkets['devnet'];

	const spotMarketConfigs =
		sdkEnv === 'mainnet-beta'
			? SpotMarkets['mainnet-beta']
			: SpotMarkets['devnet'];

	if (!symbol) {
		return {
			type: 'perp',
			config: perpMarketConfigs[0],
		};
	}

	const isPerp = symbol.toLowerCase().includes('perp');

	const matchingMarketConfig = isPerp
		? perpMarketConfigs.find((mkt) =>
				mkt.symbol.toLowerCase().includes(symbol.toLowerCase())
		  )
		: spotMarketConfigs.find((mkt) =>
				mkt.symbol.toLowerCase().includes(symbol.toLowerCase())
		  );

	return matchingMarketConfig
		? isPerp
			? {
					type: 'perp',
					config: matchingMarketConfig as PerpMarketConfig,
			  }
			: {
					type: 'spot',
					config: matchingMarketConfig as SpotMarketConfig,
			  }
		: {
				type: 'perp',
				config: perpMarketConfigs[0],
		  };
};

const candleFetchingPollKey = Symbol('candleFetchingPollKey');

type Mutex<T> = { current: T };

const candleToTvBar = (candle: JsonCandle, candleType: CandleType): TVBar => {
	const useOraclePrice = candleType === CandleType.ORACLE_PRICE;

	return {
		time: candle.ts * 1000,
		open: useOraclePrice ? candle.oracleOpen : candle.fillOpen,
		high: useOraclePrice ? candle.oracleHigh : candle.fillHigh,
		low: useOraclePrice ? candle.oracleLow : candle.fillLow,
		close: useOraclePrice ? candle.oracleClose : candle.fillClose,
		volume: candle.quoteVolume,
	};
};

const PerpMarketConfigToTVMarketInfo = (
	marketConfig: PerpMarketConfig
): TVMarketInfo => {
	return {
		symbol: marketConfig.symbol,
		full_name: marketConfig.fullName,
		description: marketConfig.fullName,
		exchange: 'Drift',
		ticker: marketConfig.symbol,
		type: 'crypto',
	};
};

const SpotMarketConfigToTVMarketInfo = (
	marketConfig: SpotMarketConfig
): TVMarketInfo => {
	return {
		symbol: marketConfig.symbol,
		full_name: marketConfig.symbol,
		description: marketConfig.symbol,
		exchange: 'Drift',
		ticker: marketConfig.symbol,
		type: 'crypto',
	};
};

export class DriftTvFeed {
	private env: UIEnv;
	private candleType: CandleType;
	private candleClient: CandleClient;
	private driftClient: DriftClient;
	private chartMarketMutex: Mutex<string> = { current: undefined };
	private chartResolutionMutex: Mutex<CandleResolution> = {
		current: undefined,
	};

	constructor(env: UIEnv, candleType: CandleType, driftClient: DriftClient) {
		this.env = env;
		this.candleType = candleType;
		this.candleClient = new CandleClient();
		this.driftClient = driftClient;
	}

	updateMarketMutex(marketId: MarketId) {
		this.chartMarketMutex.current = marketId.key;
	}

	private searchMarkets = (symbol: string): TVMarketInfo[] => {
		const res: Pick<
			TVMarketInfo,
			'symbol' | 'ticker' | 'full_name' | 'description'
		>[] = [];

		const CurrentPerpMarkets =
			this.env.sdkEnv === 'mainnet-beta'
				? PerpMarkets['mainnet-beta']
				: PerpMarkets['devnet'];

		const CurrentSpotMarkets =
			this.env.sdkEnv === 'mainnet-beta'
				? SpotMarkets['mainnet-beta']
				: SpotMarkets['devnet'];

		if (!symbol) {
			res.push(PerpMarketConfigToTVMarketInfo(CurrentPerpMarkets[0]));
		} else {
			for (const market of CurrentPerpMarkets) {
				const lowerCaseMarket = market.symbol.toLowerCase();
				if (lowerCaseMarket.includes(symbol.toLowerCase())) {
					res.push(PerpMarketConfigToTVMarketInfo(market));
				}
			}

			for (const market of CurrentSpotMarkets) {
				const lowerCaseMarket = market.symbol.toLowerCase();
				if (lowerCaseMarket.includes(symbol.toLowerCase())) {
					res.push(SpotMarketConfigToTVMarketInfo(market));
				}
			}
		}

		return res.map((mkt) => {
			return {
				...mkt,
				exchange: 'Drift',
				type: 'crypto',
			};
		});
	};

	// IExternalDatafeed implementation
	onReady(callback) {
		// using setTimeout because tradingview wants this to resolve asynchronously
		setTimeout(() => callback(DATAFEED_CONFIG), 0);
	}

	// IDatafeedChartApi implementation
	searchSymbols(
		userInput: string,
		_exchange: string,
		_symbolType: string,
		onResult
	): void {
		if (!userInput) return onResult([]);

		const res = this.searchMarkets(userInput);

		onResult(res);
	}

	resolveSymbol(symbolName: string, onResolve, onError): void {
		const targetMarket = findMarketBySymbol(symbolName, this.env);

		if (targetMarket) {
			const tvMarketName = targetMarket.config.symbol;

			let tickSize: number;

			if (targetMarket.type === 'perp') {
				tickSize = this.driftClient
					.getPerpMarketAccount(targetMarket.config.marketIndex)
					.amm.orderTickSize.toNumber();
			} else {
				tickSize = this.driftClient
					.getSpotMarketAccount(targetMarket.config.marketIndex)
					.orderTickSize.toNumber();
			}

			const pricePrecisionExp = PRICE_PRECISION_EXP.toNumber();
			const tickSizeExp = Math.ceil(Math.log10(tickSize));
			const priceScaleExponent = Math.max(0, pricePrecisionExp - tickSizeExp);
			const priceScale = 10 ** priceScaleExponent;

			onResolve({
				name: tvMarketName,
				full_name: tvMarketName,
				description: tvMarketName,
				exchange: 'Drift',
				ticker: targetMarket.config.symbol,
				type: 'crypto',
				session: '24x7',
				timezone: 'Etc/UTC',
				listed_exchange: 'Drift',
				format: 'price',
				pricescale: priceScale,
				minmov: 1,
				supported_resolutions: [...resolutions],
				has_intraday: true,
				intraday_multipliers: ['1', '5', '15', '60', '240'],
			});

			return;
		}

		onError(`Couldn't find market for symbol ${symbolName}`);
	}

	/**
	 * TradingView sometimes asks for a FROM timestamp halfway between two candles, this isn't compatible with the new candles API so we round these down the nearest candle - which should be the exact same candle!!
	 * @param timestamp
	 * @param resolution
	 * @returns
	 */
	private roundFromTimestampToExactCandleTs = (
		timestamp: number,
		resolution: CandleResolution
	) => {
		const ROUND_UP = true;

		const timestampMs = timestamp * 1000;
		const candleLengthMs =
			CANDLE_UTILS.resolutionStringToCandleLengthMs(resolution);

		const remainderMs = timestampMs % candleLengthMs;

		if (remainderMs === 0) {
			return timestamp;
		}

		const roundedDownTimestampMs = timestampMs - remainderMs;

		const roundedTimestampMs = ROUND_UP
			? roundedDownTimestampMs + candleLengthMs
			: roundedDownTimestampMs;

		return roundedTimestampMs / 1000;
	};

	private formatTVRequestedRange = (fromTs: number, toTs: number) => {
		const formattedFromTs = this.roundFromTimestampToExactCandleTs(
			fromTs,
			this.chartResolutionMutex.current
		); // TradingView sometimes asks for a FROM timestamp halfway between two candles, so we round down to the nearest candle

		const formattedToTs = Math.floor(Math.min(toTs, Date.now() / 1000)); // TradingView sometimes asks for a TO timestamp in the future, so we cap it at the current timestamp

		return {
			from: formattedFromTs,
			to: formattedToTs,
		};
	};

	async getBars(
		symbolInfo: {
			name: string;
			ticker?: string;
		},
		resolution: string,
		periodParams: {
			countBack: number;
			from: number;
			to: number;
		},
		onResult: (
			bars: TVBar[],
			meta?: {
				noData: boolean;
			}
		) => void,
		_onError
	) {
		console.debug(`candlesv2:: symbolInfo`, symbolInfo);

		// Can automatically return no data if the requested range is before the Drift V2 launch
		if (
			periodParams.to < DRIFT_V2_START_TS ||
			periodParams.from < DRIFT_V2_START_TS
		) {
			onResult([], {
				noData: true,
			});
			return;
		}

		const symbolToUse = symbolInfo.ticker ?? symbolInfo.name;

		const targetResolution =
			tvResolutionStringToStandardResolutionString(resolution);
		const targetMarket = findMarketBySymbol(symbolToUse, this.env);
		const targetMarketId =
			targetMarket.type === 'perp'
				? MarketId.createPerpMarket(targetMarket.config.marketIndex)
				: MarketId.createSpotMarket(targetMarket.config.marketIndex);
		this.chartMarketMutex.current = targetMarketId.key;
		this.chartResolutionMutex.current = targetResolution;

		const fetchCandles = async () => {
			console.debug(
				`candlesv2:: TV_FEED ASKING for candles between\n${new Date(
					periodParams.from * 1000
				).toISOString()} =>\n${new Date(periodParams.to * 1000).toISOString()}`
			);

			const formattedTsRange = this.formatTVRequestedRange(
				periodParams.from,
				periodParams.to
			);

			const candles = await this.candleClient.fetch({
				env: this.env,
				marketId: targetMarketId,
				resolution: targetResolution,
				fromTs: formattedTsRange.from,
				toTs: formattedTsRange.to,
			});
			return candles;
		};

		const candlesResult = await PollingSequenceGuard.fetch(
			candleFetchingPollKey,
			fetchCandles
		);

		if (candlesResult.length === 0) {
			console.debug(
				`candlesv2:: TV_FEED NO CANDLES FOUND for ${targetMarketId.key}-${targetResolution}::${periodParams.from}=>${periodParams.to}`
			);
			onResult([], {
				noData: true,
			});
			return;
		}

		// Protect against user switching between UI faster than candle client responds, by checking that market and resoltion mutexes match
		if (
			targetMarketId.key === this.chartMarketMutex.current &&
			targetResolution === this.chartResolutionMutex.current
		) {
			const bars = candlesResult.map((candle) =>
				candleToTvBar(candle, this.candleType)
			);

			console.debug(
				`candlesv2:: TV_FEED RETURNING candles between\n${new Date(
					bars[0].time
				).toISOString()} =>\n${new Date(
					bars[bars.length - 1].time
				).toISOString()}`
			);

			onResult(bars, {
				noData: candlesResult.length === 0,
			});
			return;
		} else {
			throw new Error('Market or resolution mutex mismatch');
		}
	}

	async subscribeBars(
		symbolInfo,
		resolution,
		onTick,
		subscriberGuid: string,
		_resetHistory
	) {
		const targetResolution =
			tvResolutionStringToStandardResolutionString(resolution);
		const targetMarket = findMarketBySymbol(symbolInfo.ticker, this.env);
		const targetMarketId =
			targetMarket.type === 'perp'
				? MarketId.createPerpMarket(targetMarket.config.marketIndex)
				: MarketId.createSpotMarket(targetMarket.config.marketIndex);

		// First create the subscription and wait for it to be ready
		await this.candleClient.subscribe(
			{
				resolution: targetResolution,
				marketId: targetMarketId,
				env: this.env,
			},
			subscriberGuid
		);

		// Then set up the event listener once the eventBus exists
		this.candleClient.on(subscriberGuid, 'candle-update', (newCandle) => {
			const newBar = candleToTvBar(newCandle, this.candleType);

			console.debug(
				`candlesv2:: TV_FEED UPDATE for ${subscriberGuid} :: ${newBar.close}`
			);

			if (targetMarketId.key === this.chartMarketMutex.current) {
				onTick(newBar);
			}
		});
	}

	unsubscribeBars(listenerGuid: string): void {
		this.candleClient.unsubscribe(listenerGuid);
	}
}
