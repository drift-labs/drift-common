import {
	getIfVaultBalance,
	getIfStakingVaultApr,
} from '../utils/insuranceFund';
import {
	getCurrentOpenInterestForMarket,
	getDepositAprForMarket,
	getBorrowAprForMarket,
} from '../utils/markets/interest';
import {
	getTotalBorrowsForMarket,
	getTotalDepositsForMarket,
} from '../utils/markets/balances';
import { dividesExactly } from '../utils/math/precision';
import {
	toSnakeCase,
	toCamelCase,
	normalizeBaseAssetSymbol,
} from '../utils/strings/format';
import { getTieredSortScore } from '../utils/math/sort';
import {
	calculateZScore,
	calculateMean,
	calculateMedian,
} from '../utils/math/numbers';
import { chunks, glueArray } from '../utils/core/arrays';
import { timedPromise } from '../utils/core/async';
import { getMultipleAccountsInfoChunked } from '../utils/accounts/multiple';
import { bnMax, bnMin, bnMean, bnMedian } from '../utils/math/bn';

/** @deprecated Use direct imports from '@drift-labs/common/utils/math', '@drift-labs/common/utils/core', etc. */
export const COMMON_UTILS = {
	getIfVaultBalance,
	getIfStakingVaultApr,
	getCurrentOpenInterestForMarket,
	getDepositAprForMarket,
	getBorrowAprForMarket,
	getTotalBorrowsForMarket,
	getTotalDepositsForMarket,
	dividesExactly,
	toSnakeCase,
	toCamelCase,
	getTieredSortScore,
	normalizeBaseAssetSymbol,
	calculateZScore,
	glueArray,
	timedPromise,
	chunks,
	getMultipleAccountsInfoChunked,
	MATH: {
		NUM: {
			mean: calculateMean,
			median: calculateMedian,
		},
		BN: {
			bnMax,
			bnMin,
			bnMean,
			bnMedian,
		},
	},
};
