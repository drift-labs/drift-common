import {
	AMM_RESERVE_PRECISION_EXP,
	BASE_PRECISION,
	BN,
	Event,
	PRICE_PRECISION,
	OrderAction,
	OrderActionRecord,
	OrderRecord,
	PublicKey,
	QUOTE_PRECISION,
	ZERO,
	PRICE_PRECISION_EXP,
	BASE_PRECISION_EXP,
	BigNum,
	MarketType,
	DriftClient,
	SPOT_MARKET_RATE_PRECISION_EXP,
	calculateDepositRate,
	calculateBorrowRate,
	getTokenAmount,
	SpotBalanceType,
	SpotMarketConfig,
} from '@drift-labs/sdk';
import {
	UIMatchedOrderRecordAndAction,
	UISerializableOrderActionRecord,
} from '../serializableTypes';
import { getIfStakingVaultApr } from './insuranceFund';

export const matchEnum = (enum1: any, enum2) => {
	return JSON.stringify(enum1) === JSON.stringify(enum2);
};

function enumToObj(enumStr: string) {
	if (!enumStr) return undefined;

	return {
		[enumStr ?? '']: {},
	};
}

function enumToStr(enumStr: Record<string, any>) {
	return Object.keys(enumStr ?? {})?.[0];
}

export const ENUM_UTILS = {
	match: matchEnum,
	toObj: enumToObj,
	toStr: enumToStr,
};

export async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
const getStringifiableObjectEntry = (value: any): [any, string] => {
	// If BN
	// if (value instanceof BN) { /* This method would be much safer but don't think it's possible to ensure that instances of classes match when they're in different npm packages */
	if (Object.keys(value).sort().join(',') === 'length,negative,red,words') {
		return [value.toString(), '_bgnm_'];
	}

	// If PublicKey
	// if (value instanceof PublicKey) { { /* This method would be much safer but don't think it's possible to ensure that instances of classes match when they're in different npm packages */
	if (Object.keys(value).sort().join(',') === '_bn') {
		return [value.toString(), '_pbky_'];
	}

	if (typeof value === 'object') {
		return [encodeStringifiableObject(value), ''];
	}

	return [value, ''];
};

/**
 * Converts an objects with potential Pubkeys and BNs in it into a form that can be JSON stringified. When pubkeys get converted a _pbky_ suffix will be added to their key, and _bgnm_ for BNs.
 *
 * e.g.
 * input : {
 * QuoteAmount: BN
 * }
 *
 * output: {
 * _bgnm_QuoteAmount: string
 * }
 * @param value
 * @returns
 */
export const encodeStringifiableObject = (value: any) => {
	if (typeof value !== 'object') return value;

	if (Array.isArray(value)) {
		return value.map((entry) => encodeStringifiableObject(entry));
	}

	const buildJsonObject = {};

	if (!value) return value;

	Object.entries(value).forEach(([key, val]) => {
		const [convertedVal, keyTag] = getStringifiableObjectEntry(val);
		buildJsonObject[`${keyTag}${key}`] = convertedVal;
	});

	return buildJsonObject;
};

/**
 * Converts a parsed object with potential Pubkeys and BNs in it (in string form) to their proper form. Pubkey values must have a key starting in _pbky_ and BN values must have a key starting in _bnnm_
 *
 * * e.g.
 * input : {
 * _bgnm_QuoteAmount: string
 * }
 *
 * output: {
 * QuoteAmount: BN
 * }
 * @param value
 * @returns
 */
export const decodeStringifiableObject = (value: any) => {
	if (typeof value !== 'object') return value;

	if (Array.isArray(value)) {
		return value.map((entry) => decodeStringifiableObject(entry));
	}

	const buildJsonObject = {};

	Object.entries(value)
		.filter((val) => val != undefined && val != null)
		.forEach(([key, val]) => {
			if (key.match(/^_pbky_/)) {
				buildJsonObject[key.replace('_pbky_', '')] = new PublicKey(val);
				return;
			}

			if (key.match(/^_bgnm_/)) {
				buildJsonObject[key.replace('_bgnm_', '')] = new BN(val as string);
				return;
			}

			if (typeof val === 'object' && val != undefined && val != null) {
				buildJsonObject[key] = decodeStringifiableObject(val);
				return;
			}

			buildJsonObject[key] = val;
		});

	return buildJsonObject;
};

