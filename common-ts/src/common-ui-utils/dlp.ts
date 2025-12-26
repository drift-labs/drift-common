import {
	BigNum,
	DriftClient,
	LPPoolAccount,
	ConstituentMap,
	ONE,
	QUOTE_PRECISION,
	QUOTE_PRECISION_EXP,
	PRICE_PRECISION,
	BN,
} from '@drift-labs/sdk';
import { TransactionInstruction, VersionedTransaction } from '@solana/web3.js';

interface FeeLogData {
	in_fee_amount?: number;
	in_amount?: number;
	lp_fee_amount?: number;
	lp_amount?: number;
	out_fee_amount?: number;
	out_amount?: number;
	lp_burn_amount?: number;
}

interface DlpFeeBreakdown {
	inMarketFee: BigNum; // in market's base precision
	lpFee: BigNum; // in DLP precision (6 decimals)
	totalFeeInQuote: BigNum; // in quote precision
}

/**
 * Simulates a transaction and extracts logs
 */
const simTransactionAndGetLogs = async (
	driftClient: DriftClient,
	ixs: TransactionInstruction[]
): Promise<string[]> => {
	const tx = await driftClient.buildTransaction(ixs);
	const simulation = await driftClient.connection.simulateTransaction(
		tx as VersionedTransaction,
		{
			sigVerify: false,
		}
	);

	if (simulation.value.err) {
		throw new Error(
			`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`
		);
	}

	return simulation.value.logs ?? [];
};

/**
 * Parses a log line containing comma-separated key:value pairs
 */
const parseLogLine = (logLine: string): FeeLogData => {
	const cleaned = logLine.replace(/^Program log:\s*/, '');
	const pairs = cleaned.split(',').map((pair) => {
		const [key, val] = pair.trim().split(':');
		return [key.trim(), Number(val.trim())];
	});
	return Object.fromEntries(pairs);
};

/**
 * Fetches the fees for minting DLP tokens
 * @param driftClient - The DriftClient instance
 * @param amount - The amount to mint (in base units)
 * @param marketIndex - The spot market index of the token being used to mint
 * @param lpPool - The LP pool account
 * @param constituentMap - The constituent map
 * @returns Breakdown of fees in Quote precision
 */
const fetchFeesForMint = async (
	driftClient: DriftClient,
	amount: BigNum,
	marketIndex: number,
	lpPool: LPPoolAccount,
	constituentMap: ConstituentMap
): Promise<DlpFeeBreakdown> => {
	try {
		const depositIxs = await driftClient.getAllLpPoolAddLiquidityIxs(
			{
				inMarketIndex: marketIndex,
				inAmount: amount.val,
				minMintAmount: ONE,
				lpPool: lpPool,
			},
			constituentMap,
			true, // includeUpdateConstituentOracleInfo
			true // view mode to get fee info
		);

		const logs = await simTransactionAndGetLogs(driftClient, depositIxs);

		console.log('logs', logs);

		const depositFeeLog = logs.find((log) => log.includes('in_fee_amount'));

		// Get spot market account for input token to get decimals
		const spotMarketAccount = driftClient.getSpotMarketAccount(marketIndex);
		if (!spotMarketAccount) {
			console.warn('Spot market account not found');
			return {
				inMarketFee: BigNum.zero(spotMarketAccount?.decimals ?? 6),
				lpFee: BigNum.zero(6),
				totalFeeInQuote: BigNum.zero(QUOTE_PRECISION_EXP),
			};
		}

		if (!depositFeeLog) {
			console.warn('No fee log found for mint operation');
			return {
				inMarketFee: BigNum.zero(spotMarketAccount.decimals),
				lpFee: BigNum.zero(6),
				totalFeeInQuote: BigNum.zero(QUOTE_PRECISION_EXP),
			};
		}

		const parsedFeeLog = parseLogLine(depositFeeLog);

		// Get in_fee_amount (in token's native precision)
		const inFeeInToken = new BN(parsedFeeLog.in_fee_amount ?? 0);

		// Get lp_fee_amount (in DLP token precision = 6)
		const lpFeeInDlp = new BN(parsedFeeLog.lp_fee_amount ?? 0);

		// Calculate total fee in quote precision for display
		const oraclePrice = driftClient.getOracleDataForSpotMarket(marketIndex);
		const tokenPrecision = new BN(10).pow(new BN(spotMarketAccount.decimals));
		const inFeeInQuote = inFeeInToken
			.mul(oraclePrice.price)
			.mul(QUOTE_PRECISION)
			.div(PRICE_PRECISION)
			.div(tokenPrecision);

		const lpTokenSupply = lpPool.tokenSupply;
		const dlpPrice = lpPool.lastAum
			.mul(PRICE_PRECISION)
			.div(BN.max(lpTokenSupply, ONE));

		const dlpPrecision = new BN(10).pow(new BN(6)); // DLP has 6 decimals
		const lpFeeInQuote = lpFeeInDlp
			.mul(dlpPrice)
			.mul(QUOTE_PRECISION)
			.div(PRICE_PRECISION)
			.div(dlpPrecision);

		const totalFeeInQuote = inFeeInQuote.add(lpFeeInQuote);

		console.log(
			'inFeeInToken',
			BigNum.from(inFeeInToken, spotMarketAccount.decimals).toNum()
		);
		console.log('lpFeeInDlp', BigNum.from(lpFeeInDlp, 6).toNum());
		console.log(
			'inFeeInQuote',
			BigNum.from(inFeeInQuote, QUOTE_PRECISION_EXP).toNum()
		);
		console.log(
			'lpFeeInQuote',
			BigNum.from(lpFeeInQuote, QUOTE_PRECISION_EXP).toNum()
		);
		console.log(
			'totalFeeInQuote',
			BigNum.from(totalFeeInQuote, QUOTE_PRECISION_EXP).toNum()
		);

		return {
			inMarketFee: BigNum.from(inFeeInToken, spotMarketAccount.decimals),
			lpFee: BigNum.from(lpFeeInDlp, 6),
			totalFeeInQuote: BigNum.from(totalFeeInQuote, QUOTE_PRECISION_EXP),
		};
	} catch (error) {
		console.error('Error fetching mint fees:', error);
		const spotMarketAccount = driftClient.getSpotMarketAccount(marketIndex);
		return {
			inMarketFee: BigNum.zero(spotMarketAccount?.decimals ?? 6),
			lpFee: BigNum.zero(6),
			totalFeeInQuote: BigNum.zero(QUOTE_PRECISION_EXP),
		};
	}
};

