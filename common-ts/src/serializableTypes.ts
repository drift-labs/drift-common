import {
	BASE_PRECISION_EXP,
	BigNum,
	BN,
	CandleResolution,
	CurveRecord,
	DepositExplanation,
	DepositRecord,
	Event,
	FundingPaymentRecord,
	FundingRateRecord,
	InsuranceFundRecord,
	InsuranceFundStakeRecord,
	isVariant,
	LiquidateBorrowForPerpPnlRecord,
	LiquidatePerpPnlForDepositRecord,
	LiquidatePerpRecord,
	LiquidateSpotRecord,
	LiquidationRecord,
	LiquidationType,
	LPAction,
	LPRecord,
	MarketType,
	NewUserRecord,
	Order,
	OrderAction,
	OrderActionExplanation,
	OrderActionRecord,
	OrderRecord,
	OrderStatus,
	OrderTriggerCondition,
	OrderType,
	PERCENTAGE_PRECISION_EXP,
	PerpBankruptcyRecord,
	PositionDirection,
	PRICE_PRECISION_EXP,
	PublicKey,
	QUOTE_PRECISION_EXP,
	SettlePnlExplanation,
	SettlePnlRecord,
	SpotBalanceType,
	SpotBankruptcyRecord,
	SpotInterestRecord,
	StakeAction,
	SwapRecord,
	TEN,
} from '@drift-labs/sdk';
import {
	autoserializeAs,
	autoserializeAsArray,
	autoserializeAsJson,
	autoserializeUsing,
	Deserialize,
	inheritSerialization,
	JsonObject,
	Serialize,
	SetDeserializeKeyTransform,
	SetSerializeKeyTransform,
	SnakeCase,
} from 'cerializr';
import {
	AccountSnapshot,
	Config,
	LeaderboardResult,
	LeaderBoardResultRow,
	PnlHistoryDataPoint,
	PnlSnapshotOrderOption,
	RollingPnlData,
	SnapshotEpochResolution,
	UIAccountSnapshot,
	UserPerpPositionSnapshot,
	UserSnapshotRecord,
	UserSpotPositionSnapshot,
} from './index';
import { assert } from './utils/assert';

// Reusable transformers

const BNSerializationFn = (target: BN) =>
	target ? target.toString() : undefined;
const BNDeserializationFn = (val: string) => (val ? new BN(val) : undefined);
const BNSerializeAndDeserializeFns = {
	Serialize: BNSerializationFn,
	Deserialize: BNDeserializationFn,
};

const BNArraySerializationFn = (target: BN[]) =>
	target.map((val) => (val ? val.toString() : undefined));
const BNArrayDeserializationFn = (values: string[]) =>
	values.map((val) => (val ? new BN(val) : undefined));
const BNArraySerializeAndDeserializeFns = {
	Serialize: BNArraySerializationFn,
	Deserialize: BNArrayDeserializationFn,
};

const QuoteBigNumSerializationFn = (target: BigNum | BN) =>
	target
		? target instanceof BigNum
			? target.print()
			: target.toString()
		: undefined;
const QuoteBigNumDeserializationFn = (val: string | number) =>
	val
		? typeof val === 'string'
			? BigNum.from(val.replace('.', ''), QUOTE_PRECISION_EXP)
			: BigNum.fromPrint(val.toString(), QUOTE_PRECISION_EXP)
		: undefined;
const QuoteBigNumSerializeAndDeserializeFns = {
	Serialize: QuoteBigNumSerializationFn,
	Deserialize: QuoteBigNumDeserializationFn,
};

const RawBigNumberSerializationFn = (target: BigNum | BN) =>
	target
		? target instanceof BigNum
			? target.print()
			: target.toString()
		: undefined;

const SUFFICIENTLY_LARGE_PRECISION_EXP = new BN(12);
const RawBigNumberDeserializationFn = (val: string | number) =>
	val !== undefined
		? typeof val === 'string'
			? BigNum.from(val.replace('.', ''), SUFFICIENTLY_LARGE_PRECISION_EXP)
			: BigNum.fromPrint(val.toString(), SUFFICIENTLY_LARGE_PRECISION_EXP)
		: undefined;
/**
 * Inputs the number as a BN string value, with a precision of 12.
 * Actual precision needs to be set manually during deserialization.
 */
const RawBigNumberSerializeAndDeserializeFns = {
	Serialize: RawBigNumberSerializationFn,
	Deserialize: RawBigNumberDeserializationFn,
};

const PctBigNumSerializationFn = (target: BigNum | BN) =>
	target
		? target instanceof BigNum
			? target.print()
			: target.toString()
		: undefined;

const PctBigNumDeserializationFn = (val: string | number) =>
	val
		? typeof val === 'string'
			? BigNum.from(val.replace('.', ''), PERCENTAGE_PRECISION_EXP)
			: BigNum.fromPrint(val.toString(), PERCENTAGE_PRECISION_EXP)
		: undefined;

const PctBigNumSerializeAndDeserializeFns = {
	Serialize: PctBigNumSerializationFn,
	Deserialize: PctBigNumDeserializationFn,
};

const BaseBigNumSerializationFn = (target: BigNum | BN) =>
	target
		? target instanceof BigNum
			? target.print()
			: target.toString()
		: undefined;
const BaseBigNumDeserializationFn = (val: string | number) =>
	val
		? typeof val === 'string'
			? BigNum.from(val.replace('.', ''), BASE_PRECISION_EXP)
			: BigNum.fromPrint(val.toString(), BASE_PRECISION_EXP)
		: undefined;
const BaseBigNumSerializeAndDeserializeFns = {
	Serialize: BaseBigNumSerializationFn,
	Deserialize: BaseBigNumDeserializationFn,
};

const PriceBigNumSerializationFn = (target: BigNum | BN) =>
	target
		? target instanceof BigNum
			? target.print()
			: target.toString()
		: undefined;
const PriceBigNumDeserializationFn = (val: string | number) =>
	val
		? typeof val === 'string'
			? BigNum.from(val.replace('.', ''), PRICE_PRECISION_EXP)
			: BigNum.fromPrint(val.toString(), PRICE_PRECISION_EXP)
		: undefined;
const PriceBigNumSerializeAndDeserializeFns = {
	Serialize: PriceBigNumSerializationFn,
	Deserialize: PriceBigNumDeserializationFn,
};

const FundingRateBigNumSerializationFn = (target: BigNum | BN) =>
	target
		? target instanceof BigNum
			? target.print()
			: target.toString()
		: undefined;
const FundingRateBigNumDeserializationFn = (val: string | number) =>
	val
		? typeof val === 'string'
			? BigNum.from(val.replace('.', ''), PRICE_PRECISION_EXP)
			: BigNum.fromPrint(val.toString(), PRICE_PRECISION_EXP)
		: undefined;
const FundingRateBigNumSerializeAndDeserializeFns = {
	Serialize: FundingRateBigNumSerializationFn,
	Deserialize: FundingRateBigNumDeserializationFn,
};

const BankCumulativeInterestBigNumSerializationFn = (target: BigNum | BN) =>
	target
		? target instanceof BigNum
			? target.print()
			: target.toString()
		: undefined;
