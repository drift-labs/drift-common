import { DriftClient, User } from '@drift-labs/sdk';
import { TransactionInstruction } from '@solana/web3.js';
import { TRADING_UTILS } from '../../../../../common-ui-utils/trading';

/**
 * Helper function to determine if leverage needs updating and create the instruction if needed.
 * Returns the instruction to update position max leverage, or undefined if no update is needed.
 */
export async function getPositionMaxLeverageIxIfNeeded(
	driftClient: DriftClient,
	user: User,
	marketIndex: number,
	positionMaxLeverage?: number
): Promise<TransactionInstruction | undefined> {
	if (!positionMaxLeverage) {
		return undefined;
	}

	// Get current position if it exists
	const userAccount = user.getUserAccount();
	const currentPosition = userAccount.perpPositions.find(
		(pos) => pos.marketIndex === marketIndex
	);

	// Convert leverage to margin ratio
	const targetMarginRatio =
		TRADING_UTILS.convertLeverageToMarginRatio(positionMaxLeverage);

	// Check if leverage needs updating
	const currentMarginRatio = currentPosition?.maxMarginRatio || 0;

	// Only create instruction if:
	// 1. We have a target leverage to set, AND
	// 2. Either there's no position yet (currentMarginRatio === 0) OR the margin ratios differ
	if (targetMarginRatio && targetMarginRatio !== currentMarginRatio) {
		return await driftClient.getUpdateUserPerpPositionCustomMarginRatioIx(
			marketIndex,
			targetMarginRatio,
			userAccount.subAccountId
		);
	}

	return undefined;
}
