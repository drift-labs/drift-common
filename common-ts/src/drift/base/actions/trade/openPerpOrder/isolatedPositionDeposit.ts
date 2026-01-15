import {
	BN,
	DriftClient,
	User,
	calculateMarginUSDCRequiredForTrade,
	OptionalOrderParams,
	PositionDirection,
	MarketType,
	OrderType,
} from '@drift-labs/sdk';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export const ISOLATED_POSITION_DEPOSIT_BUFFER_BPS = 300;

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

	return marginRequired.add(
		marginRequired.div(new BN(ISOLATED_POSITION_DEPOSIT_BUFFER_BPS))
	); // buffer in basis points
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
