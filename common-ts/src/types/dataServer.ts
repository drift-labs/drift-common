// Type for the trades returned by the data API
export type JsonTrade = {
	action: string;
	actionExplanation: string;
	baseAssetAmountFilled: number;
	bitFlags: number;
	createdAt: number;
	entity: string;
	fillRecordId: string;
	filler: string;
	fillerReward: number;
	maker: string;
	makerFee: number;
	makerOrderBaseAssetAmount: number;
	makerOrderCumulativeBaseAssetAmountFilled: number;
	makerOrderCumulativeQuoteAssetAmountFilled: number;
	makerOrderDirection: string;
	makerOrderId: number;
	makerRebate: number;
	marketFilter: string;
	marketIndex: number;
	marketType: string;
	oraclePrice: number;
	price: number;
	quoteAssetAmountFilled: number;
	quoteAssetAmountSurplus: number;
	referrerReward: number;
	slot: number;
	spotFulfillmentMethodFee: number;
	symbol: string;
	taker: string;
	takerFee: number;
	takerOrderBaseAssetAmount: number;
	takerOrderCumulativeBaseAssetAmountFilled: number;
	takerOrderCumulativeQuoteAssetAmountFilled: number;
	takerOrderDirection: string;
	takerOrderId: number;
	ts: number;
	txSig: string;
	txSigIndex: number;
};

// Type for the candles returned by the data API
export type JsonCandle = {
	ts: number;
	fillOpen: number;
	fillHigh: number;
	fillClose: number;
	fillLow: number;
	oracleOpen: number;
	oracleHigh: number;
	oracleClose: number;
	oracleLow: number;
	quoteVolume: number;
	baseVolume: number;
};