const getChronologicalValueForOrderAction = (action: OrderAction) => {
	return matchEnum(action, OrderAction.PLACE)
		? 0
		: matchEnum(action, OrderAction.FILL)
		? 1
		: 2;
};

/**
 * Returns 1 if the first Order is chronologically later than the second Order, -1 if before, 0 if equal
 * @param orderA
 * @param orderB
 * @returns
 */
export const getSortScoreForOrderRecords = (
	orderA: { slot: number },
	orderB: { slot: number }
) => {
	if (orderA.slot !== orderB.slot) {
		return orderA.slot > orderB.slot ? 1 : -1;
	}

	return 0;
};

export const getTradeInfoFromActionRecord = (
	actionRecord: PartialUISerializableOrderActionRecord
) => {
	return {
		ts: actionRecord.ts,
		baseAssetAmount: actionRecord.taker
			? actionRecord.takerOrderBaseAssetAmount
			: actionRecord.makerOrderBaseAssetAmount,
		baseAssetAmountFilled: actionRecord.taker
			? actionRecord.takerOrderCumulativeBaseAssetAmountFilled
			: actionRecord.makerOrderCumulativeBaseAssetAmountFilled,
		quoteAssetAmountFilled: actionRecord.taker
			? actionRecord.takerOrderCumulativeQuoteAssetAmountFilled
			: actionRecord.makerOrderCumulativeQuoteAssetAmountFilled,
	};
};

export type PartialOrderActionRecord =
	| PartialUISerializableOrderActionRecord
	| PartialOrderActionEventRecord;

export type PartialUISerializableOrderActionRecord = Pick<
	UISerializableOrderActionRecord,
	| 'quoteAssetAmountFilled'
	| 'baseAssetAmountFilled'
	| 'ts'
	| 'slot'
	| 'action'
	| 'fillRecordId'
	| 'taker'
	| 'takerOrderBaseAssetAmount'
	| 'makerOrderBaseAssetAmount'
	| 'takerOrderCumulativeBaseAssetAmountFilled'
	| 'makerOrderCumulativeBaseAssetAmountFilled'
	| 'takerOrderCumulativeQuoteAssetAmountFilled'
	| 'makerOrderCumulativeQuoteAssetAmountFilled'
	| 'oraclePrice'
>;

export type PartialOrderActionEventRecord = Pick<
	Event<OrderActionRecord>,
	| 'quoteAssetAmountFilled'
	| 'baseAssetAmountFilled'
	| 'ts'
	| 'slot'
	| 'action'
	| 'fillRecordId'
	| 'taker'
	| 'takerOrderBaseAssetAmount'
	| 'makerOrderBaseAssetAmount'
	| 'takerOrderCumulativeBaseAssetAmountFilled'
	| 'makerOrderCumulativeBaseAssetAmountFilled'
	| 'takerOrderCumulativeQuoteAssetAmountFilled'
	| 'makerOrderCumulativeQuoteAssetAmountFilled'
>;

/**
 * Returns 1 if the first Order is chronologically later than the second Order, -1 if before, 0 if equal
 * @param orderA
 * @param orderB
 * @returns
 */
export const getSortScoreForOrderActionRecords = (
	orderA: PartialOrderActionRecord,
	orderB: PartialOrderActionRecord
) => {
	if (orderA.slot !== orderB.slot) {
		return orderA.slot > orderB.slot ? 1 : -1;
	}

	if (!matchEnum(orderA.action, orderB.action)) {
		// @ts-ignore
		const orderAActionVal = getChronologicalValueForOrderAction(orderA.action);
		// @ts-ignore
		const orderBActionVal = getChronologicalValueForOrderAction(orderB.action);

		return orderAActionVal > orderBActionVal ? 1 : -1;
	}
	// @ts-ignore
	if (orderA.fillRecordId && orderB.fillRecordId) {
		if (!orderA.fillRecordId.eq(orderB.fillRecordId)) {
			// @ts-ignore
			return orderA.fillRecordId.gt(orderB.fillRecordId) ? 1 : -1;
		}
	}

	return 0;
};

export const sortUIMatchedOrderRecordAndAction = (
	records: UIMatchedOrderRecordAndAction[],
	direction: 'asc' | 'desc' = 'desc'
) => {
	const ascSortedRecords = records.sort((a, b) =>
		getSortScoreForOrderActionRecords(a.actionRecord, b.actionRecord)
	);

	return direction === 'desc' ? ascSortedRecords.reverse() : ascSortedRecords;
};

