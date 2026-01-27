import {
	BN,
	DriftClient,
	User,
	calculateMarginUSDCRequiredForTrade,
	OptionalOrderParams,
	PositionDirection,
	MarketType,
	OrderType,
	ZERO,
} from '@drift-labs/sdk';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export const ISOLATED_POSITION_DEPOSIT_BUFFER_BPS = 15;

export interface IsolatedMarginShortfall {
	marketIndex: number;
	shortfall: BN;
}

/**
 * Computes the initial margin shortfall for all isolated perp positions.
 * Returns a map of marketIndex -> shortfall (in QUOTE_PRECISION).
 * Only includes positions that are under initial margin (shortfall > 0).
 */
export function getIsolatedMarginShortfalls(user: User): Map<number, BN> {
	const shortfalls = new Map<number, BN>();

	const marginCalc = user.getMarginCalculation('Initial');

	for (const [
		marketIndex,
		isolatedCalc,
	] of marginCalc.isolatedMarginCalculations) {
		const shortfall = isolatedCalc.marginShortage();
		if (shortfall.gt(ZERO)) {
			shortfalls.set(marketIndex, shortfall);
		}
	}

	return shortfalls;
}

/**
 * Computes the initial margin shortfall for a single isolated perp position.
 * Returns the shortfall in QUOTE_PRECISION, or ZERO if no shortfall.
 */
export function getIsolatedMarginShortfall(
	user: User,
	marketIndex: number
): BN {
	const marginCalc = user.getMarginCalculation('Initial');
	const isolatedCalc = marginCalc.isolatedMarginCalculations.get(marketIndex);

	if (!isolatedCalc) {
		return ZERO;
	}

	return isolatedCalc.marginShortage();
}

/**
 * Returns all isolated margin shortfalls as an array, excluding a specific market index.
 * Useful for getting shortfalls for "other" isolated positions.
 */
export function getOtherIsolatedMarginShortfalls(
	user: User,
	excludeMarketIndex?: number
): IsolatedMarginShortfall[] {
	const shortfalls = getIsolatedMarginShortfalls(user);
	const result: IsolatedMarginShortfall[] = [];

	for (const [marketIndex, shortfall] of shortfalls) {
		if (
			excludeMarketIndex !== undefined &&
			marketIndex === excludeMarketIndex
		) {
			continue;
		}
		result.push({ marketIndex, shortfall });
	}

	return result;
}

/**
 * Computes the total of all isolated margin shortfalls.
 */
export function getTotalIsolatedMarginShortfall(
	user: User,
	excludeMarketIndex?: number
): BN {
	const shortfalls = getOtherIsolatedMarginShortfalls(user, excludeMarketIndex);
	return shortfalls.reduce((acc, s) => acc.add(s.shortfall), ZERO);
}

export interface ComputeIsolatedPositionDepositParams {
	driftClient: DriftClient;
	user: User;
	marketIndex: number;
	baseAssetAmount: BN;
	/**
	 * Optional direction of the order.
	 * If provided, we will check if the order will increase the position.
	 * If the order will not increase the position, we will return 0.
	 */
	direction?: PositionDirection;
	/**
	 * Margin ratio to use for the position (e.g. 2000 for 5x leverage).
	 */
	marginRatio: number;
	/**
	 * Optional estimated entry price to use for the margin calculation.
	 */
	entryPrice?: BN;
	/**
	 * Number of open high leverage spots available to the user (if any).
	 * If greater than 0, we will consider the trade as entering high leverage mode.
	 */
	numOfOpenHighLeverageSpots?: number;
	/**
	 * Optional buffer denominator for the isolated position deposit.
	 *
	 * Smaller numbers mean a bigger buffer.
	 *
	 * bufferDenominator ->  Buffer %
	 *
	 * 15 ->                6.67%
	 *
	 * 20 (default) ->       5.00%
	 *
	 * 50 ->                2.00%
	 *
	 * 100 ->               1.00%
	 *
	 * 180 ->               0.56%
	 *
	 * 200 ->               0.50%
	 */
	bufferDenominator?: number;
	/**
	 * If true, the current market's initial margin shortfall (if any)
	 * will be added to the deposit amount.
	 */
	includeExistingShortfall?: boolean;
}

/**
 * Computes the isolated position deposit required for opening an isolated perp position.
 * Returns a BN in QUOTE_PRECISION (USDC).
 */
export function computeIsolatedPositionDepositForTrade({
	driftClient,
	user,
	marketIndex,
	baseAssetAmount,
	direction,
	marginRatio,
	entryPrice,
	numOfOpenHighLeverageSpots,
	bufferDenominator,
	includeExistingShortfall,
}: ComputeIsolatedPositionDepositParams): BN | null {
	// Only require isolated deposit if the order will increase the position (when direction is provided)
	if (direction !== undefined) {
		const maybeOrderParams: OptionalOrderParams = {
			marketIndex,
			marketType: MarketType.PERP,
			orderType: OrderType.MARKET,
			direction,
			baseAssetAmount,
		};
		const subAccountId = user.getUserAccount().subAccountId;
		const isIncreasing = driftClient.isOrderIncreasingPosition(
			maybeOrderParams,
			subAccountId
		);
		if (!isIncreasing) {
			return null;
		}
	}

	const userIsInHighLeverageMode = user.isHighLeverageMode('Initial') ?? false;
	const hasOpenHighLeverageSpots =
		numOfOpenHighLeverageSpots !== undefined && numOfOpenHighLeverageSpots > 0;
	const enteringHighLeverageMode =
		userIsInHighLeverageMode || hasOpenHighLeverageSpots;

	const marginRequired = calculateMarginUSDCRequiredForTrade(
		driftClient,
		marketIndex,
		baseAssetAmount,
		marginRatio,
		enteringHighLeverageMode,
		entryPrice
	);

	let depositAmount = marginRequired.add(
		marginRequired.div(
			new BN(bufferDenominator ?? ISOLATED_POSITION_DEPOSIT_BUFFER_BPS)
		)
	); // buffer in basis points

	// Add existing shortfall for this market if requested
	if (includeExistingShortfall) {
		const existingShortfall = getIsolatedMarginShortfall(user, marketIndex);
		if (existingShortfall.gt(ZERO)) {
			// Add shortfall with a 5% buffer on top (same as new margin)
			const shortfallWithBuffer = existingShortfall.add(
				existingShortfall.div(
					new BN(bufferDenominator ?? ISOLATED_POSITION_DEPOSIT_BUFFER_BPS)
				)
			);
			depositAmount = depositAmount.add(shortfallWithBuffer);
		}
	}

	return depositAmount;
}

export async function getIsolatedPositionDepositIxIfNeeded(
	driftClient: DriftClient,
	user: User,
	marketIndex: number,
	isolatedPositionDeposit?: BN,
	signingAuthority?: PublicKey
): Promise<TransactionInstruction | undefined> {
	if (!isolatedPositionDeposit) {
		return undefined;
	}
	if (isolatedPositionDeposit.isZero()) {
		return undefined;
	}

	return driftClient.getTransferIsolatedPerpPositionDepositIx(
		isolatedPositionDeposit,
		marketIndex,
		user.getUserAccount().subAccountId,
		undefined, // noAmountBuffer
		signingAuthority
	);
}
