import {
	BigNum,
	PERCENTAGE_PRECISION_EXP,
	SpotMarketAccount,
	SpotMarkets,
	calculateDepositRate,
	BN,
	ZERO,
	calculateInterestRate,
	DriftClient,
	DriftEnv,
	SpotMarketConfig,
	calculateSizeDiscountAssetWeight,
	calculateSizePremiumLiabilityWeight,
	SPOT_MARKET_WEIGHT_PRECISION,
	convertToNumber,
	calculateEstimatedSuperStakeLiquidationPrice,
	NINE,
	fetchMSolMetrics,
	fetchBSolMetrics,
	fetchJitoSolMetrics,
	fetchBSolDriftEmissions,
	BSOL_STATS_API_RESPONSE,
	QUOTE_PRECISION_EXP,
	calculateScaledInitialAssetWeight,
} from '@drift-labs/sdk';
import { LstMetrics, aprFromApy } from '../';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { B_SOL, JITO_SOL, M_SOL } from '../constants';

// Default value for estimated APR
const DEFAULT_VALUE = {
	solBorrowRate: 0,
	lstDepositRate: 0,
	lstApy: 0,
	leveragedBorrowRate: 0,
	leveragedDepositRate: 0,
	leveragedLstApr: 0,
	leveragedEmissionsApr: 0,
	lstNetProjectedApr: 0,
	totalNetProjectedApr: 0,
	solBorrowAmount: 0,
	projectedLiqRatio: 0,
	unleveragedApr: 0,
	loaded: false,
};

/*
 * Returns amount of SOL that will be borrowed to achieve the desired leverage on the active LST
 */
const getSuperstakeEstimatedApr = ({
	lstSpotMarket,
	lstMetrics,
	initialLstDeposit,
	lstAmount,
	solAmount,
	driftClient,
	driftClientIsReady,
	driftEnv,
	includeBorrowRateDelta = false,
}: {
	lstSpotMarket: SpotMarketConfig;
	lstAmount: number;
	initialLstDeposit: number;
	solAmount: number;
	lstMetrics: LstMetrics;
	driftClient: DriftClient;
	driftClientIsReady?: boolean;
	driftEnv?: DriftEnv;
	includeBorrowRateDelta?: boolean;
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
		return DEFAULT_VALUE;

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
		return DEFAULT_VALUE;
	}

	const lstDepositRate = BigNum.from(
		calculateDepositRate(lstSpotMarketAccount),
		PERCENTAGE_PRECISION_EXP
	);
	const solBorrowRate = BigNum.from(
		calculateInterestRate(
			solSpotMarketAccount,
			includeBorrowRateDelta
				? new BN(
						Math.min(solAmount * LAMPORTS_PER_SOL, Number.MAX_SAFE_INTEGER)
				  ).neg()
				: ZERO
		),
		PERCENTAGE_PRECISION_EXP
	);

	const superStakeLstDeposit = lstAmount;
	const solBorrowAmount = solAmount;

	if (isNaN(solBorrowAmount)) return DEFAULT_VALUE;

	const lstAprFromApy =
		aprFromApy(lstMetrics.lstPriceApy30d, Math.floor(365 / 2)) / 100;

	const solInFromStaking =
		superStakeLstDeposit * lstAprFromApy * lstMetrics.priceInSol;
	const solInFromDeposit =
		superStakeLstDeposit * lstDepositRate.toNum() * lstMetrics.priceInSol;
	const leveragedLstApr =
		solInFromStaking / (initialLstDeposit * lstMetrics.priceInSol);
	const solOut = solBorrowAmount * solBorrowRate.toNum();
	const solRewardsPerYear = solInFromStaking + solInFromDeposit - solOut;
	const lstNetProjectedApr =
		solRewardsPerYear / (initialLstDeposit * lstMetrics.priceInSol);
	const leveragedBorrowRate =
		solOut / (initialLstDeposit * lstMetrics.priceInSol);
	const leveragedDepositRate =
		solInFromDeposit / (initialLstDeposit * lstMetrics.priceInSol);

	// Add emissions APR on top because they are airdropped separately
	// Not subject to the borrow rate
	const emissionsAprFromApy = lstMetrics.emissionsApy
		? aprFromApy(lstMetrics.emissionsApy, Math.floor(365 / 2)) / 100
		: 0; // 365 / 2 ~= number of epochs per year
	const solInFromEmissions = superStakeLstDeposit * emissionsAprFromApy;
	const leveragedEmissionsApr =
		solInFromEmissions / (initialLstDeposit * lstMetrics.priceInSol);

	const totalNetProjectedApr =
		lstNetProjectedApr +
		(isNaN(leveragedEmissionsApr) ? 0 : leveragedEmissionsApr);

	return {
		solBorrowRate: solBorrowRate.toNum() * 100,
		lstDepositRate: lstDepositRate.toNum() * 100,
		lstApy: lstMetrics.lstPriceApy30d,

		// independant lst yield apr incl. leverage
		leveragedLstApr: leveragedLstApr * 100,

		// independent emissions apr incl. leverage
		leveragedEmissionsApr: leveragedEmissionsApr * 100,

		// Sol borro ratew denominated in % of user's collateral value in sol
		// Helps to understand the apr breakdown where other values incl. leverage
		leveragedBorrowRate: leveragedBorrowRate * 100,

		// Deposit rate of total LST value in SOL denominated in % of user's collateral value in sol
		leveragedDepositRate: leveragedDepositRate * 100,

		// net apr of borrow rate + lst deposit rate + lst yield incl. leverage
		lstNetProjectedApr: lstNetProjectedApr * 100,

		// total net apr of lstNetProjectedApr and emissions apr together
		totalNetProjectedApr: totalNetProjectedApr * 100,

		solBorrowAmount,
		unleveragedApr:
			lstDepositRate.toNum() * 100 +
			lstAprFromApy * 100 +
			emissionsAprFromApy * 100,
		loaded: true,
	};
};

