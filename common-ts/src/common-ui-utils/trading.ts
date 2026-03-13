import {
	AMM_RESERVE_PRECISION,
	BN,
	BigNum,
	DriftClient,
	MARGIN_PRECISION,
	MAX_LEVERAGE_ORDER_SIZE,
	ONE,
	PRICE_PRECISION,
	PRICE_PRECISION_EXP,
	PerpMarketAccount,
	PositionDirection,
	QUOTE_PRECISION_EXP,
	SpotMarketAccount,
	User,
	ZERO,
	isVariant,
} from '@drift-labs/sdk';
import { MarketId, UIOrderType } from 'src/types';

// const calculatePnlPctFromPosition = (
// 	pnl: BN,
// 	position: OpenPosition,
// 	marginUsed?: BN
// ): number => {
// 	if (!position?.quoteEntryAmount || position?.quoteEntryAmount.eq(ZERO))
// 		return 0;

// 	let marginUsedNum: number;

// 	if (marginUsed) {
// 		marginUsedNum = BigNum.from(marginUsed, QUOTE_PRECISION_EXP).toNum();
// 	} else {
// 		const leverage = convertMarginRatioToLeverage(position.maxMarginRatio) ?? 1;
// 		const quoteEntryAmountNum = BigNum.from(
// 			position.quoteEntryAmount.abs(),
// 			QUOTE_PRECISION_EXP
// 		).toNum();

// 		if (leverage <= 0 || quoteEntryAmountNum <= 0) {
// 			marginUsedNum = 0;
// 		} else {
// 			marginUsedNum = quoteEntryAmountNum / leverage;
// 		}
// 	}

// 	if (marginUsedNum <= 0) {
// 		return 0;
// 	}

// 	return (
// 		BigNum.from(pnl, QUOTE_PRECISION_EXP)
// 			.shift(5)
// 			.div(BigNum.fromPrint(`${marginUsedNum}`, QUOTE_PRECISION_EXP))
// 			.toNum() * 100
// 	);
// };

const calculatePnlPctFromPosition = (
	pnl: BN,
	quoteEntryAmount: BN,
	leverage?: number
): number => {
	if (!quoteEntryAmount || quoteEntryAmount.eq(ZERO)) return 0;

	return (
		BigNum.from(pnl, QUOTE_PRECISION_EXP)
			.shift(5)
			.div(BigNum.from(quoteEntryAmount.abs(), QUOTE_PRECISION_EXP))
			.toNum() *
		100 *
		(leverage ?? 1)
	);
};

const POTENTIAL_PROFIT_DEFAULT_STATE = {
	estimatedProfit: BigNum.zero(PRICE_PRECISION_EXP),
	estimatedProfitBeforeFees: BigNum.zero(PRICE_PRECISION_EXP),
	estimatedTakerFee: BigNum.zero(PRICE_PRECISION_EXP),
	notionalSizeAtEntry: BigNum.zero(PRICE_PRECISION_EXP),
	notionalSizeAtExit: BigNum.zero(PRICE_PRECISION_EXP),
};