const BankCumulativeInterestBigNumDeserializationFn = (val: string | number) =>
	val
		? typeof val === 'string'
			? BigNum.from(val.replace('.', ''), PRICE_PRECISION_EXP)
			: BigNum.fromPrint(val.toString(), PRICE_PRECISION_EXP)
		: undefined;
const BankCumulativeInterestBigNumSerializeAndDeserializeFns = {
	Serialize: BankCumulativeInterestBigNumSerializationFn,
	Deserialize: BankCumulativeInterestBigNumDeserializationFn,
};

const ReferralVolumeBigNumSerializationFn = (target: BigNum | BN) =>
	target
		? target instanceof BigNum
			? target.print()
			: target.toString()
		: undefined;
const ReferralVolumeBigNumDeserializationFn = (val: string | number) =>
	val
		? typeof val === 'string'
			? BigNum.from(val.replace('.', ''), TEN)
			: BigNum.fromPrint(val.toString(), TEN)
		: undefined;
const ReferralVolumeBigNumSerializeAndDeserializeFns = {
	Serialize: ReferralVolumeBigNumSerializationFn,
	Deserialize: ReferralVolumeBigNumDeserializationFn,
};

const PublicKeySerializationFn = (target: PublicKey) =>
	target ? target.toString() : undefined;
const PublicKeyDeserializationFn = (val: string) =>
	val ? new PublicKey(val) : undefined;
const PublicKeySerializeAndDeserializeFns = {
	Serialize: PublicKeySerializationFn,
	Deserialize: PublicKeyDeserializationFn,
};

const EnumSerializationFn = (target: Record<string, unknown>) => {
	if (!target) return null;

	return Object.keys(target)[0];
};
const EnumDeserializationFn = (val: any) => {
	if (!val) return null;

	{
		if (typeof val === 'string') return { [val]: {} };

		return val;
	}
};
const EnumSerializeAndDeserializeFns = {
	Serialize: EnumSerializationFn,
	Deserialize: EnumDeserializationFn,
};

// Serializable classes
//// Order Records

export type OrderRecordEvent = Event<OrderRecord>;

export class SerializableOrder implements Order {
	@autoserializeUsing(EnumSerializeAndDeserializeFns) status: OrderStatus;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) orderType: OrderType;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeAs(Number) orderId: number;
	@autoserializeAs(Number) userOrderId: number;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) price: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetAmountFilled: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) quoteAssetAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) quoteAssetAmountFilled: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fee: BN;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	direction: PositionDirection;
	@autoserializeAs(Boolean) reduceOnly: boolean;
	@autoserializeUsing(BNSerializeAndDeserializeFns) triggerPrice: BN;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	triggerCondition: OrderTriggerCondition;
	@autoserializeAs(Boolean) postOnly: boolean;
	@autoserializeAs(Boolean) immediateOrCancel: boolean;
	@autoserializeAs(Number) oraclePriceOffset: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) auctionStartPrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) auctionEndPrice: BN;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	existingPositionDirection: OrderStatus;
	@autoserializeUsing(BNSerializeAndDeserializeFns) slot: BN;
	@autoserializeAs(Boolean) triggered: boolean;
	@autoserializeAs(Number) auctionDuration: number;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) marketType: MarketType;
	@autoserializeAs(Number) timeInForce: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) maxTs: BN;
}

@inheritSerialization(SerializableOrder)
export class UISerializableOrder extends SerializableOrder {
	//@ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) price: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	baseAssetAmount: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	baseAssetAmountFilled: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	quoteAssetAmount: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	quoteAssetAmountFilled: BigNum;
	//@ts-ignore
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns) fee: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	triggerPrice: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	oraclePriceOffset: BigNum;

	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	auctionStartPrice: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	auctionEndPrice: BigNum;

	static onDeserialized(data: JsonObject, instance: UISerializableOrder) {
		assert(Config.initialized, 'Common Config Not Initialised');
		if (isVariant(instance.marketType, 'spot')) {
			const precisionToUse =
				Config.spotMarketsLookup[instance.marketIndex].precisionExp;
			instance.baseAssetAmount.precision = precisionToUse;

			instance.baseAssetAmountFilled.precision = precisionToUse;
		}
	}
}

// @ts-ignore
export class SerializableOrderRecord implements OrderRecordEvent {
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeAs(SerializableOrder) order: Order;
}

@inheritSerialization(SerializableOrderRecord)
export class UISerializableOrderRecord extends SerializableOrderRecord {
	//@ts-ignore
	@autoserializeAs(UISerializableOrder) order: UISerializableOrder;
}

export class SerializableOrderActionRecord implements Event<OrderActionRecord> {
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) slot: number;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) action: OrderAction;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	actionExplanation: OrderActionExplanation;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	marketType: MarketType;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	filler: PublicKey | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fillerReward: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fillRecordId: BN | null;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	referrer: PublicKey | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	baseAssetAmountFilled: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	quoteAssetAmountFilled: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) takerPnl: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) makerPnl: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) takerFee: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) makerRebate: BN | null;
	@autoserializeAs(Number) referrerReward: number | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) refereeDiscount: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	quoteAssetAmountSurplus: BN | null;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	taker: PublicKey | null;
	@autoserializeAs(Number) takerOrderId: number | null;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	takerOrderDirection: PositionDirection | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	takerOrderBaseAssetAmount: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	takerOrderCumulativeBaseAssetAmountFilled: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	takerOrderCumulativeQuoteAssetAmountFilled: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) takerOrderFee: BN | null;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	maker: PublicKey | null;
	@autoserializeAs(Number) makerOrderId: number | null;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	makerOrderDirection: PositionDirection | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	makerOrderBaseAssetAmount: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	makerOrderCumulativeBaseAssetAmountFilled: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	makerOrderCumulativeQuoteAssetAmountFilled: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) makerOrderFee: BN | null;
	@autoserializeUsing(BNSerializeAndDeserializeFns) oraclePrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) makerFee: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	spotFulfillmentMethodFee: BN | null;
}

@inheritSerialization(SerializableOrderActionRecord)
export class UISerializableOrderActionRecord extends SerializableOrderActionRecord {
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	fillerReward: BigNum | null;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	baseAssetAmountFilled: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	quoteAssetAmountFilled: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	takerPnl: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	makerPnl: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	takerFee: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	makerRebate: BigNum | null;

	@autoserializeAs(Number) referrerReward: number | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	refereeDiscount: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	quoteAssetAmountSurplus: BigNum | null;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	takerOrderBaseAssetAmount: BigNum | null;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	takerOrderCumulativeBaseAssetAmountFilled: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	takerOrderCumulativeQuoteAssetAmountFilled: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	takerOrderFee: BigNum | null;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	makerOrderBaseAssetAmount: BigNum | null;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	makerOrderCumulativeBaseAssetAmountFilled: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	makerOrderCumulativeQuoteAssetAmountFilled: BigNum | null;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	makerOrderFee: BigNum | null;

	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	oraclePrice: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	makerFee: BigNum | null;