/**
 * Fetches the fees for redeeming DLP tokens
 * @param driftClient - The DriftClient instance
 * @param amount - The amount of DLP to redeem (in base units)
 * @param marketIndex - The spot market index of the token being redeemed for
 * @param lpPool - The LP pool account
 * @param constituentMap - The constituent map
 * @param tokenPrice - The current price of the output token (for calculating a reasonable redeem amount)
 * @returns Breakdown of fees in Quote precision
 */
const fetchFeesForRedeem = async (
	driftClient: DriftClient,
	amount: BigNum,
	marketIndex: number,
	lpPool: LPPoolAccount,
	constituentMap: ConstituentMap,
	tokenPrice: number = 1
): Promise<DlpFeeBreakdown> => {
	try {
		// Use the provided amount, or default to $50k worth of LP tokens if amount is too small
		const redeemAmount = amount.val.gt(QUOTE_PRECISION)
			? amount.val
			: QUOTE_PRECISION.muln(Math.max(50_000 / tokenPrice, 1));

		const removeIxs = await driftClient.getAllLpPoolRemoveLiquidityIxs(
			{
				outMarketIndex: marketIndex,
				minAmountOut: ONE,
				lpToBurn: redeemAmount,
				lpPool: lpPool,
			},
			constituentMap,
			true, // includeUpdateConstituentOracleInfo
			true // view mode to get fee info
		);

		const logs = await simTransactionAndGetLogs(driftClient, removeIxs);

		console.log('logs', logs);

		// Get spot market account for output token to get decimals
		const spotMarketAccount = driftClient.getSpotMarketAccount(marketIndex);
		if (!spotMarketAccount) {
			console.warn('Spot market account not found');
			return {
				inMarketFee: BigNum.zero(spotMarketAccount?.decimals ?? 6),
				lpFee: BigNum.zero(6),
				totalFeeInQuote: BigNum.zero(QUOTE_PRECISION_EXP),
			};
		}

		const removeFeeLog = logs.find((log) => log.includes('out_fee_amount'));

		if (!removeFeeLog) {
			console.warn('No fee log found for redeem operation');
			return {
				inMarketFee: BigNum.zero(spotMarketAccount.decimals),
				lpFee: BigNum.zero(6),
				totalFeeInQuote: BigNum.zero(QUOTE_PRECISION_EXP),
			};
		}

		const parsedFeeLog = parseLogLine(removeFeeLog);

		// Get out_fee_amount (in token's native precision)
		const outFeeInToken = new BN(parsedFeeLog.out_fee_amount ?? 0);

		// Get lp_fee_amount (in DLP token precision = 6)
		const lpFeeInDlp = new BN(parsedFeeLog.lp_fee_amount ?? 0);

		// Calculate total fee in quote precision for display
		const oraclePrice = driftClient.getOracleDataForSpotMarket(marketIndex);
		const tokenPrecision = new BN(10).pow(new BN(spotMarketAccount.decimals));
		const outFeeInQuote = outFeeInToken
			.mul(oraclePrice.price)
			.mul(QUOTE_PRECISION)
			.div(PRICE_PRECISION)
			.div(tokenPrecision);

		const lpTokenSupply = lpPool.tokenSupply;
		const dlpPrice = lpPool.lastAum
			.mul(PRICE_PRECISION)
			.div(BN.max(lpTokenSupply, ONE));

		const dlpPrecision = new BN(10).pow(new BN(6)); // DLP has 6 decimals
		const lpFeeInQuote = lpFeeInDlp
			.mul(dlpPrice)
			.mul(QUOTE_PRECISION)
			.div(PRICE_PRECISION)
			.div(dlpPrecision);

		const totalFeeInQuote = outFeeInQuote.add(lpFeeInQuote);

		return {
			inMarketFee: BigNum.from(outFeeInToken, spotMarketAccount.decimals),
			lpFee: BigNum.from(lpFeeInDlp, 6),
			totalFeeInQuote: BigNum.from(totalFeeInQuote, QUOTE_PRECISION_EXP),
		};
	} catch (error) {
		console.error('Error fetching redeem fees:', error);
		const spotMarketAccount = driftClient.getSpotMarketAccount(marketIndex);
		return {
			inMarketFee: BigNum.zero(spotMarketAccount?.decimals ?? 6),
			lpFee: BigNum.zero(6),
			totalFeeInQuote: BigNum.zero(QUOTE_PRECISION_EXP),
		};
	}
};

export const DLP_UTILS = {
	fetchFeesForMint,
	fetchFeesForRedeem,
};

export type { DlpFeeBreakdown };