const calculatePotentialProfit = (props: {
	currentPositionSize: BigNum;
	currentPositionDirection: PositionDirection;
	currentPositionEntryPrice: BigNum;
	tradeDirection: PositionDirection;
	/**
	 * Amount of position being closed in base asset size
	 */
	exitBaseSize: BigNum;
	/**
	 * Either the user's limit price (for limit orders) or the estimated exit price (for market orders)
	 */
	exitPrice: BigNum;
	takerFeeBps: number;
	slippageTolerance?: number;
	isMarketOrder?: boolean;
}): {
	estimatedProfit: BigNum;
	estimatedProfitBeforeFees: BigNum;
	estimatedTakerFee: BigNum;
	notionalSizeAtEntry: BigNum;
	notionalSizeAtExit: BigNum;
} => {
	let estimatedProfit = BigNum.zero(PRICE_PRECISION_EXP);
	let estimatedProfitBeforeFees = BigNum.zero(PRICE_PRECISION_EXP);
	let estimatedTakerFee = BigNum.zero(PRICE_PRECISION_EXP);
	let notionalSizeAtEntry = BigNum.zero(PRICE_PRECISION_EXP);
	let notionalSizeAtExit = BigNum.zero(PRICE_PRECISION_EXP);

	const isClosingLong =
		isVariant(props.currentPositionDirection, 'long') &&
		isVariant(props.tradeDirection, 'short');
	const isClosingShort =
		isVariant(props.currentPositionDirection, 'short') &&
		isVariant(props.tradeDirection, 'long');

	if (!isClosingLong && !isClosingShort) return POTENTIAL_PROFIT_DEFAULT_STATE;
	if (!props.exitBaseSize) return POTENTIAL_PROFIT_DEFAULT_STATE;

	if (
		props.exitBaseSize.eqZero() ||
		props.currentPositionSize.lt(props.exitBaseSize)
	) {
		return POTENTIAL_PROFIT_DEFAULT_STATE;
	}

	const baseSizeBeingClosed = props.exitBaseSize.lte(props.currentPositionSize)
		? props.exitBaseSize
		: props.currentPositionSize;

	// Notional size of amount being closed at entry and exit
	notionalSizeAtEntry = baseSizeBeingClosed.mul(
		props.currentPositionEntryPrice.shiftTo(baseSizeBeingClosed.precision)
	);
	notionalSizeAtExit = baseSizeBeingClosed.mul(
		props.exitPrice.shiftTo(baseSizeBeingClosed.precision)
	);

	if (isClosingLong) {
		estimatedProfitBeforeFees = notionalSizeAtExit.sub(notionalSizeAtEntry);
	} else if (isClosingShort) {
		estimatedProfitBeforeFees = notionalSizeAtEntry.sub(notionalSizeAtExit);
	}

	// subtract takerFee if applicable
	if (props.takerFeeBps > 0) {
		const takerFeeDenominator = Math.floor(100 / (props.takerFeeBps * 0.01));
		estimatedTakerFee = notionalSizeAtExit.scale(1, takerFeeDenominator);
		estimatedProfit = estimatedProfitBeforeFees.sub(
			estimatedTakerFee.shiftTo(estimatedProfitBeforeFees.precision)
		);
	} else {
		estimatedProfit = estimatedProfitBeforeFees;
	}

	return {
		estimatedProfit,
		estimatedProfitBeforeFees,
		estimatedTakerFee,
		notionalSizeAtEntry,
		notionalSizeAtExit,
	};
};

/**
 * Check if the order type is a market order or oracle market order
 */
const checkIsMarketOrderType = (orderType: UIOrderType) => {
	return orderType === 'market' || orderType === 'oracle';
};

/**
 * Calculate the liquidation price of a position after a trade. Requires DriftClient to be subscribed.
 * If the order type is limit order, a limit price must be provided.
 */