	static onDeserialized(
		data: JsonObject,
		instance: UISerializableOrderActionRecord
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		if (isVariant(instance.marketType, 'spot')) {
			try {
				const precisionToUse =
					Config.spotMarketsLookup[instance.marketIndex].precisionExp;

				instance.baseAssetAmountFilled.precision = precisionToUse;
				instance.takerOrderBaseAssetAmount.precision = precisionToUse;
				instance.takerOrderCumulativeBaseAssetAmountFilled.precision =
					precisionToUse;
				instance.makerOrderBaseAssetAmount.precision = precisionToUse;
				instance.makerOrderCumulativeBaseAssetAmountFilled.precision =
					precisionToUse;
			} catch (e) {
				//console.error('Error in order action serializer', e);
			}
		}
	}
}

export class UISerializableOrderRecordV2 {
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeAs(String) status: string;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) orderType: OrderType;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) marketType: MarketType;
	@autoserializeAs(Number) orderId: number;
	@autoserializeAs(Number) userOrderId: number;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) price: BigNum;
	@autoserializeUsing(RawBigNumberSerializeAndDeserializeFns)
	baseAssetAmount: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	quoteAssetAmount: BigNum;
	@autoserializeUsing(RawBigNumberSerializeAndDeserializeFns)
	baseAssetAmountFilled: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	quoteAssetAmountFilled: BigNum;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	direction: PositionDirection;
	@autoserializeAs(Boolean) reduceOnly: boolean;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	triggerPrice: BigNum;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	triggerCondition: OrderTriggerCondition;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	existingPositionDirection: PositionDirection;
	@autoserializeAs(Boolean) postOnly: boolean;
	@autoserializeAs(Boolean) immediateOrCancel: boolean;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	oraclePriceOffset: BigNum;
	@autoserializeAs(Number) auctionDuration: number;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	auctionStartPrice: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	auctionEndPrice: BigNum;
	@autoserializeUsing(BNSerializeAndDeserializeFns) maxTs: BN;
	@autoserializeAs(String) symbol: string;
	@autoserializeUsing(BNSerializeAndDeserializeFns) lastUpdatedTs: BN;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	lastActionExplanation: OrderActionExplanation;

	static onDeserialized(
		data: JsonObject,
		instance: UISerializableOrderRecordV2
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		if (isVariant(instance.marketType, 'spot')) {
			const precisionToUse =
				Config.spotMarketsLookup[instance.marketIndex].precisionExp;

			instance.baseAssetAmount =
				instance.baseAssetAmount.shiftTo(precisionToUse);
			instance.baseAssetAmountFilled =
				instance.baseAssetAmountFilled.shiftTo(precisionToUse);
		} else if (isVariant(instance.marketType, 'perp')) {
			instance.baseAssetAmount =
				instance.baseAssetAmount.shiftTo(BASE_PRECISION_EXP);
			instance.baseAssetAmountFilled =
				instance.baseAssetAmountFilled.shiftTo(BASE_PRECISION_EXP);
		}
	}
}

export class UISerializableOrderActionRecordV2 {
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	fillerReward: BigNum;
	@autoserializeUsing(RawBigNumberSerializeAndDeserializeFns)
	baseAssetAmountFilled: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	quoteAssetAmountFilled: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns) takerFee: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	makerRebate: BigNum;
	@autoserializeAs(Number) referrerReward: number;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	quoteAssetAmountSurplus: BigNum;
	@autoserializeUsing(RawBigNumberSerializeAndDeserializeFns)
	takerOrderBaseAssetAmount: BigNum;
	@autoserializeUsing(RawBigNumberSerializeAndDeserializeFns)
	takerOrderCumulativeBaseAssetAmountFilled: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	takerOrderCumulativeQuoteAssetAmountFilled: BigNum;
	@autoserializeUsing(RawBigNumberSerializeAndDeserializeFns)
	makerOrderBaseAssetAmount: BigNum;
	@autoserializeUsing(RawBigNumberSerializeAndDeserializeFns)
	makerOrderCumulativeBaseAssetAmountFilled: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	makerOrderCumulativeQuoteAssetAmountFilled: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	oraclePrice: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns) makerFee: BigNum;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) action: OrderAction;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	actionExplanation: OrderActionExplanation;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) marketType: MarketType;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) filler: PublicKey;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fillRecordId: BN; //
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) taker: PublicKey;
	@autoserializeAs(Number) takerOrderId: number;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	takerOrderDirection: PositionDirection;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) maker: PublicKey;
	@autoserializeAs(Number) makerOrderId: number;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	makerOrderDirection: PositionDirection;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	spotFulfillmentMethodFee: number;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeAs(String) symbol: string;

	static onDeserialized(
		data: JsonObject,
		instance: UISerializableOrderActionRecordV2
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		if (isVariant(instance.marketType, 'spot')) {
			try {
				const precisionToUse =
					Config.spotMarketsLookup[instance.marketIndex].precisionExp;
				instance.baseAssetAmountFilled =
					instance.baseAssetAmountFilled.shiftTo(precisionToUse);
				instance.takerOrderBaseAssetAmount =
					instance.takerOrderBaseAssetAmount.shiftTo(precisionToUse);
				instance.takerOrderCumulativeBaseAssetAmountFilled =
					instance.takerOrderCumulativeBaseAssetAmountFilled.shiftTo(
						precisionToUse
					);
				instance.makerOrderBaseAssetAmount =
					instance.makerOrderBaseAssetAmount.shiftTo(precisionToUse);
				instance.makerOrderCumulativeBaseAssetAmountFilled =
					instance.makerOrderCumulativeBaseAssetAmountFilled.shiftTo(
						precisionToUse
					);
			} catch (e) {
				//console.error('Error in order action serializer', e);
			}
		} else if (isVariant(instance.marketType, 'perp')) {
			instance.baseAssetAmountFilled =
				instance.baseAssetAmountFilled.shiftTo(BASE_PRECISION_EXP);
			instance.takerOrderBaseAssetAmount =
				instance.takerOrderBaseAssetAmount.shiftTo(BASE_PRECISION_EXP);
			instance.takerOrderCumulativeBaseAssetAmountFilled =
				instance.takerOrderCumulativeBaseAssetAmountFilled.shiftTo(
					BASE_PRECISION_EXP
				);
			instance.makerOrderBaseAssetAmount =
				instance.makerOrderBaseAssetAmount.shiftTo(BASE_PRECISION_EXP);
			instance.makerOrderCumulativeBaseAssetAmountFilled =
				instance.makerOrderCumulativeBaseAssetAmountFilled.shiftTo(
					BASE_PRECISION_EXP
				);
		}
	}
}

export type DepositRecordEvent = Event<DepositRecord>;

export class SerializableDepositRecord implements DepositRecordEvent {
	@autoserializeAs(Number) id: number;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) depositRecordId: BN;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	userAuthority: PublicKey;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) direction: {
		deposit?: any;
		withdraw?: any;
	};
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) amount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) oraclePrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) marketDepositBalance: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) marketWithdrawBalance: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	marketCumulativeDepositInterest: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	marketCumulativeBorrowInterest: BN;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	transferUser?: PublicKey;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalDepositsAfter: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalWithdrawsAfter: BN;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	explanation: DepositExplanation;
}

