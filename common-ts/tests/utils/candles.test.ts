import {
	BASE_PRECISION_EXP,
	BigNum,
	BN,
	CandleResolution,
	OrderAction,
	PRICE_PRECISION_EXP,
	PublicKey,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { describe, expect, test } from '@jest/globals';
import { PartialUISerializableOrderActionRecord } from '../../src/utils';
import { Serializer, UISerializableCandle } from '../../src/serializableTypes';
import { Candle } from '../../src/utils/candles/Candle';

const timestampFromDateString = (dateString: string) =>
	Math.floor(new Date(Date.parse(dateString + ' GMT')).getTime());

const generateTradeRecord = (
	quoteAssetAmountFilled = BigNum.zero(QUOTE_PRECISION_EXP),
	baseAssetAmountFilled = BigNum.zero(BASE_PRECISION_EXP),
	ts = new BN(0),
	slot = 0,
	action = OrderAction.FILL,
	fillRecordId = new BN(0),
	taker = PublicKey.default,
	takerOrderBaseAssetAmount = BigNum.zero(BASE_PRECISION_EXP),
	makerOrderBaseAssetAmount = BigNum.zero(BASE_PRECISION_EXP),
	takerOrderCumulativeBaseAssetAmountFilled = BigNum.zero(BASE_PRECISION_EXP),
	makerOrderCumulativeBaseAssetAmountFilled = BigNum.zero(BASE_PRECISION_EXP),
	takerOrderCumulativeQuoteAssetAmountFilled = BigNum.zero(QUOTE_PRECISION_EXP),
	makerOrderCumulativeQuoteAssetAmountFilled = BigNum.zero(QUOTE_PRECISION_EXP)
): PartialUISerializableOrderActionRecord => {
	return {
		quoteAssetAmountFilled,
		baseAssetAmountFilled,
		ts,
		slot,
		action,
		fillRecordId,
		taker,
		takerOrderBaseAssetAmount,
		makerOrderBaseAssetAmount,
		takerOrderCumulativeBaseAssetAmountFilled,
		makerOrderCumulativeBaseAssetAmountFilled,
		takerOrderCumulativeQuoteAssetAmountFilled,
		makerOrderCumulativeQuoteAssetAmountFilled,
		oraclePrice: BigNum.zero(QUOTE_PRECISION_EXP),
	};
};

const DEFAULT_BASE_AMOUNT = 10;

const generateTradeRecordWithTargetPrice = (price: number, ts: number) => {
	const baseAmount = BigNum.fromPrint(
		DEFAULT_BASE_AMOUNT.toString(),
		BASE_PRECISION_EXP
	);
	const quoteAmount = BigNum.fromPrint(
		(price * DEFAULT_BASE_AMOUNT).toString(),
		QUOTE_PRECISION_EXP
	);

	return generateTradeRecord(
		quoteAmount,
		baseAmount,
		new BN(ts),
		undefined,
		undefined,
		undefined,
		undefined,
		baseAmount,
		baseAmount,
		baseAmount,
		baseAmount,
		quoteAmount,
		quoteAmount
	);
};

const generateCandle = (
	start: number,
	open: number,
	close: number,
	high: number,
	low: number,
	quoteVolume: number,
	baseVolume: number,
	resolution: CandleResolution
): UISerializableCandle => {
	return {
		start: new BN(start),
		fillOpen: BigNum.fromPrint(open.toString(), PRICE_PRECISION_EXP),
		fillClose: BigNum.fromPrint(close.toString(), PRICE_PRECISION_EXP),
		fillHigh: BigNum.fromPrint(high.toString(), PRICE_PRECISION_EXP),
		fillLow: BigNum.fromPrint(low.toString(), PRICE_PRECISION_EXP),
		oracleOpen: BigNum.zero(PRICE_PRECISION_EXP),
		oracleClose: BigNum.zero(PRICE_PRECISION_EXP),
		oracleHigh: BigNum.zero(PRICE_PRECISION_EXP),
		oracleLow: BigNum.zero(PRICE_PRECISION_EXP),
		quoteVolume: BigNum.fromPrint(quoteVolume.toString(), QUOTE_PRECISION_EXP),
		baseVolume: BigNum.fromPrint(baseVolume.toString(), BASE_PRECISION_EXP),
		resolution,
	};
};

describe('candles-tests', () => {
	test('creates-candles-from-trades-correctly', async () => {
		/**
		 * Things to test:
		 * 1: Creating a new candle from trades without any previous one
		 * 2: Creating a new candle from trades with a previous one in the same timeslot
		 * 3: Creating a new candle from trades with a previous one in a diff timeslot
		 * 4: Trying to create a candle where not all of the trades belong in the same timeslot
		 */

		console.log(`Test 1`);
		(() => {
			const now = timestampFromDateString('2022-01-01 00:00:00');
			const nowTs = now / 1000;
			const barStartTime =
				now - (now % Candle.resolutionStringToCandleLengthMs('1'));
			const candleResolution: CandleResolution = '1';

			const tradesToUse: PartialUISerializableOrderActionRecord[] = [
				generateTradeRecordWithTargetPrice(10, nowTs),
				generateTradeRecordWithTargetPrice(11, nowTs + 1),
				generateTradeRecordWithTargetPrice(12, nowTs + 2),
			];

			const newCandle = Candle.convertTradesToCandle(
				tradesToUse,
				barStartTime,
				candleResolution,
				undefined
			);

			const expectedCandle = generateCandle(
				now,
				10,
				12,
				12,
				10,
				(10 + 11 + 12) * DEFAULT_BASE_AMOUNT,
				tradesToUse.length * DEFAULT_BASE_AMOUNT,
				'1'
			);

			expect(Serializer.Serialize.Candle(newCandle)).toEqual(
				Serializer.Serialize.Candle(expectedCandle)
			);
		})();

		console.log(`Test 2`);
		(() => {
			const now = timestampFromDateString('2022-01-01 00:00:00');
			const nowTs = now / 1000;
			const barStartTime =
				now - (now % Candle.resolutionStringToCandleLengthMs('1'));
			const candleResolution: CandleResolution = '1';

			const tradesToUse: PartialUISerializableOrderActionRecord[] = [
				generateTradeRecordWithTargetPrice(10, nowTs),
				generateTradeRecordWithTargetPrice(11, nowTs + 1),
				generateTradeRecordWithTargetPrice(12, nowTs + 2),
			];

			const previousCandle = generateCandle(
				now,
				5,
				5,
				5,
				5,
				20 * DEFAULT_BASE_AMOUNT,
				4 * DEFAULT_BASE_AMOUNT,
				'1'
			);

			const newCandle = Candle.convertTradesToCandle(
				tradesToUse,
				barStartTime,
				candleResolution,
				previousCandle
			);

			const expectedCandle = generateCandle(
				now,
				5,
				12,
				12,
				5,
				(20 + 10 + 11 + 12) * DEFAULT_BASE_AMOUNT,
				(4 + tradesToUse.length) * DEFAULT_BASE_AMOUNT,
				'1'
			);

			expect(Serializer.Serialize.Candle(newCandle)).toEqual(
				Serializer.Serialize.Candle(expectedCandle)
			);
		})();

		console.log(`Test 3`);
		(() => {
			const previous = timestampFromDateString('2022-01-01 00:00:00');
			const now = timestampFromDateString('2022-01-01 00:01:00');
			const nowTs = now / 1000;
			const barStartTime =
				now - (now % Candle.resolutionStringToCandleLengthMs('1'));
			const candleResolution: CandleResolution = '1';

			const tradesToUse: PartialUISerializableOrderActionRecord[] = [
				generateTradeRecordWithTargetPrice(10, nowTs),
				generateTradeRecordWithTargetPrice(11, nowTs + 1),
				generateTradeRecordWithTargetPrice(12, nowTs + 2),
			];

			const previousCandle = generateCandle(
				previous,
				5,
				5,
				5,
				5,
				20 * DEFAULT_BASE_AMOUNT,
				4 * DEFAULT_BASE_AMOUNT,
				'1'
			);

			const newCandle = Candle.convertTradesToCandle(
				tradesToUse,
				barStartTime,
				candleResolution,
				previousCandle
			);

			const expectedCandle = generateCandle(
				now,
				5,
				12,
				12,
				5,
				(10 + 11 + 12) * DEFAULT_BASE_AMOUNT,
				tradesToUse.length * DEFAULT_BASE_AMOUNT,
				'1'
			);

			expect(Serializer.Serialize.Candle(newCandle)).toEqual(
				Serializer.Serialize.Candle(expectedCandle)
			);
		})();

		console.log(`Test 4`);
		(() => {
			const timeOne = timestampFromDateString('2022-01-01 00:01:00');
			const timeTwo = timestampFromDateString('2022-01-01 00:02:00');
			const barStartTimeOne = timeOne;
			const barStartTimeTwo = timeTwo;
			const candleResolution: CandleResolution = '1';

			const tradesToUse: PartialUISerializableOrderActionRecord[] = [
				generateTradeRecordWithTargetPrice(10, barStartTimeOne / 1000),
				generateTradeRecordWithTargetPrice(10, barStartTimeOne / 1000),
				generateTradeRecordWithTargetPrice(10, barStartTimeOne / 1000),
				generateTradeRecordWithTargetPrice(10, barStartTimeTwo / 1000),
				generateTradeRecordWithTargetPrice(10, barStartTimeTwo / 1000),
				generateTradeRecordWithTargetPrice(10, barStartTimeTwo / 1000),
			];

			const newCandleOne = Candle.convertTradesToCandle(
				tradesToUse,
				barStartTimeOne,
				candleResolution,
				undefined
			);

			const newCandleTwo = Candle.convertTradesToCandle(
				tradesToUse,
				barStartTimeTwo,
				candleResolution,
				undefined
			);

			const expectedCandleOne = generateCandle(
				timeOne,
				10,
				10,
				10,
				10,
				30 * DEFAULT_BASE_AMOUNT,
				3 * DEFAULT_BASE_AMOUNT,
				'1'
			);

			const expectedCandleTwo = generateCandle(
				timeTwo,
				10,
				10,
				10,
				10,
				30 * DEFAULT_BASE_AMOUNT,
				3 * DEFAULT_BASE_AMOUNT,
				'1'
			);

			expect(Serializer.Serialize.Candle(newCandleOne)).toEqual(
				Serializer.Serialize.Candle(expectedCandleOne)
			);

			expect(Serializer.Serialize.Candle(newCandleTwo)).toEqual(
				Serializer.Serialize.Candle(expectedCandleTwo)
			);
		})();
	});

	test('Unit test candle creation utility methods', () => {
		/**
		 * Things to test:
		 *
		 *
		 * 1. mergeTradesIntoCandle
		 * -- no trades
		 * -- trades
		 * 2. mergeCandleWithPrevious
		 * -- previous in previous slot
		 * -- previous in same slot
		 * -- test low/high coming from previous/current
		 */

		(() => {
			const now = timestampFromDateString('2022-01-01 00:00:00');
			const nowTs = now / 1000;
			const tradesToUse: PartialUISerializableOrderActionRecord[] = [
				generateTradeRecordWithTargetPrice(10, nowTs),
				generateTradeRecordWithTargetPrice(11, nowTs + 1),
				generateTradeRecordWithTargetPrice(12, nowTs + 2),
			];

			const candleOne = generateCandle(now, 0, 0, 0, 0, 0, 0, '1');

			const candleTwo = generateCandle(
				now,
				5,
				10,
				10,
				5,
				30 * DEFAULT_BASE_AMOUNT,
				3 * DEFAULT_BASE_AMOUNT,
				'1'
			);

			console.log('Test 1.1');
			const outputOne = Candle.mergeTradesIntoCandle([], candleOne);
			const expectedOutputOne = generateCandle(now, 0, 0, 0, 0, 0, 0, '1');

			expect(Serializer.Serialize.Candle(outputOne)).toEqual(
				Serializer.Serialize.Candle(expectedOutputOne)
			);

			console.log('Test 1.2');
			const outputTwo = Candle.mergeTradesIntoCandle([], candleTwo);
			const expectedOutputTwo = generateCandle(
				now,
				5,
				10,
				10,
				5,
				30 * DEFAULT_BASE_AMOUNT,
				3 * DEFAULT_BASE_AMOUNT,
				'1'
			);

			expect(Serializer.Serialize.Candle(outputTwo)).toEqual(
				Serializer.Serialize.Candle(expectedOutputTwo)
			);

			console.log('Test 1.3');
			const outputThree = Candle.mergeTradesIntoCandle(tradesToUse, candleOne);
			const expectedOutputThree = generateCandle(
				now,
				0,
				12,
				12,
				0,
				(10 + 11 + 12) * DEFAULT_BASE_AMOUNT,
				3 * DEFAULT_BASE_AMOUNT,
				'1'
			);

			expect(Serializer.Serialize.Candle(outputThree)).toEqual(
				Serializer.Serialize.Candle(expectedOutputThree)
			);

			console.log('Test 1.4');
			const outputFour = Candle.mergeTradesIntoCandle(tradesToUse, candleTwo);
			const expectedOutputFour = generateCandle(
				now,
				5,
				12,
				12,
				5,
				(30 + 10 + 11 + 12) * DEFAULT_BASE_AMOUNT,
				6 * DEFAULT_BASE_AMOUNT,
				'1'
			);

			expect(Serializer.Serialize.Candle(outputFour)).toEqual(
				Serializer.Serialize.Candle(expectedOutputFour)
			);
		})();
	});
});