const calculateLiquidationPriceAfterPerpTrade = ({
	estEntryPrice,
	orderType,
	perpMarketIndex,
	tradeBaseSize,
	isLong,
	userClient,
	oraclePrice,
	limitPrice,
	offsetCollateral,
	precision = 2,
	isEnteringHighLeverageMode,
	capLiqPrice,
	marginType,
}: {
	estEntryPrice: BN;
	orderType: UIOrderType;
	perpMarketIndex: number;
	tradeBaseSize: BN;
	isLong: boolean;
	userClient: User;
	oraclePrice: BN;
	limitPrice?: BN;
	offsetCollateral?: BN;
	precision?: number;
	isEnteringHighLeverageMode?: boolean;
	capLiqPrice?: boolean;
	marginType?: 'Cross' | 'Isolated';
}) => {
	const ALLOWED_ORDER_TYPES: UIOrderType[] = [
		'limit',
		'market',
		'oracle',
		'stopMarket',
		'stopLimit',
		'oracleLimit',
	];

	if (!ALLOWED_ORDER_TYPES.includes(orderType)) {
		console.error(
			'Invalid order type for perp trade liquidation price calculation',
			orderType
		);
		return 0;
	}

	if (orderType === 'limit' && !limitPrice) {
		console.error(
			'Limit order must have a limit price for perp trade liquidation price calculation'
		);
		return 0;
	}

	const signedBaseSize = isLong ? tradeBaseSize : tradeBaseSize.neg();
	const priceToUse = [
		'limit',
		'stopMarket',
		'stopLimit',
		'oracleLimit',
	].includes(orderType)
		? limitPrice
		: estEntryPrice;

	const liqPriceBn = userClient.liquidationPrice(
		perpMarketIndex,
		signedBaseSize,
		priceToUse,
		undefined,
		undefined, // we can exclude open orders since open orders will be cancelled first (which results in reducing account leverage) before actual liquidation
		offsetCollateral,
		isEnteringHighLeverageMode,
		marginType === 'Isolated' ? 'Isolated' : undefined
	);

	if (liqPriceBn.isNeg()) {
		// means no liquidation price
		return 0;
	}

	// Check if user has a spot position using the same oracle as the perp market
	// If so, force capLiqPrice to be false to avoid incorrect price capping
	// Technically in this case, liq price could be lower for a short or higher for a long
	const perpMarketOracle =
		userClient.driftClient.getPerpMarketAccount(perpMarketIndex)?.amm?.oracle;

	const spotMarketWithSameOracle = userClient.driftClient
		.getSpotMarketAccounts()
		.find((market) => market.oracle.equals(perpMarketOracle));

	let hasSpotPositionWithSameOracle = false;
	if (spotMarketWithSameOracle) {
		const spotPosition = userClient.getSpotPosition(
			spotMarketWithSameOracle.marketIndex
		);
		hasSpotPositionWithSameOracle = !!spotPosition;
	}

	const effectiveCapLiqPrice = hasSpotPositionWithSameOracle
		? false
		: capLiqPrice;

	const cappedLiqPriceBn = effectiveCapLiqPrice
		? isLong
			? BN.min(liqPriceBn, oraclePrice)
			: BN.max(liqPriceBn, oraclePrice)
		: liqPriceBn;

	const liqPriceBigNum = BigNum.from(cappedLiqPriceBn, PRICE_PRECISION_EXP);

	const liqPriceNum =
		Math.round(liqPriceBigNum.toNum() * 10 ** precision) / 10 ** precision;

	return liqPriceNum;
};

const convertLeverageToMarginRatio = (leverage: number): number | undefined => {
	if (!leverage) return undefined;
	return Math.round((1 / leverage) * MARGIN_PRECISION.toNumber());
};

const convertMarginRatioToLeverage = (
	marginRatio: number,
	decimals?: number
): number | undefined => {
	if (!marginRatio) return undefined;

	const leverage = 1 / (marginRatio / MARGIN_PRECISION.toNumber());

	return decimals
		? parseFloat(leverage.toFixed(decimals))
		: Math.round(leverage);
};

const getMarketTickSize = (
	driftClient: DriftClient,
	marketId: MarketId
): BN => {
	const marketAccount = marketId.isPerp
		? driftClient.getPerpMarketAccount(marketId.marketIndex)
		: driftClient.getSpotMarketAccount(marketId.marketIndex);
	if (!marketAccount) return ZERO;

	if (marketId.isPerp) {
		return (marketAccount as PerpMarketAccount).amm.orderTickSize;
	} else {
		return (marketAccount as SpotMarketAccount).orderTickSize;
	}
};

const getMarketTickSizeDecimals = (
	driftClient: DriftClient,
	marketId: MarketId
) => {
	const tickSize = getMarketTickSize(driftClient, marketId);

	const decimalPlaces = Math.max(
		0,
		Math.floor(
			Math.log10(
				PRICE_PRECISION.div(tickSize.eq(ZERO) ? ONE : tickSize).toNumber()
			)
		)
	);

	return decimalPlaces;
};

