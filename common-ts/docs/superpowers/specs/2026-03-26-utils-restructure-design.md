# Utils Restructure Design

## Problem

The `@drift-labs/common` package has a messy utility structure that makes it hard for both internal teams and external integrators to discover, import, and understand available utilities.

**Key issues identified in audit:**

1. **Poor discoverability** — utilities are scattered across `utils/`, `common-ui-utils/`, and `drift/utils/` with no clear organization principle
2. **God files** — `utils/index.ts` is 865 lines mixing pure utilities with domain-specific Drift protocol logic
3. **Namespace bag pattern** — `COMMON_UTILS`, `COMMON_UI_UTILS` aggregate unrelated functions into monolithic objects, making autocomplete and docs useless
4. **Duplicated functions** — `chunks` exists in both `utils/index.ts` and `common-ui-utils/commonUiUtils.ts`; `getTokenAddress`/`getTokenAccount` exist in both `utils/token.ts` and `common-ui-utils/commonUiUtils.ts`
5. **Misleading naming** — `common-ui-utils/` contains zero browser/UI API usage; it's trading domain logic
6. **Barrel file chaos** — `src/index.ts` has 47 re-exports, some duplicated (`priority-fees` exported twice), some bypassing barrel files
7. **No subpath exports** — only `"."` and `"./clients"` in `package.json` exports field

**Consumers:** NextJS web app, React Native app, and external integrators via npm.

## Goals

- Reorganize utilities into domain-based modules under `src/utils/`
- Add subpath exports so users can import from `@drift-labs/common/utils/math` etc.
- Deduplicate functions with a single source of truth
- Preserve backwards compatibility via deprecation facades (`COMMON_UI_UTILS`, `COMMON_UTILS`, etc.)
- Keep the build simple (`tsc` only, no bundler)
- Export everything from the main entry point (no public/internal gating)

## Non-Goals

- Tree-shaking optimization (future work)
- Bundler migration (future work)
- Public vs internal API gating (future work)
- Breaking changes to existing imports (deprecate-then-remove strategy)

## New Directory Structure