export const sortUIOrderActionRecords = (
	records: PartialUISerializableOrderActionRecord[],
	direction: 'asc' | 'desc' = 'desc'
) => {
	const ascSortedRecords = records.sort(getSortScoreForOrderActionRecords);

	return direction === 'desc' ? ascSortedRecords.reverse() : ascSortedRecords;
};

export const sortUIOrderRecords = <T extends { slot: number }>(
	records: T[],
	direction: 'asc' | 'desc' = 'desc'
) => {
	const ascSortedRecords = records.sort(getSortScoreForOrderRecords);

	return direction === 'desc' ? ascSortedRecords.reverse() : ascSortedRecords;
};

export const sortOrderRecords = (
	records: Event<OrderRecord>[],
	direction: 'asc' | 'desc' = 'desc'
) => {
	const ascSortedRecords = records.sort(getSortScoreForOrderRecords);

	return direction === 'desc' ? ascSortedRecords.reverse() : ascSortedRecords;
};

export const getLatestOfTwoUIOrderRecords = <T extends { slot: number }>(
	orderA: T,
	orderB: T
) => {
	return getSortScoreForOrderRecords(orderA, orderB) === 1 ? orderA : orderB;
};

export const getLatestOfTwoOrderRecords = <T extends { slot: number }>(
	orderA: T,
	orderB: T
) => {
	return getSortScoreForOrderRecords(orderA, orderB) === 1 ? orderA : orderB;
};

export const getUIOrderRecordsLaterThanTarget = <T extends { slot: number }>(
	target: T,
	records: T[]
) =>
	records.filter(
		(record) => getLatestOfTwoUIOrderRecords(record, target) === record
	);

// Trade records are order records which have been filled
export const orderActionRecordIsTrade = (orderRecord: OrderActionRecord) =>
	orderRecord.baseAssetAmountFilled.gt(ZERO) &&
	// @ts-ignore
	matchEnum(orderRecord.action, OrderAction.FILL) &&
	true;

export const uiOrderActionRecordIsTrade = (
	orderRecord: UISerializableOrderActionRecord
) =>
	orderRecord.baseAssetAmountFilled.gtZero() &&
	matchEnum(orderRecord.action, OrderAction.FILL) &&
	true;

// Trade records are order records which have been filled
export const filterTradeRecordsFromOrderActionRecords = (
	orderRecords: OrderActionRecord[]
): OrderActionRecord[] => orderRecords.filter(orderActionRecordIsTrade);

// Trade records are order records which have been filled
export const filterTradeRecordsFromUIOrderRecords = (
	orderRecords: UISerializableOrderActionRecord[]
): UISerializableOrderActionRecord[] =>
	orderRecords.filter(uiOrderActionRecordIsTrade);

/**
 * Returns the average price for a given base amount and quote amount.
 * @param quoteAmount
 * @param baseAmount
 * @returns PRICE_PRECISION
 */
export const getPriceForBaseAndQuoteAmount = (
	quoteAmount: BN,
	baseAmount: BN
) => {
	return quoteAmount
		.mul(PRICE_PRECISION)
		.mul(BASE_PRECISION)
		.div(QUOTE_PRECISION)
		.div(BigNum.from(baseAmount, BASE_PRECISION_EXP).val);
};

export const getPriceForOrderRecord = (
	orderRecord: Pick<
		OrderActionRecord,
		'quoteAssetAmountFilled' | 'baseAssetAmountFilled'
	>
) => {
	return getPriceForBaseAndQuoteAmount(
		// @ts-ignore
		orderRecord.quoteAssetAmountFilled,
		// @ts-ignore
		orderRecord.baseAssetAmountFilled
	);
};

export const getPriceForUIOrderRecord = (
	orderRecord: Pick<
		UISerializableOrderActionRecord,
		'quoteAssetAmountFilled' | 'baseAssetAmountFilled'
	>
) => {
	return orderRecord.quoteAssetAmountFilled
		.shiftTo(AMM_RESERVE_PRECISION_EXP)
		.shift(PRICE_PRECISION_EXP)
		.div(orderRecord.baseAssetAmountFilled.shiftTo(BASE_PRECISION_EXP))
		.shiftTo(PRICE_PRECISION_EXP);
};

export const orderIsNull = (
	order: UISerializableOrderActionRecord | Event<OrderActionRecord>,
	side: 'taker' | 'maker'
) => {
	return side === 'taker' ? !order.taker : !order.maker;
};