@inheritSerialization(SerializableDepositRecord)
export class UISerializableDepositRecord extends SerializableDepositRecord {
	//@ts-ignore
	@autoserializeUsing(RawBigNumberSerializeAndDeserializeFns) amount: BigNum;

	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	oraclePrice: BigNum;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	marketDepositBalance: BigNum;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	marketWithdrawBalance: BigNum;

	@autoserializeUsing(BankCumulativeInterestBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	marketCumulativeDepositInterest: BigNum;

	@autoserializeUsing(BankCumulativeInterestBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	marketCumulativeBorrowInterest: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalDepositsAfter: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalWithdrawsAfter: BigNum;

	static onDeserialized(
		data: JsonObject,
		instance: UISerializableDepositRecord
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		instance.amount = instance.amount.shiftTo(
			Config.spotMarketsLookup[instance.marketIndex].precisionExp
		);

		instance.marketDepositBalance.precision =
			Config.spotMarketsLookup[instance.marketIndex].precisionExp;
		instance.marketWithdrawBalance.precision =
			Config.spotMarketsLookup[instance.marketIndex].precisionExp;
	}
}

// Spot interest record event
export type SpotInterestRecordEvent = Event<SpotInterestRecord>;
export class SerializableSpotInterestRecord implements SpotInterestRecordEvent {
	@autoserializeAs(Number) id: number;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) depositBalance: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeDepositInterest: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) borrowBalance: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeBorrowInterest: BN;
	@autoserializeAs(Number) optimalUtilization: number;
	@autoserializeAs(Number) optimalBorrowRate: number;
	@autoserializeAs(Number) maxBorrowRate: number;
}

// Curve record event
export type CurveRecordEvent = Event<CurveRecord>;
export class SerializableCurveRecord implements CurveRecordEvent {
	@autoserializeAs(Number) id: number;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) recordId: BN;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) pegMultiplierBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetReserveBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) quoteAssetReserveBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) sqrtKBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) pegMultiplierAfter: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetReserveAfter: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) quoteAssetReserveAfter: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) sqrtKAfter: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetAmountLong: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetAmountShort: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetAmountWithAmm: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalFee: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	totalFeeMinusDistributions: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) adjustmentCost: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) numberOfUsers: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) oraclePrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fillRecord: BN;
}

// Settle Pnl Records

export type SettlePnlRecordEvent = Event<SettlePnlRecord>;

export class SerializableSettlePnlRecord implements SettlePnlRecordEvent {
	@autoserializeAs(Number) id: number;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	user: PublicKey;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) pnl: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) quoteAssetAmountAfter: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) quoteEntryAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) settlePrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) oraclePrice: BN;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	explanation: SettlePnlExplanation;
}

@inheritSerialization(SerializableSettlePnlRecord)
export class UISerializableSettlePnlRecord extends SerializableSettlePnlRecord {
	//@ts-ignore
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns) pnl: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	baseAssetAmount: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	quoteAssetAmountAfter: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	quoteEntryAmount: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	settlePrice: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	oraclePrice: BigNum;
}

//// FundingRate Records

export type FundingRateRecordEvent = Event<FundingRateRecord>;
// @ts-ignore
export class SerializableFundingRateRecord implements FundingRateRecordEvent {
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) recordId: BN;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fundingRate: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeFundingRateLong: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeFundingRateShort: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) oraclePriceTwap: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) markPriceTwap: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fundingRateLong: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fundingRateShort: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) periodRevenue: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	baseAssetAmountWithAmm: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	baseAssetAmountWithUnsettledLp: BN;
}

@inheritSerialization(SerializableFundingRateRecord)
export class UISerializableFundingRateRecord extends SerializableFundingRateRecord {
	@autoserializeUsing(FundingRateBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	fundingRate: BigNum;
	@autoserializeUsing(FundingRateBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeFundingRateLong: BigNum;
	@autoserializeUsing(FundingRateBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeFundingRateShort: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	oraclePriceTwap: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	markPriceTwap: BigNum;
	@autoserializeUsing(FundingRateBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	fundingRateLong: BigNum;
	@autoserializeUsing(FundingRateBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	fundingRateShort: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	periodRevenue: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	baseAssetAmountWithAmm: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	baseAssetAmountWithUnsettledLp: BigNum;
}

//// FundingPayment Records

export type FundingPaymentRecordEvent = Event<FundingPaymentRecord>;

export class SerializableFundingPaymentRecord
	implements FundingPaymentRecordEvent
{
	@autoserializeAs(Number) id: number;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	userAuthority: PublicKey;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fundingPayment: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	userLastCumulativeFunding: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	ammCumulativeFundingLong: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	ammCumulativeFundingShort: BN;
}

@inheritSerialization(SerializableFundingPaymentRecord)
export class UISerializableFundingPaymentRecord extends SerializableFundingPaymentRecord {
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	fundingPayment: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	baseAssetAmount: BigNum;
	@autoserializeUsing(FundingRateBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	userLastCumulativeFunding: BigNum;
	@autoserializeUsing(FundingRateBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	ammCumulativeFundingLong: BigNum;
	@autoserializeUsing(FundingRateBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	ammCumulativeFundingShort: BigNum;
}

//// Liquidation Records
// @ts-ignore
export class SerializableLiquidatePerpRecord implements LiquidatePerpRecord {
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNArraySerializeAndDeserializeFns) orderIds: BN[];
	@autoserializeUsing(BNSerializeAndDeserializeFns) oraclePrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) quoteAssetAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) userPnl: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) liquidatorPnl: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) canceledOrdersFee: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) userOrderId: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) liquidatorOrderId: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fillRecordId: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) lpShares: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) liquidatorFee: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ifFee: BN;
}

@inheritSerialization(SerializableLiquidatePerpRecord)
export class UISerializableLiquidatePerpRecord extends SerializableLiquidatePerpRecord {
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	oraclePrice: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	baseAssetAmount: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	quoteAssetAmount: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	userPnl: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	liquidatorPnl: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	canceledOrdersFee: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	canceledOrdersFee: BigNum;
	//@ts-ignore
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns) lpShares: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	liquidatorFee: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	ifFee: BigNum;
}

export class SerializableLiquidateSpotRecord implements LiquidateSpotRecord {
	@autoserializeAs(Number) assetMarketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) assetPrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) assetTransfer: BN;
	@autoserializeAs(Number) liabilityMarketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) liabilityPrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) liabilityTransfer: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ifFee: BN;
}

@inheritSerialization(SerializableLiquidateSpotRecord)
export class UISerializableLiquidateSpotRecord extends SerializableLiquidateSpotRecord {
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	assetPrice: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	assetTransfer: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	liabilityPrice: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	liabilityTransfer: BigNum;

	static onDeserialized(
		data: JsonObject,
		instance: UISerializableLiquidateSpotRecord
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		instance.assetTransfer.precision =
			Config.spotMarketsLookup[instance.assetMarketIndex].precisionExp;
		instance.liabilityTransfer.precision =
			Config.spotMarketsLookup[instance.liabilityMarketIndex].precisionExp;
	}
}

export class SerializableLiquidateBorrowForPerpPnlRecord
	implements LiquidateBorrowForPerpPnlRecord
{
	@autoserializeUsing(BNSerializeAndDeserializeFns) marketOraclePrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) pnlTransfer: BN;
	@autoserializeAs(Number) liabilityMarketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) liabilityPrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) liabilityTransfer: BN;
	@autoserializeAs(Number) perpMarketIndex: number;
}