const getMarketStepSize = (driftClient: DriftClient, marketId: MarketId) => {
	const marketAccount = marketId.isPerp
		? driftClient.getPerpMarketAccount(marketId.marketIndex)
		: driftClient.getSpotMarketAccount(marketId.marketIndex);
	if (!marketAccount) return ZERO;

	if (marketId.isPerp) {
		return (marketAccount as PerpMarketAccount).amm.orderStepSize;
	} else {
		return (marketAccount as SpotMarketAccount).orderStepSize;
	}
};

const getMarketStepSizeDecimals = (
	driftClient: DriftClient,
	marketId: MarketId
) => {
	const stepSize = getMarketStepSize(driftClient, marketId);

	const decimalPlaces = Math.max(
		0,
		Math.floor(
			Math.log10(
				AMM_RESERVE_PRECISION.div(stepSize.eq(ZERO) ? ONE : stepSize).toNumber()
			)
		)
	);

	return decimalPlaces;
};

/**
 * Checks if a given order amount represents an entire position order
 * by comparing it with MAX_LEVERAGE_ORDER_SIZE
 * @param orderAmount - The BigNum order amount to check
 * @returns true if the order is for the entire position, false otherwise
 */
export const isEntirePositionOrder = (orderAmount: BigNum): boolean => {
	const maxLeverageSize = new BigNum(
		MAX_LEVERAGE_ORDER_SIZE,
		orderAmount.precision
	);
	return Math.abs(maxLeverageSize.sub(orderAmount).toNum()) < 1;
};

/**
 * Calculate the margin used for a specific perp position
 * Returns the minimum of user's total collateral or the position's weighted value
 */
const getMarginUsedForPosition = (
	user: User,
	marketIndex: number,
	includeOpenOrders = true
): BN | undefined => {
	const perpPosition = user.getPerpPosition(marketIndex);
	if (!perpPosition) return undefined;

	const hc = user.getPerpPositionHealth({
		marginCategory: 'Initial',
		perpPosition,
		includeOpenOrders,
	});
	const userCollateral = user.getTotalCollateral();
	return userCollateral.lt(hc.weightedValue)
		? userCollateral
		: hc.weightedValue;
};

/**
 * Validate if a leverage change would exceed the user's free collateral
 * Returns true if the change is valid (doesn't exceed free collateral), false otherwise
 */
const validateLeverageChange = ({
	user,
	marketIndex,
	newLeverage,
}: {
	user: User;
	marketIndex: number;
	newLeverage: number;
}): boolean => {
	try {
		// Convert leverage to margin ratio
		const newMarginRatio = convertLeverageToMarginRatio(newLeverage);
		if (!newMarginRatio) return true;

		// Get the perp position from the user
		const perpPosition = user.getPerpPosition(marketIndex);
		if (!perpPosition) return true;

		// Get current position weighted value
		const currentPositionWeightedValue = user.getPerpPositionHealth({
			marginCategory: 'Initial',
			perpPosition,
		}).weightedValue;

		// Create a modified version of the position with new maxMarginRatio
		const modifiedPosition = {
			...perpPosition,
			maxMarginRatio: newMarginRatio,
		};

		// Calculate new weighted value with the modified position
		const newPositionWeightedValue = user.getPerpPositionHealth({
			marginCategory: 'Initial',
			perpPosition: modifiedPosition,
		}).weightedValue;

		const perpPositionWeightedValueDelta = newPositionWeightedValue.sub(
			currentPositionWeightedValue
		);

		const freeCollateral = user.getFreeCollateral();

		// Check if weighted value delta exceeds free collateral
		return perpPositionWeightedValueDelta.lte(freeCollateral);
	} catch (error) {
		console.warn('Error validating leverage change:', error);
		return true; // Allow change if validation fails
	}
};

export const TRADING_UTILS = {
	calculatePnlPctFromPosition,
	calculatePotentialProfit,
	calculateLiquidationPriceAfterPerpTrade,
	checkIsMarketOrderType,
	convertLeverageToMarginRatio,
	convertMarginRatioToLeverage,
	getMarketTickSize,
	getMarketTickSizeDecimals,
	getMarketStepSize,
	getMarketStepSizeDecimals,
	isEntirePositionOrder,
	getMarginUsedForPosition,
	validateLeverageChange,
};