export const getAnchorEnumString = (enumVal: Record<string, unknown>) => {
	return Object.keys(enumVal)[0];
};
export class Ref<T> {
	public val: T;

	constructor(val: T) {
		this.val = val;
	}

	set(val: T) {
		this.val = val;
	}

	get() {
		return this.val;
	}
}

export class Counter {
	private val = 0;

	get() {
		return this.val;
	}

	increment(value = 1) {
		this.val += value;
	}

	reset() {
		this.val = 0;
	}
}

/**
 * Limits async callbacks to only have one running at a time
 */
export class CallbackLimiter {
	private callbackQueue: any[] = [];

	async send<T>(callback: () => Promise<T>): Promise<
		| {
				status: 'SKIPPED';
		  }
		| {
				status: 'RESULT';
				result: T;
		  }
	> {
		if (this.callbackQueue.length > 0) {
			return {
				status: 'SKIPPED',
			};
		}

		this.callbackQueue.push(1);

		const response = await callback();

		this.callbackQueue.pop();

		return {
			status: 'RESULT',
			result: response,
		};
	}
}

/**
 * A class which allows a group of switches to seperately turn a multiswitch on or off. The base state is the state of the "multiswitch" when all of the constituent switches are off. When any of the switches are "on" then the multiswitch flips to the opposite state
 *
 * If baseState is on  => any switch being "on" will turn the multiswitch off.
 * If baseState is off => any switch being "off" will turn the multiswitch off.
 */
export class MultiSwitch {
	private switches: string[] = [];
	private switchValue = 0;

	constructor(private baseState: 'on' | 'off' = 'off') {}

	private getSwitchKey(key: string) {
		// If first time using switch, add to list of switches
		if (!this.switches.includes(key)) {
			this.switches.push(key);
		}

		const switchIndex = this.switches.indexOf(key);

		return 2 ** switchIndex;
	}

	public switchOn(key: string) {
		if (this.baseState === 'on') {
			this._switchOff(key);
			return;
		}
		this._switchOn(key);
	}

	public switchOff(key: string) {
		if (this.baseState === 'on') {
			this._switchOn(key);
			return;
		}
		this._switchOff(key);
	}

	private _switchOff(key: string) {
		const switchKey = this.getSwitchKey(key);

		this.switchValue &= ~switchKey;
	}

	private _switchOn(key: string) {
		const switchKey = this.getSwitchKey(key);

		this.switchValue |= switchKey;
	}

	public get isOn() {
		// When the base state is on, then if any switch is on the multi-switch is off
		if (this.baseState === 'on') {
			return this.switchValue === 0;
		}

		if (this.baseState === 'off') {
			return this.switchValue > 0;
		}
	}
}

/**
 * Returns the quote amount of the current open interest for a market, using the current oracle price
 * @param marketIndex
 * @param marketType
 * @param driftClient
 * @returns
 */
const getCurrentOpenInterestForMarket = (
	marketIndex: number,
	marketType: MarketType,
	driftClient: DriftClient
) => {
	if (ENUM_UTILS.match(marketType, MarketType.PERP)) {
		const market = driftClient.getPerpMarketAccount(marketIndex);
		const OI = BigNum.from(
			market.amm.baseAssetAmountLong.add(market.amm.baseAssetAmountShort.abs()),
			BASE_PRECISION_EXP
		);

		const priceData = driftClient.getOraclePriceDataAndSlot(
			market.amm.oracle,
			market.amm.oracleSource
		);

		const price = BigNum.from(priceData.data.price, PRICE_PRECISION_EXP);

		const quoteOIforMarket = price.toNum() * OI.toNum();

		return quoteOIforMarket;
	} else {
		throw new Error('Invalid market type for Open Interest calculation');
	}
};

/**
 * Gets the deposit APR for a spot market, in percent
 * @param marketIndex
 * @param marketType
 * @param driftClient
 * @returns
 */
const getDepositAprForMarket = (
	marketIndex: number,
	marketType: MarketType,
	driftClient: DriftClient
) => {
	if (ENUM_UTILS.match(marketType, MarketType.SPOT)) {
		const marketAccount = driftClient.getSpotMarketAccount(marketIndex);

		const depositApr = BigNum.from(
			calculateDepositRate(marketAccount),
			SPOT_MARKET_RATE_PRECISION_EXP
		);

		const depositAprPct = depositApr.toNum() * 100;

		return depositAprPct;
	} else {
		throw new Error('Invalid market type for Deposit APR calculation');
	}
};

