import { abbreviateAddress, trimTrailingZeros } from '../utils/strings/format';
import { calculateAverageEntryPrice } from '../utils/math/price';
import { chunks } from '../utils/core/arrays';
import {
	compareSignatures,
	getSignatureVerificationMessageForSettings,
	verifySignature,
	hashSignature,
} from '../utils/accounts/signature';
import { createPlaceholderIWallet } from '../utils/accounts/wallet';
import {
	deriveMarketOrderParams,
	getLimitAuctionParams,
	getMarketAuctionParams,
	getPriceObject,
} from '../utils/trading/auction';
import {
	fetchCurrentSubaccounts,
	fetchUserClientsAndAccounts,
	userExists,
} from '../utils/accounts/subaccounts';
import { formatTokenInputCurried } from '../utils/validation/input';
import {
	getBalanceFromTokenAccountResult,
	getTokenAccount,
} from '../utils/token/account';
import {
	getIdAndAuthorityFromKey,
	getUserKey,
	getMarketKey,
} from '../utils/accounts/keys';
import {
	getLpSharesAmountForQuote,
	getQuoteValueForLpShares,
} from '../utils/trading/lp';
import { getMarketOrderLimitPrice } from '../utils/trading/price';
import {
	getMultipleAccounts,
	getMultipleAccountsCore,
} from '../utils/accounts/multiple';
import { getTokenAddress } from '../utils/token/address';
import { initializeAndSubscribeToNewUserAccount } from '../utils/accounts/init';
import { USER_UTILS } from './user-utils';
import { TRADING_UTILS } from './trading-utils';
import { MARKET_UTILS } from './market-utils';
import { ORDER_COMMON_UTILS } from './order-utils';

/** @deprecated Use direct imports from '@drift-labs/common/utils/trading', '@drift-labs/common/utils/accounts', etc. */
export const COMMON_UI_UTILS = {
	abbreviateAddress,
	calculateAverageEntryPrice,
	chunks,
	compareSignatures,
	createPlaceholderIWallet,
	deriveMarketOrderParams,
	fetchCurrentSubaccounts,
	fetchUserClientsAndAccounts,
	formatTokenInputCurried,
	getBalanceFromTokenAccountResult,
	getIdAndAuthorityFromKey,
	getLimitAuctionParams,
	getLpSharesAmountForQuote,
	getMarketAuctionParams,
	getMarketKey,
	getMarketOrderLimitPrice,
	getMultipleAccounts,
	getMultipleAccountsCore,
	getPriceObject,
	getQuoteValueForLpShares,
	getSignatureVerificationMessageForSettings,
	getTokenAccount,
	getTokenAddress,
	getUserKey,
	hashSignature,
	initializeAndSubscribeToNewUserAccount,
	userExists,
	verifySignature,
	trimTrailingZeros,
	...USER_UTILS,
	...TRADING_UTILS,
	...MARKET_UTILS,
	...ORDER_COMMON_UTILS,
};