@inheritSerialization(SerializableLiquidateBorrowForPerpPnlRecord)
export class UISerializableLiquidateBorrowForPerpPnlRecord extends SerializableLiquidateBorrowForPerpPnlRecord {
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	marketOraclePrice: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	pnlTransfer: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	liabilityPrice: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	liabilityTransfer: BigNum;

	static onDeserialized(
		data: JsonObject,
		instance: UISerializableLiquidateBorrowForPerpPnlRecord
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		instance.liabilityTransfer.precision =
			Config.spotMarketsLookup[instance.liabilityMarketIndex].precisionExp;
	}
}

export class SerializableLiquidatePerpPnlForDepositRecord
	implements LiquidatePerpPnlForDepositRecord
{
	@autoserializeUsing(BNSerializeAndDeserializeFns) marketOraclePrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) pnlTransfer: BN;
	@autoserializeAs(Number) assetMarketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) assetPrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) assetTransfer: BN;
	@autoserializeAs(Number) perpMarketIndex: number;
}

@inheritSerialization(SerializableLiquidatePerpPnlForDepositRecord)
export class UISerializableLiquidatePerpPnlForDepositRecord extends SerializableLiquidatePerpPnlForDepositRecord {
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	marketOraclePrice: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	pnlTransfer: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	assetPrice: BigNum;
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	assetTransfer: BigNum;

	static onDeserialized(
		data: JsonObject,
		instance: UISerializableLiquidatePerpPnlForDepositRecord
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		instance.assetTransfer.precision =
			Config.spotMarketsLookup[instance.assetMarketIndex].precisionExp;
	}
}

export type LiquidationRecordEvent = Event<LiquidationRecord>;

export class SerializablePerpBankrupcyRecord implements PerpBankruptcyRecord {
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) pnl: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeFundingRateDelta: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ifPayment: BN;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	clawbackUser: PublicKey;
	@autoserializeUsing(BNSerializeAndDeserializeFns) clawbackUserPayment: BN;
}

export class UISerializablePerpBankrupcyRecord extends SerializablePerpBankrupcyRecord {
	//@ts-ignore
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns) pnl: BigNum;
	@autoserializeUsing(FundingRateBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeFundingRateDelta: BigNum;
	//@ts-ignore
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns) ifPayment: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	clawbackUserPayment: BN;
}

export class SerializableSpotBankruptcyRecord implements SpotBankruptcyRecord {
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) borrowAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeDepositInterestDelta: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ifPayment: BN;
}

export class UISerializableSpotBankruptcyRecord extends SerializableSpotBankruptcyRecord {
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	borrowAmount: BigNum;
	@autoserializeUsing(BankCumulativeInterestBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeDepositInterestDelta: BigNum;

	//@ts-ignore
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns) ifPayment: BigNum;

	static onDeserialized(
		data: JsonObject,
		instance: UISerializableSpotBankruptcyRecord
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		instance.ifPayment.precision =
			Config.spotMarketsLookup[instance.marketIndex].precisionExp;
	}
}

export class SerializableLiquidationRecord implements LiquidationRecordEvent {
	@autoserializeAs(Number) liquidationId: number;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	liquidator: PublicKey;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalCollateral: BN;
	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	liquidationType: LiquidationType;
	@autoserializeUsing(BNSerializeAndDeserializeFns) marginRequirement: BN;
	@autoserializeAs(SerializableLiquidatePerpRecord)
	liquidatePerp: LiquidatePerpRecord;
	@autoserializeAs(SerializableLiquidateSpotRecord)
	liquidateSpot: LiquidateSpotRecord;
	@autoserializeAs(SerializableLiquidateBorrowForPerpPnlRecord)
	liquidateBorrowForPerpPnl: LiquidateBorrowForPerpPnlRecord;
	@autoserializeAs(SerializableLiquidatePerpPnlForDepositRecord)
	liquidatePerpPnlForDeposit: LiquidatePerpPnlForDepositRecord;
	@autoserializeAs(SerializablePerpBankrupcyRecord)
	perpBankruptcy: PerpBankruptcyRecord;
	@autoserializeAs(SerializableSpotBankruptcyRecord)
	spotBankruptcy: SpotBankruptcyRecord;
	@autoserializeUsing(BNArraySerializeAndDeserializeFns) canceledOrderIds: BN[];
	@autoserializeUsing(BNSerializeAndDeserializeFns) marginFreed: BN;
	@autoserializeAs(Boolean) bankrupt: boolean;
}

@inheritSerialization(SerializableLiquidationRecord)
export class UISerializableLiquidationRecord extends SerializableLiquidationRecord {
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	marginRequirement: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalCollateral: BigNum;
	@autoserializeAs(UISerializableLiquidatePerpRecord)
	//@ts-ignore
	liquidatePerp: UISerializableLiquidatePerpRecord;
	@autoserializeAs(UISerializableLiquidateSpotRecord)
	//@ts-ignore
	liquidateSpot: UISerializableLiquidateSpotRecord;
	@autoserializeAs(UISerializableLiquidateBorrowForPerpPnlRecord)
	//@ts-ignore
	liquidateBorrowForPerpPnl: UISerializableLiquidateBorrowForPerpPnlRecord;
	@autoserializeAs(UISerializableLiquidatePerpPnlForDepositRecord)
	//@ts-ignore
	liquidatePerpPnlForDeposit: UISerializableLiquidatePerpPnlForDepositRecord;
}

class SerializableUserPerpPositionSnapshot implements UserPerpPositionSnapshot {
	@autoserializeUsing(BNSerializeAndDeserializeFns) lpShares: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) quoteAssetAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseAssetAmount: BN;
	@autoserializeAs(Number) marketIndex: number;
}

class SerializableUserSpotPositionSnapshot implements UserSpotPositionSnapshot {
	@autoserializeUsing(BNSerializeAndDeserializeFns) tokenValue: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) tokenAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) cumulativeDeposits: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) balanceInterestDelta: BN;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) type: SpotBalanceType;
}

export class SerializableUserSnapshotRecord implements UserSnapshotRecord {
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) programId: PublicKey;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) authority: PublicKey;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeAs(Number) epochTs: number;
	@autoserializeAs(Number) ts: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) perpPositionUpnl: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalAccountValue: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeDepositQuoteValue: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeWithdrawalQuoteValue: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeSettledPerpPnl: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeReferralReward: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeReferralVolume: BN;
	@autoserializeAs(Number) cumulativeReferralCount: number;
}

@inheritSerialization(SerializableUserSnapshotRecord)
export class UISerializableUserSnapshotRecord extends SerializableUserSnapshotRecord {
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	perpPositionUpnl: BigNum;
	//@ts-ignore
	totalAccountValue: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeDepositQuoteValue: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeWithdrawalQuoteValue: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeSettledPerpPnl: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeReferralReward: BigNum;
	@autoserializeUsing(ReferralVolumeBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeReferralVolume: BigNum;

	@autoserializeAs(Number) cumulativeReferralCount: number;
}

export class SerializableCandle {
	@autoserializeUsing(BNSerializeAndDeserializeFns) fillOpen: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fillClose: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fillHigh: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fillLow: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) oracleOpen: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) oracleClose: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) oracleHigh: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) oracleLow: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) quoteVolume: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) baseVolume: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) start: BN;
	@autoserializeAs(String) resolution: CandleResolution;
}