/**
 * Get's the borrow APR for a spot market, in percent
 * @param marketIndex
 * @param marketType
 * @param driftClient
 * @returns
 */
const getBorrowAprForMarket = (
	marketIndex: number,
	marketType: MarketType,
	driftClient: DriftClient
) => {
	if (ENUM_UTILS.match(marketType, MarketType.SPOT)) {
		const marketAccount = driftClient.getSpotMarketAccount(marketIndex);

		const depositApr = BigNum.from(
			calculateBorrowRate(marketAccount),
			SPOT_MARKET_RATE_PRECISION_EXP
		);

		const depositAprPct = depositApr.toNum() * 100;

		return depositAprPct;
	} else {
		throw new Error('Invalid market type for Borrow APR calculation');
	}
};

const getTotalBorrowsForMarket = (
	market: SpotMarketConfig,
	driftClient: DriftClient
) => {
	const marketAccount = driftClient.getSpotMarketAccount(market.marketIndex);

	const totalBorrowsTokenAmount = getTokenAmount(
		marketAccount.borrowBalance,
		driftClient.getSpotMarketAccount(marketAccount.marketIndex),
		SpotBalanceType.BORROW
	);

	const totalBorrowsAmountBigNum = BigNum.from(
		totalBorrowsTokenAmount,
		market.precisionExp
	);

	const priceData = driftClient.getOraclePriceDataAndSlot(
		marketAccount.oracle,
		marketAccount.oracleSource
	);

	const price = BigNum.from(priceData.data.price, PRICE_PRECISION_EXP);

	const totalBorrowsQuote = price.toNum() * totalBorrowsAmountBigNum.toNum();

	return Number(totalBorrowsQuote.toFixed(2));
};

const getTotalDepositsForMarket = (
	market: SpotMarketConfig,
	driftClient: DriftClient
) => {
	const marketAccount = driftClient.getSpotMarketAccount(market.marketIndex);

	const totalDepositsTokenAmount = getTokenAmount(
		marketAccount.depositBalance,
		marketAccount,
		SpotBalanceType.DEPOSIT
	);

	const totalDepositsTokenAmountBigNum = BigNum.from(
		totalDepositsTokenAmount,
		market.precisionExp
	);

	const priceData = driftClient.getOraclePriceDataAndSlot(
		marketAccount.oracle,
		marketAccount.oracleSource
	);

	const price = BigNum.from(priceData.data.price, PRICE_PRECISION_EXP);

	const totalDepositsBase = totalDepositsTokenAmountBigNum.toNum();
	const totalDepositsQuote =
		price.toNum() * totalDepositsTokenAmountBigNum.toNum();

	return {
		totalDepositsBase,
		totalDepositsQuote,
	};
};

/**
 * Check if numbers divide exactly, accounting for floating point division annoyingness
 * @param numerator
 * @param denominator
 * @returns
 */
const dividesExactly = (numerator: number, denominator: number) => {
	const division = numerator / denominator;
	const remainder = division % 1;

	if (remainder === 0) return true;

	// Because of floating point weirdness, we're just going to assume that if the remainder after dividing is less than 1/10^6 then the numbers do divide exactly
	if (Math.abs(remainder - 1) < 1 / 10 ** 6) return true;

	return false;
};

const toSnakeCase = (str: string): string =>
	str.replace(/[^\w]/g, '_').toLowerCase();

const toCamelCase = (str: string): string => {
	const words = str.split(/[_\-\s]+/); // split on underscores, hyphens, and spaces
	const firstWord = words[0].toLowerCase();
	const restWords = words
		.slice(1)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
	return [firstWord, ...restWords].join('');
};

export const aprFromApy = (apy: number, compoundsPerYear: number) => {
	const compoundedAmount = 1 + apy * 0.01;
	const estimatedApr =
		(Math.pow(compoundedAmount, 1 / compoundsPerYear) - 1) * compoundsPerYear;

	return estimatedApr * 100;
};

/**
 * Helper utility to get a sort score for "tiered" parameters.
 *
 * Example: Want to sort students by Grade, but fall back to using Age if they are equal. This method will accept an array for each student of [grade, age] and return the appropriate sort score for each.
 *
 * @param aScores
 * @param bScores
 * @returns
 */
