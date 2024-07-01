import {
	SpotMarketAccount,
	SpotMarkets,
	BN,
	calculateEstimatedSuperStakeLiquidationPrice,
	calculateSizeDiscountAssetWeight,
	convertToNumber,
	calculateSizePremiumLiabilityWeight,
	SPOT_MARKET_WEIGHT_PRECISION,
	BigNum,
	DriftClient,
	SpotMarketConfig,
	DriftEnv,
	NINE,
} from '@drift-labs/sdk';
import { LstMetrics } from '@drift/common';

const SOL_PRECISION_EXP = NINE;

/*
 * Returns current liquidation ratio at given LST / sol balances
 */
const useSuperstakeEstimatedLiquidationRatio = ({
	driftEnv,
	driftClient,
	driftClientIsReady,
	lstAmount,
	lstMetrics,
	lstSpotMarket,
	solAmount,
}: {
	driftEnv?: DriftEnv;
	driftClient: DriftClient;
	driftClientIsReady?: boolean;
	lstAmount: number;
	solAmount: number;
	lstSpotMarket: SpotMarketConfig;
	lstMetrics: LstMetrics;
}) => {
	const solSpotMarket = (
		(driftEnv && SpotMarkets[driftEnv]) ||
		SpotMarkets['mainnet-beta']
	).find((market) => market.symbol === 'SOL');

	if (
		!lstMetrics.loaded ||
		!driftClient ||
		!driftClientIsReady ||
		!lstSpotMarket ||
		!solSpotMarket
	)
		return 0;

	let lstSpotMarketAccount: SpotMarketAccount | undefined,
		solSpotMarketAccount: SpotMarketAccount | undefined;
	try {
		lstSpotMarketAccount = driftClient.getSpotMarketAccount(
			lstSpotMarket.marketIndex
		);
		solSpotMarketAccount = driftClient.getSpotMarketAccount(
			solSpotMarket.marketIndex
		);
	} catch (err) {
		console.log(err);
	}

	if (!lstSpotMarketAccount || !solSpotMarketAccount) {
		return 0;
	}

	if (
		isNaN(solAmount) ||
		isNaN(lstAmount) ||
		`${lstAmount}${solAmount}`.includes('e-')
	)
		return 0;

	const lstAmountBigNum = BigNum.fromPrint(
		`${lstAmount}`,
		lstSpotMarket.precisionExp
	);
	const solAmountBigNum = BigNum.fromPrint(`${solAmount}`, SOL_PRECISION_EXP);

	const maintenanceWeight = calculateSizeDiscountAssetWeight(
		lstAmountBigNum.val,
		new BN(lstSpotMarketAccount.imfFactor),
		new BN(lstSpotMarketAccount.maintenanceAssetWeight)
	);

	const liabilityWeight = calculateSizePremiumLiabilityWeight(
		solAmountBigNum.val,
		new BN(solSpotMarketAccount.imfFactor),
		new BN(solSpotMarketAccount.maintenanceLiabilityWeight),
		SPOT_MARKET_WEIGHT_PRECISION
	);

	const projectedLiqRatio = calculateEstimatedSuperStakeLiquidationPrice(
		lstAmount,
		convertToNumber(maintenanceWeight, SPOT_MARKET_WEIGHT_PRECISION),
		solAmount,
		convertToNumber(liabilityWeight, SPOT_MARKET_WEIGHT_PRECISION),
		lstMetrics.priceInSol
	);

	return projectedLiqRatio;
};

export { useSuperstakeEstimatedLiquidationRatio };