const SOL_PRECISION_EXP = NINE;

/*
 * Returns current liquidation ratio at given LST / sol balances
 */
const getSuperstakeEstimatedLiquidationRatio = ({
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

/**
 * Fetches LST Metrics with a consistent return type for either msol, bsol, or jitosol
 *
 * @param lstSpotMarket
 * @returns
 */
const fetchLstMetrics = async (lstSpotMarket: SpotMarketConfig) => {
	if (lstSpotMarket.symbol.toLowerCase() === M_SOL.symbol.toLowerCase()) {
		const mSolMetrics = await fetchMSolMetrics();

		return {
			lstPriceApy30d: mSolMetrics.msol_price_apy_30d ?? 0,
			priceInSol: mSolMetrics.m_sol_price ?? 0,
			loaded: true,
		};
	} else if (
		lstSpotMarket.symbol.toLowerCase() === JITO_SOL.symbol.toLowerCase()
	) {
		const data = await fetchJitoSolMetrics();

		const past30DaysApyAvg =
			(data.apy.slice(-30).reduce((a, b) => a + b.data, 0) / 30) * 100;

		const priceInSol =
			data.tvl.slice(-1)[0].data /
			JITO_SOL.spotMarket.precision.toNumber() /
			data.supply.slice(-1)[0].data;

		return {
			lstPriceApy30d: past30DaysApyAvg ?? 0,
			priceInSol: priceInSol ?? 0,
			loaded: true,
		};
	} else if (
		lstSpotMarket.symbol.toLowerCase() === B_SOL.symbol.toLowerCase()
	) {
		let baseApy: number;
		let blzeApy: number;
		let lendingMultiplier: number;
		let priceInSol: number;
		let driftEmissions: number;

		const statsResponse = await fetchBSolMetrics();
		if (statsResponse.status === 200) {
			const data = (await statsResponse.json()) as BSOL_STATS_API_RESPONSE;
			priceInSol = data?.stats?.conversion?.bsol_to_sol;
			baseApy = data?.stats?.apy.base;
			lendingMultiplier = data?.stats?.apy.lending;
			blzeApy = data?.stats?.apy.blze * lendingMultiplier;
		}

		const driftEmissionsResponse = await fetchBSolDriftEmissions();
		if (driftEmissionsResponse.status === 200) {
			const data = await driftEmissionsResponse.json();
			driftEmissions = data?.emissions?.lend;
		}

		return {
			loaded: true,
			lstPriceApy30d: baseApy ?? 0,
			priceInSol: priceInSol ?? 0,
			emissionsApy: blzeApy,
			driftEmissions,
		};
	}
};

/**
 * Returns estimated max spot leverage for a particular lst
 *
 * @param lst
 * @param driftClient
 * @param driftClientIsReady
 * @returns
 */
const getMaxLeverageForLst = ({
	lstSpotMarket,
	solSpotMarket,
	driftClient,
	driftClientIsReady,
}: {
	lstSpotMarket: SpotMarketConfig;
	solSpotMarket: SpotMarketConfig;
	driftClient: DriftClient;
	driftClientIsReady: boolean;
}) => {
	if (!driftClient || !driftClientIsReady) {
		return {
			maxLeverage: 1,
			loaded: false,
		};
	}

	const lstSpotMarketAccount = driftClient.getSpotMarketAccount(
		lstSpotMarket.marketIndex
	);
	const solSpotMarketAccount = driftClient.getSpotMarketAccount(
		solSpotMarket.marketIndex
	);

	const spotWeightPrecisionExp =
		SPOT_MARKET_WEIGHT_PRECISION.toString().length - 1;

	const lstOraclePriceData = driftClient.getOracleDataForSpotMarket(
		lstSpotMarket.marketIndex
	);
	const lstOraclePriceBigNum = BigNum.from(
		lstOraclePriceData.price,
		QUOTE_PRECISION_EXP
	);

	const lstInitialAssetWeight = BigNum.from(
		calculateScaledInitialAssetWeight(
			lstSpotMarketAccount,
			lstOraclePriceBigNum.val
		),
		spotWeightPrecisionExp
	).toNum();

	const solInitialLiabilityWeight = BigNum.from(
		solSpotMarketAccount.initialLiabilityWeight,
		spotWeightPrecisionExp
	).toNum();

	// make sure to under estimate
	const unroundedMaxLeverage =
		lstInitialAssetWeight /
			(solInitialLiabilityWeight - lstInitialAssetWeight) +
		1;

	const maxLeverage =
		Math.floor(10 * Math.min(3, Math.max(1, unroundedMaxLeverage))) / 10;

	return {
		maxLeverage,
		loaded: true,
	};
};

export {
	getMaxLeverageForLst,
	getSuperstakeEstimatedApr,
	getSuperstakeEstimatedLiquidationRatio,
	fetchLstMetrics,
};