```
src/
  utils/
    # ─── Domain Modules (each has index.ts barrel) ───

    math/
      index.ts
      numbers.ts          # calculateMean, calculateMedian, calculateStandardDeviation,
                          # calculateZScore, getPctCompletion, roundToDecimal, aprFromApy
      bn.ts               # bnMin, bnMax, bnMean, bnMedian, sortBnAsc, sortBnDesc
      bignum.ts           # roundBigNumToDecimalPlace, getBigNumRoundedToStepSize
      precision.ts        # roundToStepSize, roundToStepSizeIfLargeEnough,
                          # truncateInputToPrecision, valueIsBelowStepSize,
                          # numbersFitEvenly, dividesExactly, TRADE_PRECISION
      spread.ts           # calculateSpread, calculateSpreadBidAskMark, calculateMarkPrice,
                          # calculateBidAskAndmarkPrice (+ private helpers:
                          # calculateSpreadQuote, calculateSpreadPct)
      price.ts            # getPriceForBaseAndQuoteAmount, getPriceForOrderRecord,
                          # getPriceForUIOrderRecord, calculateAverageEntryPrice
      sort.ts             # getTieredSortScore, sortRecordsByTs

    strings/
      index.ts
      format.ts           # abbreviateAddress, abbreviateAccountName, trimTrailingZeros,
                          # toSnakeCase, toCamelCase, normalizeBaseAssetSymbol
      parse.ts            # splitByCapitalLetters, lowerCaseNonFirstWords,
                          # disallowNegativeStringInput, isValidBase58
      convert.ts          # toPrintableObject, convertStringValuesToNumbers,
                          # extractStringValuesFromObject
      status.ts           # lastOrderStatusToNormalEng, LastOrderStatus, LastOrderStatusLabel,
                          # LAST_ORDER_STATUS_LABELS

    enum/
      index.ts            # matchEnum, ENUM_UTILS (unchanged)

    validation/
      index.ts
      address.ts          # isValidPublicKey, isValidAddressForChain, isValidBase58 (re-export
                          # from strings), isValidEvmAddress, isValidBitcoinAddress,
                          # isValidTronAddress, isValidSolanaAddress, getAddressFormatHint,
                          # isEvmChain, chain ID constants
      notional.ts         # isNotionalDust
      input.ts            # formatTokenInputCurried

    token/
      index.ts
      address.ts          # getTokenAddress (canonical, PublicKey params),
                          # getTokenAddressForDepositAndWithdraw
      account.ts          # getTokenAccount (canonical), getBalanceFromTokenAccountResult
      instructions.ts     # createTokenAccountIx, re-export TOKEN_PROGRAM_ID,
                          # createTransferCheckedInstruction

    trading/
      index.ts
      auction.ts          # getMarketAuctionParams, getLimitAuctionParams,
                          # deriveMarketOrderParams, getPriceObject
      pnl.ts              # calculatePnlPctFromPosition, calculatePotentialProfit,
                          # POTENTIAL_PROFIT_DEFAULT_STATE
      liquidation.ts      # calculateLiquidationPriceAfterPerpTrade
      leverage.ts         # convertLeverageToMarginRatio, convertMarginRatioToLeverage,
                          # validateLeverageChange, getMarginUsedForPosition
      lp.ts               # getLpSharesAmountForQuote, getQuoteValueForLpShares
      price.ts            # getMarketOrderLimitPrice, checkIsMarketOrderType
      size.ts             # getMarketTickSize, getMarketTickSizeDecimals,
                          # getMarketStepSize, getMarketStepSizeDecimals,
                          # isEntirePositionOrder, getMaxLeverageOrderSize, formatOrderSize

    markets/
      index.ts
      config.ts           # getMarketConfig, getBaseAssetSymbol
      leverage.ts         # getMaxLeverageForMarket, getMaxLeverageForMarketAccount
      operations.ts       # getPausedOperations, PerpOperationsMap, SpotOperationsMap,
                          # InsuranceFundOperationsMap
      interest.ts         # getCurrentOpenInterestForMarket, getDepositAprForMarket,
                          # getBorrowAprForMarket
      balances.ts         # getTotalBorrowsForMarket, getTotalDepositsForMarket
      precisions.ts       # (moved from utils/markets/precisions.ts)

    orders/
      index.ts
      labels.ts           # getOrderLabelFromOrderDetails, getUIOrderTypeFromSdkOrderType
      filters.ts          # orderActionRecordIsTrade, uiOrderActionRecordIsTrade,
                          # filterTradeRecordsFromOrderActionRecords,
                          # filterTradeRecordsFromUIOrderRecords, isOrderTriggered
      sort.ts             # getSortScoreForOrderRecords, getSortScoreForOrderActionRecords,
                          # sortUIMatchedOrderRecordAndAction, sortUIOrderActionRecords,
                          # sortUIOrderRecords, sortOrderRecords,
                          # getLatestOfTwoUIOrderRecords, getLatestOfTwoOrderRecords,
                          # getUIOrderRecordsLaterThanTarget
      oracle.ts           # getLimitPriceFromOracleOffset, isAuctionEmpty
      flags.ts            # getPerpOrderParamsBitFlags, getPerpAuctionDuration,
                          # HighLeverageOptions (type)
      misc.ts             # orderIsNull, getTradeInfoFromActionRecord, getAnchorEnumString

    positions/
      index.ts
      open.ts             # getOpenPositionData
      user.ts             # checkIfUserAccountExists, getUserMaxLeverageForMarket

    accounts/
      index.ts
      init.ts             # initializeAndSubscribeToNewUserAccount,
                          # awaitAccountInitializationChainState, updateUserAccount (private),
                          # ACCOUNT_INITIALIZATION_RETRY_DELAY_MS,
                          # ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS
      keys.ts             # getUserKey, getIdAndAuthorityFromKey, getMarketKey
                          # (includes uiStringCache + getCachedUiString private helpers,
                          # shared with abbreviateAddress in strings/format.ts via
                          # a shared cache utility in core/)
      subaccounts.ts      # fetchCurrentSubaccounts, fetchUserClientsAndAccounts, userExists
      wallet.ts           # createPlaceholderIWallet, WalletConnectionState (class + enums)
      signature.ts        # verifySignature, hashSignature, compareSignatures,
                          # getSignatureVerificationMessageForSettings
      multiple.ts         # getMultipleAccounts, getMultipleAccountsCore,
                          # getMultipleAccountsInfoChunked

    core/
      index.ts
      async.ts            # sleep, timedPromise
      arrays.ts           # chunks (canonical, deduplicated), glueArray
      data-structures.ts  # Ref, Counter, MultiSwitch
      equality.ts         # arePropertiesEqual, areTwoOpenPositionsEqual,
                          # areOpenPositionListsEqual, EQUALITY_CHECKS
      cache.ts            # uiStringCache, getCachedUiString (shared by strings/format.ts
                          # and accounts/keys.ts)
      fetch.ts            # encodeQueryParams
      serialization.ts    # encodeStringifiableObject, decodeStringifiableObject

    # ─── Non-domain files (stay at utils/ level, not in a domain module) ───
    logger.ts             # unchanged (Node/winston)
    featureFlags.ts       # FEATURE_FLAGS (note: camelCase filename, not hyphenated)
    geoblock/             # checkGeoBlock
    settings/             # VersionedSettingsHandler (moved from common-ui-utils/settings)
    priority-fees/        # PriorityFeeCalculator, strategies
    candles/              # Candle, types
    orderbook/            # orderbook utils
    CircularBuffers/      # CircularBuffer, UniqueCircularBuffer
    dlob-server/          # DlobServerWebsocketUtils

    # ─── Files that stay at utils/ level (small, standalone) ───
    rxjs.ts
    rpcLatency.ts
    driftEvents.ts
    pollingSequenceGuard.ts
    priorityFees.ts
    NumLib.ts
    millify.ts
    MultiplexWebSocket.ts
    SharedInterval.ts
    Stopwatch.ts
    SlotBasedResultValidator.ts
    ResultSlotIncrementer.ts
    signedMsgs.ts
    s3Buckets.ts
    superstake.ts
    priceImpact.ts
    assert.ts
    insuranceFund.ts
    StrictEventEmitter.ts

  # ─── Deprecation Facades ───
  _deprecated/
    utils.ts              # Reconstructs COMMON_UTILS by importing from new locations
    common-ui-utils.ts    # Reconstructs COMMON_UI_UTILS (+ TRADING_UTILS, MARKET_UTILS,
                          # ORDER_COMMON_UTILS, USER_UTILS spread in)
    common-math.ts        # Reconstructs COMMON_MATH namespace
    equality-checks.ts    # Reconstructs EQUALITY_CHECKS namespace
    trading-utils.ts      # Reconstructs TRADING_UTILS namespace
    market-utils.ts       # Reconstructs MARKET_UTILS namespace
    order-utils.ts        # Reconstructs ORDER_COMMON_UTILS namespace
    user-utils.ts         # Reconstructs USER_UTILS namespace

  # ─── Unchanged ───
  clients/
  constants/
  drift/                  # drift/utils/ stays as-is
  types/
  actions/
  Config.ts
  EnvironmentConstants.ts
  chartConstants.ts
  serializableTypes.ts
```

