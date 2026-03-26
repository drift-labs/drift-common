import { BN, MARGIN_PRECISION, User } from '@drift-labs/sdk';

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

export {
	convertLeverageToMarginRatio,
	convertMarginRatioToLeverage,
	getMarginUsedForPosition,
	validateLeverageChange,
};