@inheritSerialization(SerializableCandle)
export class UISerializableCandle extends SerializableCandle {
	@autoserializeUsing(BNSerializeAndDeserializeFns) start: BN;
	//@ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) fillOpen: BigNum;
	//@ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) fillClose: BigNum;
	//@ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) fillHigh: BigNum;
	//@ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) fillLow: BigNum;
	//@ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) oracleOpen: BigNum;
	//@ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	oracleClose: BigNum;
	//@ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) oracleHigh: BigNum;
	//@ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) oracleLow: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	quoteVolume: BigNum;
	//@ts-ignore
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns) baseVolume: BigNum;
	//@ts-ignore
	@autoserializeAs(String) resolution: CandleResolution;
}

export class SerializableRollingPnlData implements RollingPnlData {
	@autoserializeUsing(BNSerializeAndDeserializeFns) spotPnlQuote: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) spotPnlPct: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) perpPnlQuote: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) perpPnlPct: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalPnlQuote: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalPnlPct: BN;
}

export class SerializableAllTimePnlData extends SerializableRollingPnlData {
	@autoserializeAs(Number) epochTs: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) spotPnlQuote: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) spotPnlPct: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) perpPnlQuote: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) perpPnlPct: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalPnlQuote: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalPnlPct: BN;
}

export class UISerializableRollingPnlData extends SerializableRollingPnlData {
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	spotPnlQuote: BigNum;

	@autoserializeUsing(PctBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	spotPnlPct: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	perpPnlQuote: BigNum;

	@autoserializeUsing(PctBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	perpPnlPct: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalPnlQuote: BigNum;

	@autoserializeUsing(PctBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalPnlPct: BigNum;
}

export class UISerializableAllTimePnlData extends UISerializableRollingPnlData {
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	spotPnlQuote: BigNum;

	@autoserializeUsing(PctBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	spotPnlPct: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	perpPnlQuote: BigNum;

	@autoserializeUsing(PctBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	perpPnlPct: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalPnlQuote: BigNum;

	@autoserializeUsing(PctBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalPnlPct: BigNum;

	@autoserializeAs(Number)
	epochTs: number;
}

export class UIMatchedOrderRecordAndAction {
	@autoserializeAs(UISerializableOrderRecord)
	orderRecord: UISerializableOrderRecord;
	@autoserializeAs(UISerializableOrderActionRecord)
	actionRecord: UISerializableOrderActionRecord;
}

class SerializablePnlDataPoint implements PnlHistoryDataPoint {
	@autoserializeAs(Number) ts: number;
	@autoserializeAs(Number) val: number;
}

class SerializableLeaderBoardResultRow implements LeaderBoardResultRow {
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	user: PublicKey;

	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	authority: PublicKey;

	@autoserializeUsing(EnumSerializeAndDeserializeFns)
	resolution: SnapshotEpochResolution;

	@autoserializeAs(Number)
	rollingValue: number;

	@autoserializeAs(Number)
	subaccountId: number;

	@autoserializeAsArray(SerializablePnlDataPoint)
	pnlHistoryPoints: SerializablePnlDataPoint[];
}

export class SerializableLeaderboardResult implements LeaderboardResult {
	@autoserializeAs(Number) lastUpdateTs: number;
	@autoserializeAs(String) ordering: PnlSnapshotOrderOption;
	@autoserializeAsArray(SerializableLeaderBoardResultRow)
	results: SerializableLeaderBoardResultRow[];
}

@inheritSerialization(SerializableLeaderBoardResultRow)
class UISerializableLeaderBoardResultRow extends SerializableLeaderBoardResultRow {}

@inheritSerialization(SerializableLeaderboardResult)
export class UISerializableLeaderboardResult extends SerializableLeaderboardResult {
	@autoserializeAsArray(UISerializableLeaderBoardResultRow)
	//@ts-ignore
	results: UISerializableLeaderBoardResultRow[];
}

export class SerializableNewUserRecord implements NewUserRecord {
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	userAuthority: PublicKey;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeAs(Number) userId: number;
	@autoserializeAsArray(Number) name: number[];
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) referrer: PublicKey;
	@autoserializeAs(Number) subAccountId: number;
}

export class SerializableAccountSnapshot implements AccountSnapshot {
	@autoserializeUsing(BNSerializeAndDeserializeFns) authority: PublicKey;
	@autoserializeUsing(BNSerializeAndDeserializeFns) user: PublicKey;
	@autoserializeAs(Number) epochTs: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	totalAccountValue: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeDepositQuoteValue: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeWithdrawalQuoteValue: BN;

	@autoserializeUsing(BNSerializeAndDeserializeFns)
	allTimeTotalPnlPct: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	allTimeTotalPnl: BN;

	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeReferralReward: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeReferralVolume: BN;
	@autoserializeAs(Number) cumulativeReferralCount: number;

	@autoserializeUsing(BNSerializeAndDeserializeFns)
	cumulativeSettledPerpPnl: BN;
}

export class UISerializableAccountSnapshot implements UIAccountSnapshot {
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) authority: PublicKey;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeAs(Number) epochTs: number;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalAccountValue: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeDepositQuoteValue: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeWithdrawalQuoteValue: BigNum;

	@autoserializeUsing(PctBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	allTimeTotalPnlPct: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	allTimeTotalPnl: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeReferralReward: BigNum;
	@autoserializeUsing(ReferralVolumeBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeReferralVolume: BigNum;
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	cumulativeSettledPerpPnl: BigNum;

	@autoserializeAs(Number) cumulativeReferralCount: number;
}

export class SerializableDlobOrder {
	@autoserializeAs(String) user: string;
	@autoserializeAs(UISerializableOrder) order: UISerializableOrder;
}

export class SerializableDlobOracleInfo {
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns) price: BigNum;
	@autoserializeUsing(BNSerializeAndDeserializeFns) slot: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) confidence: BN;
	@autoserializeAs(Boolean) hasSufficientNumberOfDataPoints: boolean;
	@autoserializeUsing(BNSerializeAndDeserializeFns) twap: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) twapConfidence: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) maxPrice?: BN;
}

export class SerializableDLOBState {
	@autoserializeAs(Number) slot: number;
	@autoserializeAsArray(SerializableDlobOracleInfo)
	oracles: SerializableDlobOracleInfo[];
	@autoserializeAsArray(SerializableDlobOrder) orders: SerializableDlobOrder[];
}

export class CompetitionResultEntry {
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) wallet: PublicKey;
	@autoserializeAs(Number) value: number;
	@autoserializeAs(Number) rank: number;
	@autoserializeAsJson() metadata?: any;
}

export class CompetitionResult {
	@autoserializeAs(String) competitionName: string;
	@autoserializeAs(String) lastUpdate: string;
	@autoserializeAs(Number) lastUpdateTs: number;
	@autoserializeAs(Number) startTs: number;
	@autoserializeAs(Number) endTs: number;
	@autoserializeAsArray(CompetitionResultEntry)
	results: CompetitionResultEntry[];
	@autoserializeAs(CompetitionResultEntry)
	requestedAuthorityResult?: CompetitionResultEntry;
}

export type InsuranceFundRecordEvent = Event<InsuranceFundRecord>;

export class SerializableInsuranceFundRecord
	implements InsuranceFundRecordEvent
{
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeAs(Number) spotMarketIndex: number;
	@autoserializeAs(Number) perpMarketIndex: number;
	@autoserializeAs(Number) userIfFactor: number;
	@autoserializeAs(Number) totalIfFactor: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) vaultAmountBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	insuranceVaultAmountBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalIfSharesBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalIfSharesAfter: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) amount: BN;
}