## Deprecation Facades

### `_deprecated/utils.ts`

Reconstructs the `COMMON_UTILS` namespace object by importing each function from its new canonical location:

```ts
import { getIfVaultBalance, getIfStakingVaultApr } from '../utils/...';
import { getCurrentOpenInterestForMarket, ... } from '../utils/markets';
import { dividesExactly } from '../utils/math';
import { toSnakeCase, toCamelCase, normalizeBaseAssetSymbol } from '../utils/strings';
import { getTieredSortScore } from '../utils/math';
import { calculateMean, calculateMedian, bnMax, bnMin, bnMean, bnMedian } from '../utils/math';
import { chunks, glueArray, timedPromise } from '../utils/core';

/** @deprecated Use direct imports from '@drift-labs/common/utils/math' etc. */
export const COMMON_UTILS = {
  getIfVaultBalance,
  getIfStakingVaultApr,
  getCurrentOpenInterestForMarket,
  // ... all existing members
  MATH: {
    NUM: { mean: calculateMean, median: calculateMedian },
    BN: { bnMax, bnMin, bnMean, bnMedian },
  },
};
```

### `_deprecated/common-ui-utils.ts`

Reconstructs `COMMON_UI_UTILS` by importing from new locations and spreading in `USER_UTILS`, `TRADING_UTILS`, `MARKET_UTILS`, `ORDER_COMMON_UTILS`:

```ts
import { abbreviateAddress } from '../utils/strings';
import { deriveMarketOrderParams, ... } from '../utils/trading';
import { getUserKey, getMarketKey, ... } from '../utils/accounts';
// ... etc

/** @deprecated Use direct imports from specific modules */
export const COMMON_UI_UTILS = {
  abbreviateAddress,
  calculateAverageEntryPrice,
  chunks,
  // ... all existing members including spreads
};
```

Also re-exports the individual namespace objects:
```ts
export { TRADING_UTILS } from './trading-utils';
export { MARKET_UTILS } from './market-utils';
export { ORDER_COMMON_UTILS } from './order-utils';
export { USER_UTILS } from './user-utils';
```