export const getTieredSortScore = (aScores: number[], bScores: number[]) => {
	const maxIndex = Math.max(aScores.length, bScores.length);

	for (let i = 0; i < maxIndex; i++) {
		const aScore = aScores[i] ?? Number.MIN_SAFE_INTEGER;
		const bScore = bScores[i] ?? Number.MIN_SAFE_INTEGER;

		if (aScore !== bScore) return aScore - bScore;
	}

	return 0;
};

const normalizeBaseAssetSymbol = (symbol: string) => {
	return symbol.replace(/^1M/, '');
};

/**
 * Returns the number of standard deviations between a target value and the history of values to compare it to.
 * @param target
 * @param previousValues
 * @returns
 */
const calculateZScore = (target: number, previousValues: number[]): number => {
	const meanValue = calculateMean(previousValues);
	const standardDeviationValue = calculateStandardDeviation(
		previousValues,
		meanValue
	);

	const zScore = (target - meanValue) / standardDeviationValue;
	return zScore;
};

const calculateMean = (numbers: number[]): number => {
	const sum = numbers.reduce((total, num) => total + num, 0);
	return sum / numbers.length;
};

const calculateMedian = (numbers: number[]): number => {
	const sortedNumbers = numbers.sort();
	const middleIndex = Math.floor(sortedNumbers.length / 2);
	if (sortedNumbers.length % 2 === 0) {
		return (sortedNumbers[middleIndex - 1] + sortedNumbers[middleIndex]) / 2;
	} else {
		return sortedNumbers[middleIndex];
	}
};

const calculateStandardDeviation = (
	numbers: number[],
	mean: number
): number => {
	const squaredDifferences = numbers.map((num) => Math.pow(num - mean, 2));
	const sumSquaredDifferences = squaredDifferences.reduce(
		(total, diff) => total + diff,
		0
	);
	const variance = sumSquaredDifferences / numbers.length;
	return Math.sqrt(variance);
};

const glueArray = <T>(size: number, elements: T[]): T[][] => {
	const gluedElements: T[][] = [];

	elements.forEach((element, index) => {
		const gluedIndex = Math.floor(index / size);
		if (gluedElements[gluedIndex]) {
			gluedElements[gluedIndex].push(element);
		} else {
			gluedElements[gluedIndex] = [element];
		}
	});

	return gluedElements;
};

const bnMin = (numbers: BN[]): BN => {
	let min = numbers[0];
	for (let i = 1; i < numbers.length; i++) {
		if (numbers[i].lt(min)) {
			min = numbers[i];
		}
	}
	return min;
};

const bnMax = (numbers: BN[]): BN => {
	let max = numbers[0];
	for (let i = 1; i < numbers.length; i++) {
		if (numbers[i].gt(max)) {
			max = numbers[i];
		}
	}
	return max;
};

const bnMedian = (numbers: BN[]): BN => {
	const sortedNumbers = numbers.sort((a, b) => a.cmp(b));
	const middleIndex = Math.floor(sortedNumbers.length / 2);
	if (sortedNumbers.length % 2 === 0) {
		return sortedNumbers[middleIndex - 1]
			.add(sortedNumbers[middleIndex])
			.div(new BN(2));
	} else {
		return sortedNumbers[middleIndex];
	}
};

const bnMean = (numbers: BN[]): BN => {
	let sum = new BN(0);
	for (let i = 0; i < numbers.length; i++) {
		sum = sum.add(numbers[i]);
	}
	return sum.div(new BN(numbers.length));
};

const timedPromise = async <T>(promise: T) => {
	const start = Date.now();
	const promiseResult = await promise;

	return {
		promiseTime: Date.now() - start,
		promiseResult,
	};
};

const chunks = <T>(array: readonly T[], size: number): T[][] => {
	return new Array(Math.ceil(array.length / size))
		.fill(null)
		.map((_, index) => index * size)
		.map((begin) => array.slice(begin, begin + size));
};

export const COMMON_UTILS = {
	getIfStakingVaultApr,
	getCurrentOpenInterestForMarket,
	getDepositAprForMarket,
	getBorrowAprForMarket,
	getTotalBorrowsForMarket,
	getTotalDepositsForMarket,
	dividesExactly,
	toSnakeCase,
	toCamelCase,
	getTieredSortScore,
	normalizeBaseAssetSymbol,
	calculateZScore,
	glueArray,
	timedPromise,
	chunks,
	MATH: {
		NUM: {
			mean: calculateMean,
			median: calculateMedian,
		},
		BN: {
			bnMax,
			bnMin,
			bnMean,
			bnMedian,
		},
	},
};