@inheritSerialization(SerializableInsuranceFundRecord)
export class UISerializableInsuranceFundRecord extends SerializableInsuranceFundRecord {
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	vaultAmountBefore: BigNum;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	insuranceVaultAmountBefore: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalIfSharesBefore: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalIfSharesAfter: BigNum;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	amount: BigNum;

	static onDeserialized(
		_data: JsonObject,
		instance: UISerializableInsuranceFundRecord
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		try {
			const precisionToUse =
				Config.spotMarketsLookup[instance.spotMarketIndex].precisionExp;

			instance.vaultAmountBefore.precision = precisionToUse;
			instance.insuranceVaultAmountBefore.precision = precisionToUse;
			instance.amount.precision = precisionToUse;
		} catch (e) {
			//console.error('Error in insurance fund serializer', e);
		}
	}
}

export type InsuranceFundStakeRecordEvent = Event<InsuranceFundStakeRecord>;

export class SerializableInsuranceFundStakeRecord
	implements InsuranceFundStakeRecordEvent
{
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	userAuthority: PublicKey;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) action: StakeAction;
	@autoserializeUsing(BNSerializeAndDeserializeFns) amount: BN;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	insuranceVaultAmountBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	ifSharesBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) userIfSharesBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalIfSharesBefore: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ifSharesAfter: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) userIfSharesAfter: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) totalIfSharesAfter: BN;
}

@inheritSerialization(SerializableInsuranceFundStakeRecord)
export class UISerializableInsuranceFundStakeRecord extends SerializableInsuranceFundStakeRecord {
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	amount: BigNum;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	insuranceVaultAmountBefore: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	ifSharesBefore: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	userIfSharesBefore: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalIfSharesBefore: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	ifSharesAfter: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	userIfSharesAfter: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	totalIfSharesAfter: BigNum;

	static onDeserialized(
		_data: JsonObject,
		instance: UISerializableInsuranceFundStakeRecord
	) {
		assert(Config.initialized, 'Common Config Not Initialised');
		try {
			const precisionToUse =
				Config.spotMarketsLookup[instance.marketIndex].precisionExp;

			instance.amount.precision = precisionToUse;
			instance.insuranceVaultAmountBefore.precision = precisionToUse;
		} catch (e) {
			//console.error('Error in insurance fund stake serializer', e);
		}
	}
}

export type LPRecordEvent = Event<LPRecord>;

export class SerializableLPRecord implements LPRecordEvent {
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns)
	user: PublicKey;
	@autoserializeUsing(EnumSerializeAndDeserializeFns) action: LPAction;
	@autoserializeUsing(BNSerializeAndDeserializeFns) nShares: BN;
	@autoserializeAs(Number) marketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	deltaBaseAssetAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns)
	deltaQuoteAssetAmount: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) pnl: BN;
}

@inheritSerialization(SerializableLPRecord)
export class UISerializableLPRecord extends SerializableLPRecord {
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	nShares: BigNum;

	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	deltaBaseAssetAmount: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	deltaQuoteAssetAmount: BigNum;

	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns)
	//@ts-ignore
	pnl: BigNum;
}

// Swap Record
export type SwapRecordEvent = Event<SwapRecord>;

export class SerializableSwapRecord implements SwapRecordEvent {
	@autoserializeAs(Number) id: number;
	@autoserializeAs(String) txSig: string;
	@autoserializeAs(Number) txSigIndex: number;
	@autoserializeAs(Number) slot: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) ts: BN;
	@autoserializeUsing(PublicKeySerializeAndDeserializeFns) user: PublicKey;
	@autoserializeUsing(BNSerializeAndDeserializeFns) amountOut: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) amountIn: BN;
	@autoserializeAs(Number) outMarketIndex: number;
	@autoserializeAs(Number) inMarketIndex: number;
	@autoserializeUsing(BNSerializeAndDeserializeFns) outOraclePrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) inOraclePrice: BN;
	@autoserializeUsing(BNSerializeAndDeserializeFns) fee: BN;
}

@inheritSerialization(SerializableSwapRecord)
export class UISerializableSwapRecord extends SerializableSwapRecord {
	// @ts-ignore
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns) amountOut: BigNum;
	// @ts-ignore
	@autoserializeUsing(QuoteBigNumSerializeAndDeserializeFns) amountIn: BigNum;
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	// @ts-ignore
	outOraclePrice: BigNum;
	// @ts-ignore
	@autoserializeUsing(PriceBigNumSerializeAndDeserializeFns)
	// @ts-ignore
	inOraclePrice: BigNum;
	// @ts-ignore
	@autoserializeUsing(BaseBigNumSerializeAndDeserializeFns) fee: BigNum;

	static onDeserialized(_data: JsonObject, instance: UISerializableSwapRecord) {
		assert(Config.initialized, 'Common Config Not Initialised');
		try {
			const outPrecision =
				Config.spotMarketsLookup[instance.outMarketIndex].precisionExp;
			const inPrecision =
				Config.spotMarketsLookup[instance.inMarketIndex].precisionExp;

			instance.amountIn.precision = inPrecision;
			instance.amountOut.precision = outPrecision;
			instance.inOraclePrice.precision = inPrecision;
			instance.outOraclePrice.precision = outPrecision;
			instance.fee.precision = outPrecision;
		} catch (e) {
			console.error('Error in swap serializer', e);
		}
	}
}