### Deprecated Types

Types that were previously exported alongside deprecated utils (e.g., `PartialOrderActionRecord`, `PartialUISerializableOrderActionRecord`, `HighLeverageOptions`) move to the new domain modules and are re-exported from the deprecation facade.

## Deduplication

| Function | Current locations | Canonical location |
|---|---|---|
| `chunks` | `utils/index.ts`, `common-ui-utils/commonUiUtils.ts` | `utils/core/arrays.ts` |
| `getTokenAddress` | `utils/token.ts` (string params), `common-ui-utils/commonUiUtils.ts` (PublicKey params) | `utils/token/address.ts` — keep both signatures, export from same file |
| `getTokenAccount` | `utils/token.ts` (string params), `common-ui-utils/commonUiUtils.ts` (PublicKey params + warning) | `utils/token/account.ts` — keep the richer version (with warning detection), add string-param overload |
| `getLatestOfTwoUIOrderRecords` / `getLatestOfTwoOrderRecords` | `utils/index.ts` — identical implementations | `utils/orders/sort.ts` — keep both names for compat, but they call same underlying function |

## `package.json` Changes

### Exports field

Each subpath entry includes both `types` and `default` conditions for proper TypeScript
resolution with `moduleResolution: "node16"` or `"nodenext"`:

```json
{
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",
      "default": "./lib/index.js"
    },
    "./clients": {
      "types": "./lib/clients/index.d.ts",
      "default": "./lib/clients/index.js"
    },
    "./utils/math": {
      "types": "./lib/utils/math/index.d.ts",
      "default": "./lib/utils/math/index.js"
    },
    "./utils/strings": {
      "types": "./lib/utils/strings/index.d.ts",
      "default": "./lib/utils/strings/index.js"
    },
    "./utils/enum": {
      "types": "./lib/utils/enum/index.d.ts",
      "default": "./lib/utils/enum/index.js"
    },
    "./utils/validation": {
      "types": "./lib/utils/validation/index.d.ts",
      "default": "./lib/utils/validation/index.js"
    },
    "./utils/token": {
      "types": "./lib/utils/token/index.d.ts",
      "default": "./lib/utils/token/index.js"
    },
    "./utils/trading": {
      "types": "./lib/utils/trading/index.d.ts",
      "default": "./lib/utils/trading/index.js"
    },
    "./utils/markets": {
      "types": "./lib/utils/markets/index.d.ts",
      "default": "./lib/utils/markets/index.js"
    },
    "./utils/orders": {
      "types": "./lib/utils/orders/index.d.ts",
      "default": "./lib/utils/orders/index.js"
    },
    "./utils/positions": {
      "types": "./lib/utils/positions/index.d.ts",
      "default": "./lib/utils/positions/index.js"
    },
    "./utils/accounts": {
      "types": "./lib/utils/accounts/index.d.ts",
      "default": "./lib/utils/accounts/index.js"
    },
    "./utils/core": {
      "types": "./lib/utils/core/index.d.ts",
      "default": "./lib/utils/core/index.js"
    }
  }
}
```

### typesVersions (fallback for `moduleResolution: "node"`)

Consumers using the legacy `moduleResolution: "node"` in their `tsconfig.json` will not
resolve subpath exports. The `typesVersions` field provides a fallback for TypeScript type
resolution in that mode:

```json
{
  "typesVersions": {
    "*": {
      "utils/math": ["lib/utils/math/index.d.ts"],
      "utils/strings": ["lib/utils/strings/index.d.ts"],
      "utils/enum": ["lib/utils/enum/index.d.ts"],
      "utils/validation": ["lib/utils/validation/index.d.ts"],
      "utils/token": ["lib/utils/token/index.d.ts"],
      "utils/trading": ["lib/utils/trading/index.d.ts"],
      "utils/markets": ["lib/utils/markets/index.d.ts"],
      "utils/orders": ["lib/utils/orders/index.d.ts"],
      "utils/positions": ["lib/utils/positions/index.d.ts"],
      "utils/accounts": ["lib/utils/accounts/index.d.ts"],
      "utils/core": ["lib/utils/core/index.d.ts"]
    }
  }
}
```

### Browser field

Logger browser stub has been removed — no `browser` field needed.

## `src/index.ts` (Main Barrel)

The main barrel re-exports everything:

```ts
// New domain modules
export * from './utils/math';
export * from './utils/strings';
export * from './utils/enum';
export * from './utils/validation';
export * from './utils/token';
export * from './utils/trading';
export * from './utils/markets';
export * from './utils/orders';
export * from './utils/positions';
export * from './utils/accounts';
export * from './utils/core';

// Non-domain utils (unchanged paths)
export * from './utils/logger';
export * from './utils/featureFlags';
export * from './utils/candles/Candle';
export * from './utils/rpcLatency';
export * from './utils/SharedInterval';
export * from './utils/Stopwatch';
export * from './utils/priority-fees';
export * from './utils/superstake';
export * from './utils/priceImpact';
export * from './utils/dlob-server/DlobServerWebsocketUtils';
export * from './utils/orderbook';
export * from './utils/pollingSequenceGuard';
export * from './utils/driftEvents';
export * from './utils/SlotBasedResultValidator';
export * from './utils/CircularBuffers';
export * from './utils/rxjs';
export * from './utils/priorityFees';
export * from './utils/NumLib';
export * from './utils/s3Buckets';
export { default as millify } from './utils/millify';
export { getSwiftConfirmationTimeoutMs } from './utils/signedMsgs';
export { ResultSlotIncrementer } from './utils/ResultSlotIncrementer';
export { MultiplexWebSocket } from './utils/MultiplexWebSocket';

// Settings
export * from './utils/settings/settings';

// Deprecation facades (backwards compat)
export { COMMON_UTILS } from './_deprecated/utils';
export { COMMON_UI_UTILS } from './_deprecated/common-ui-utils';
export { COMMON_MATH } from './_deprecated/common-math';
export { EQUALITY_CHECKS } from './_deprecated/equality-checks';
export { TRADING_UTILS } from './_deprecated/trading-utils';
export { MARKET_UTILS } from './_deprecated/market-utils';
export { ORDER_COMMON_UTILS } from './_deprecated/order-utils';
export { USER_UTILS } from './_deprecated/user-utils';

// Other unchanged exports
export * from './Config';
export * from './chartConstants';
export * from './types';
export * from './EnvironmentConstants';
export * from './serializableTypes';
export * from './constants';
export * from './actions/actionHelpers/actionHelpers';
export * from './clients/candleClient';
export * from './clients/marketDataFeed';
export * from './clients/swiftClient';
export * from './clients/tvFeed';
export * from './clients/DlobWebsocketClient';
export * from './drift';

// External program errors
import JupV4Errors from './constants/autogenerated/jup-v4-error-codes.json';
import JupV6Errors from './constants/autogenerated/jup-v6-error-codes.json';
export { JupV4Errors, JupV6Errors };

import DriftErrors from './constants/autogenerated/driftErrors.json';
export { DriftErrors };
```

## Migration Checklist (for implementation plan)

1. Create all new domain module directories and files under `utils/`
2. Move functions from `utils/index.ts` into appropriate domain modules
3. Move functions from `common-ui-utils/*.ts` into appropriate domain modules
4. Deduplicate `chunks`, `getTokenAddress`, `getTokenAccount`
5. Move types alongside their functions
6. Create deprecation facade files in `_deprecated/`
7. Create new `utils/index.ts` barrel (just re-exports all domain modules)
8. Rewrite `src/index.ts` barrel
9. Update `package.json` exports and browser fields
10. Update all internal imports (`drift/`, `clients/`, etc.) to use new paths
11. Run `tsc` — fix any import/type errors
12. Run existing tests — ensure nothing breaks
13. Run `madge --circular` to check for circular dependency regressions
14. Verify old import paths still work (COMMON_UI_UTILS etc.)
15. Bump minor version (non-breaking — deprecation only)

## Risks

- **Circular dependencies**: Moving code between modules may introduce cycles. `madge --circular` must pass.
- **Re-export conflicts**: Two domain modules exporting the same name. The audit found no naming conflicts, but must verify during implementation. Specifically watch for `WalletConnectionState` (must be exported from `accounts/` only, not duplicated at `utils/` level).
- **Browser field**: Logger path must be kept in sync with package.json browser field.
- **Consumers using deep imports**: Any external user importing `@drift-labs/common/lib/utils/index` directly (bypassing the exports field) will break. This is acceptable — deep `lib/` imports are not part of the public API.
- **TypeScript `moduleResolution: "node"` compatibility**: Consumers using the legacy `moduleResolution: "node"` will not resolve subpath exports. The `typesVersions` field in `package.json` provides a fallback for type resolution, but runtime resolution requires Node.js 12.7+ (not a concern given `engines: "^24.x.x"`).