// Serializer
export const Serializer = {
	Serialize: {
		Order: (cls: any) => Serialize(cls, SerializableOrder),
		OrderRecord: (cls: any) => Serialize(cls, SerializableOrderRecord),
		Deposit: (cls: any) => Serialize(cls, SerializableDepositRecord),
		UIDeposit: (cls: any) => Serialize(cls, UISerializableDepositRecord),
		FundingRate: (cls: any) => Serialize(cls, SerializableFundingRateRecord),
		UIFundingRate: (cls: any) =>
			Serialize(cls, UISerializableFundingRateRecord),
		FundingPayment: (cls: any) =>
			Serialize(cls, SerializableFundingPaymentRecord),
		UIFundingPayment: (cls: any) =>
			Serialize(cls, UISerializableFundingPaymentRecord),
		Liquidation: (cls: any) => Serialize(cls, SerializableLiquidationRecord),
		UILiquidation: (cls: any) =>
			Serialize(cls, UISerializableLiquidationRecord),
		SettlePnl: (cls: any) => Serialize(cls, SerializableSettlePnlRecord),
		UISettlePnl: (cls: any) => Serialize(cls, UISerializableSettlePnlRecord),
		UIOrderRecord: (cls: any) => Serialize(cls, UISerializableOrderRecord),
		UIOrderRecordV2: (cls: any) => Serialize(cls, UISerializableOrderRecordV2),
		UIOrderActionRecordV2: (cls: any) =>
			Serialize(cls, UISerializableOrderActionRecordV2),
		SpotInterestRecord: (cls: any) =>
			Serialize(cls, SerializableSpotInterestRecord),
		CurveRecord: (cls: any) => Serialize(cls, SerializableCurveRecord),
		Candle: (cls: any) => Serialize(cls, SerializableCandle),
		UICandle: (cls: any) => Serialize(cls, UISerializableCandle),
		UIOrderActionRecord: (cls: any) =>
			Serialize(cls, UISerializableOrderActionRecord),
		UIMatchedOrderAction: (cls: any) =>
			Serialize(cls, UIMatchedOrderRecordAndAction),
		OrderActionRecord: (cls: any) =>
			Serialize(cls, SerializableOrderActionRecord),
		UserSnapshot: (cls: any) => Serialize(cls, SerializableUserSnapshotRecord),
		UIUserSnapshot: (cls: any) =>
			Serialize(cls, UISerializableUserSnapshotRecord),
		UserSnapshotPerpPositions: (cls: any) =>
			Serialize(cls, SerializableUserPerpPositionSnapshot),
		UserSnapshotSpotPositions: (cls: any) =>
			Serialize(cls, SerializableUserSpotPositionSnapshot),
		LeaderboardResult: (cls: any) =>
			Serialize(cls, SerializableLeaderboardResult),
		AccountSnapshotHistory: (cls: any) =>
			Serialize(cls, SerializableAccountSnapshot),
		NewUser: (cls: any) => Serialize(cls, SerializableNewUserRecord),
		DLOBState: (cls: any) => Serialize(cls, SerializableDLOBState),
		CompetitionResult: (cls: any) => Serialize(cls, CompetitionResult),
		CompetitionResultEntry: (cls: any) =>
			Serialize(cls, CompetitionResultEntry),
		InsuranceFundRecord: (cls: any) =>
			Serialize(cls, SerializableInsuranceFundRecord),
		UIInsuranceFundRecord: (cls: any) =>
			Serialize(cls, UISerializableInsuranceFundRecord),
		InsuranceFundStakeRecord: (cls: any) =>
			Serialize(cls, SerializableInsuranceFundStakeRecord),
		UIInsuranceFundStakeRecord: (cls: any) =>
			Serialize(cls, UISerializableInsuranceFundStakeRecord),
		AllTimePnlData: (cls: any) => Serialize(cls, SerializableAllTimePnlData),
		UIAllTimePnlData: (cls: any) =>
			Serialize(cls, UISerializableAllTimePnlData),
		LPRecord: (cls: any) => Serialize(cls, SerializableLPRecord),
		UILPRecord: (cls: any) => Serialize(cls, UISerializableLPRecord),
		SwapRecord: (cls: any) => Serialize(cls, SerializableSwapRecord),
		UISwapRecord: (cls: any) => Serialize(cls, UISerializableSwapRecord),
	},
	Deserialize: {
		Order: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableOrder) as Order,
		OrderRecord: (cls: Record<string, unknown>) =>
			// @ts-ignore
			Deserialize(
				cls as JsonObject,
				SerializableOrderRecord
			) as OrderRecordEvent,
		UIOrder: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				UISerializableOrder
			) as UISerializableOrder,
		UIOrderRecord: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				UISerializableOrderRecord
			) as UISerializableOrderRecord,
		UIOrderRecordV2: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				UISerializableOrderRecordV2
			) as UISerializableOrderRecordV2,
		UIOrderActionRecordV2: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				UISerializableOrderActionRecordV2
			) as UISerializableOrderActionRecordV2,
		Deposit: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				SerializableDepositRecord
			) as DepositRecordEvent,
		UIDeposit: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableDepositRecord),
		FundingRate: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				SerializableFundingRateRecord
			) as FundingRateRecordEvent,
		UIFundingRate: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableFundingRateRecord),
		FundingPayment: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				SerializableFundingPaymentRecord
			) as FundingPaymentRecordEvent,
		UIFundingPayment: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableFundingPaymentRecord),
		Liquidation: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				SerializableLiquidationRecord
			) as LiquidationRecordEvent,
		UILiquidation: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableLiquidationRecord),
		SettlePnl: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				SerializableSettlePnlRecord
			) as SettlePnlRecordEvent,
		SpotInterest: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				SerializableSpotInterestRecord
			) as SpotInterestRecordEvent,
		CurveRecord: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				SerializableCurveRecord
			) as SerializableCurveRecord,
		UISettlePnl: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableSettlePnlRecord),
		Candle: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableCandle),
		UICandle: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableCandle),
		OrderActionRecord: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableOrderActionRecord),
		UIOrderActionRecord: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableOrderActionRecord),
		UIMatchedOrderAction: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UIMatchedOrderRecordAndAction),
		UserSnapshot: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableUserSnapshotRecord),
		UIUserSnapshot: (cls: Record<string, unknown>) =>
			// @ts-ignore
			Deserialize(cls as JsonObject, UISerializableUserSnapshotRecord),
		UserSnapshotPerpPositions: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableUserPerpPositionSnapshot),
		UserSnapshotSpotPositions: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableUserSpotPositionSnapshot),
		LeaderboardResult: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableLeaderboardResult),
		UISerializableLeaderboardResult: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableLeaderboardResult),
		UIAccountSnapshotHistory: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableAccountSnapshot),
		NewUser: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableNewUserRecord),
		DLOBState: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableDLOBState),
		CompetitionResult: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, CompetitionResult),
		CompetitionResultEntry: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, CompetitionResultEntry),
		InsuranceFundRecord: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				SerializableInsuranceFundRecord
			) as InsuranceFundRecordEvent,
		UIInsuranceFundRecord: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableInsuranceFundRecord),
		InsuranceFundStakeRecord: (cls: Record<string, unknown>) =>
			Deserialize(
				cls as JsonObject,
				SerializableInsuranceFundStakeRecord
			) as InsuranceFundStakeRecordEvent,
		UIInsuranceFundStakeRecord: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableInsuranceFundStakeRecord),
		AllTimePnlData: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableAllTimePnlData),
		UIAllTimePnlData: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableAllTimePnlData),
		LPRecord: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableLPRecord) as LPRecordEvent,
		UILPRecord: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableLPRecord),
		SwapRecord: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, SerializableSwapRecord) as SwapRecordEvent,
		UISwapRecord: (cls: Record<string, unknown>) =>
			Deserialize(cls as JsonObject, UISerializableSwapRecord),
	},
	setDeserializeFromSnakeCase: () => {
		SetDeserializeKeyTransform(SnakeCase);
	},
	setSerializeFromSnakeCase: () => {
		SetSerializeKeyTransform(SnakeCase);
	},
};
