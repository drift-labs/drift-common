# Utils Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `@drift-labs/common` utility methods into domain-based modules under `src/utils/` with subpath exports and deprecation facades for backwards compatibility.

**Architecture:** Functions currently scattered across `src/utils/index.ts` (865-line god file), `src/common-ui-utils/` (5 files), and standalone util files get moved into 11 domain-based modules under `src/utils/`. Old namespace objects (`COMMON_UTILS`, `COMMON_UI_UTILS`, etc.) are preserved as deprecation facades in `src/_deprecated/`. The main `src/index.ts` barrel re-exports everything.

**Tech Stack:** TypeScript 5.4, tsc (no bundler), CommonJS output, `@drift-labs/sdk`, `@solana/web3.js`

**Spec:** `docs/superpowers/specs/2026-03-26-utils-restructure-design.md`

---

## File Structure

### New files to create

**Domain modules (each with `index.ts` barrel):**
```
src/utils/math/index.ts, numbers.ts, bn.ts, bignum.ts, precision.ts, spread.ts, price.ts, sort.ts
src/utils/strings/index.ts, format.ts, parse.ts, convert.ts, status.ts
src/utils/enum/index.ts                    (copy of existing src/utils/enum.ts)
src/utils/validation/index.ts              (barrel re-exporting existing validation.ts content)
src/utils/token/index.ts, address.ts, account.ts, instructions.ts
src/utils/trading/index.ts, auction.ts, pnl.ts, liquidation.ts, leverage.ts, lp.ts, price.ts, size.ts
src/utils/markets/index.ts, config.ts, leverage.ts, operations.ts, interest.ts, balances.ts
src/utils/orders/index.ts, labels.ts, filters.ts, sort.ts, oracle.ts, flags.ts, misc.ts
src/utils/positions/index.ts, open.ts, user.ts
src/utils/accounts/index.ts, init.ts, keys.ts, subaccounts.ts, wallet.ts, signature.ts, multiple.ts
src/utils/core/index.ts, async.ts, arrays.ts, data-structures.ts, equality.ts, cache.ts, fetch.ts, serialization.ts
```

**Deprecation facades:**
```
src/_deprecated/utils.ts
src/_deprecated/common-ui-utils.ts
src/_deprecated/common-math.ts
src/_deprecated/equality-checks.ts
src/_deprecated/trading-utils.ts
src/_deprecated/market-utils.ts
src/_deprecated/order-utils.ts
src/_deprecated/user-utils.ts
```

### Files to modify
```
src/index.ts                               (complete rewrite of barrel)
package.json                               (add exports, typesVersions)
```

### Files to delete (after migration)
```
src/utils/index.ts                         (replaced by new utils/index.ts barrel + domain modules)
src/common-ui-utils/                       (entire directory — moved to domain modules + utils/settings/)
src/utils/equalityChecks.ts                (moved to core/equality.ts)
src/utils/fetch.ts                         (moved to core/fetch.ts)
src/utils/WalletConnectionState.ts         (moved to accounts/wallet.ts)
src/utils/enum.ts                          (replaced by utils/enum/index.ts)
src/utils/strings.ts                       (replaced by utils/strings/)
src/utils/validation.ts                    (replaced by utils/validation/)
src/utils/token.ts                         (replaced by utils/token/)
src/utils/math.ts                          (replaced by utils/math/)
```

### Files to move (not delete, just relocate)
```
src/common-ui-utils/settings/settings.ts   → src/utils/settings/settings.ts (copy before deleting common-ui-utils/)
```

### Files to create (new barrel to replace deleted god file)
```
src/utils/index.ts                         (new barrel that re-exports all domain modules)
```

### Files to keep unchanged
```
src/utils/logger.ts, featureFlags.ts, geoblock/, priority-fees/,
candles/, orderbook/, CircularBuffers/, dlob-server/, rxjs.ts, rpcLatency.ts,
driftEvents.ts, pollingSequenceGuard.ts, priorityFees.ts, NumLib.ts, millify.ts,
MultiplexWebSocket.ts, SharedInterval.ts, Stopwatch.ts, SlotBasedResultValidator.ts,
ResultSlotIncrementer.ts, signedMsgs.ts, s3Buckets.ts, superstake.ts,
priceImpact.ts, assert.ts, insuranceFund.ts, StrictEventEmitter.ts
```

### Files that stay but need internal import updates
```
src/utils/superstake.ts                    (imports aprFromApy from '../utils' → '../utils/math/numbers')
src/drift/ files                           (imports of sleep, ENUM_UTILS from '../utils' → new paths)
```

---

## Task 1: Create `utils/core/` module

Extract universal, non-domain utilities from `utils/index.ts` and `common-ui-utils/commonUiUtils.ts`.

**Files:**
- Create: `src/utils/core/async.ts`
- Create: `src/utils/core/arrays.ts`
- Create: `src/utils/core/data-structures.ts`
- Create: `src/utils/core/cache.ts`
- Create: `src/utils/core/fetch.ts`
- Create: `src/utils/core/serialization.ts`
- Create: `src/utils/core/equality.ts`
- Create: `src/utils/core/index.ts`

**Source mapping:**
- `async.ts`: `sleep` (utils/index.ts:35), `timedPromise` (utils/index.ts:803)
- `arrays.ts`: `chunks` (utils/index.ts:813 — canonical), `glueArray` (utils/index.ts:748)
- `data-structures.ts`: `Ref` (utils/index.ts:391), `Counter` (utils/index.ts:407), `MultiSwitch` (utils/index.ts:429)
- `cache.ts`: `uiStringCache`, `MAX_UI_STRING_CACHE_SIZE`, `getCachedUiString` (common-ui-utils/commonUiUtils.ts:43-86)
- `fetch.ts`: `encodeQueryParams` (utils/fetch.ts:1-11)
- `serialization.ts`: `getStringifiableObjectEntry`, `encodeStringifiableObject`, `decodeStringifiableObject` (utils/index.ts:38-136)
- `equality.ts`: entire `utils/equalityChecks.ts` file (types + `arePropertiesEqual`, `areTwoOpenPositionsEqual`, `areOpenPositionListsEqual`, `EQUALITY_CHECKS`)

- [ ] **Step 1: Create `src/utils/core/async.ts`**

  Copy `sleep` and `timedPromise` from `src/utils/index.ts`. Export both.

- [ ] **Step 2: Create `src/utils/core/arrays.ts`**

  Copy `chunks` (canonical implementation from utils/index.ts:813-818) and `glueArray` from `src/utils/index.ts`. Export both.

- [ ] **Step 3: Create `src/utils/core/data-structures.ts`**

  Copy `Ref`, `Counter`, `MultiSwitch` classes from `src/utils/index.ts`. Export all.

- [ ] **Step 4: Create `src/utils/core/cache.ts`**

  Copy `uiStringCache`, `MAX_UI_STRING_CACHE_SIZE`, `getCachedUiString` from `src/common-ui-utils/commonUiUtils.ts:43-86`. Export `getCachedUiString` (the cache itself is module-private state).

- [ ] **Step 5: Create `src/utils/core/fetch.ts`**

  Copy `encodeQueryParams` from `src/utils/fetch.ts`.

- [ ] **Step 6: Create `src/utils/core/serialization.ts`**

  Copy `getStringifiableObjectEntry` (private), `encodeStringifiableObject`, `decodeStringifiableObject` from `src/utils/index.ts:38-136`.

- [ ] **Step 7: Create `src/utils/core/equality.ts`**

  Copy entire content of `src/utils/equalityChecks.ts`. Update import of `ENUM_UTILS` to import from `../enum` (which will be created in Task 3).

- [ ] **Step 8: Create `src/utils/core/index.ts`**

  Barrel file re-exporting everything from all sub-modules.

- [ ] **Step 9: Verify types compile**

  Run: `npx tsc --noEmit --project tsconfig.json 2>&1 | head -30`
  Note: This will have errors since we haven't wired up the barrel yet — that's expected. We're just checking the individual files compile in isolation.

- [ ] **Step 10: Commit**

  ```bash
  git add src/utils/core/
  git commit -m "refactor(common-ts): create utils/core module with universal utilities"
  ```

---

## Task 2: Create `utils/math/` module

Extract math utilities from `src/utils/math.ts` and `src/utils/index.ts`.

**Files:**
- Create: `src/utils/math/numbers.ts`
- Create: `src/utils/math/bn.ts`
- Create: `src/utils/math/bignum.ts`
- Create: `src/utils/math/precision.ts`
- Create: `src/utils/math/spread.ts`
- Create: `src/utils/math/price.ts`
- Create: `src/utils/math/sort.ts`
- Create: `src/utils/math/index.ts`

**Source mapping:**
- `numbers.ts`: `calculateMean` (utils/index.ts:720), `calculateMedian` (utils/index.ts:725), `calculateStandardDeviation` (utils/index.ts:735), `calculateZScore` (utils/index.ts:709), `getPctCompletion` (utils/math.ts:115), `roundToDecimal` (utils/math.ts:205), `aprFromApy` (utils/index.ts:669)
- `bn.ts`: `bnMin`, `bnMax`, `bnMean`, `bnMedian` (utils/index.ts:763-801), `sortBnAsc`, `sortBnDesc` (utils/math.ts:126-134)
- `bignum.ts`: `roundBigNumToDecimalPlace` (utils/math.ts:212), `getBigNumRoundedToStepSize` (utils/math.ts:136)
- `precision.ts`: `TRADE_PRECISION` (utils/math.ts:113), `roundToStepSize`, `roundToStepSizeIfLargeEnough`, `truncateInputToPrecision`, `valueIsBelowStepSize`, `numbersFitEvenly` (utils/math.ts:141-203), `dividesExactly` (utils/index.ts:645)
- `spread.ts`: `calculateMarkPrice`, `calculateBidAskAndmarkPrice`, `calculateSpreadQuote` (private), `calculateSpreadPct` (private), `calculateSpread`, `calculateSpreadBidAskMark` (utils/math.ts:10-111)
- `price.ts`: `getPriceForBaseAndQuoteAmount`, `getPriceForOrderRecord`, `getPriceForUIOrderRecord` (utils/index.ts:343-379), `calculateAverageEntryPrice` (common-ui-utils/commonUiUtils.ts:342-356)
- `sort.ts`: `getTieredSortScore` (utils/index.ts:686), `sortRecordsByTs` (utils/math.ts:221)

- [ ] **Step 1: Create all files in `src/utils/math/`**

  Extract functions per the source mapping above. Each file should import what it needs from `@drift-labs/sdk`.

- [ ] **Step 2: Create `src/utils/math/index.ts` barrel**

  Re-export everything from all sub-modules.

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/math/
  git commit -m "refactor(common-ts): create utils/math module"
  ```

---

## Task 3: Create `utils/enum/` module

**Files:**
- Create: `src/utils/enum/index.ts`

**Source:** Copy content from `src/utils/enum.ts` into `src/utils/enum/index.ts`.

- [ ] **Step 1: Create `src/utils/enum/index.ts`**

  Copy content from `src/utils/enum.ts`. No changes needed to the code itself.

- [ ] **Step 2: Commit**

  ```bash
  git add src/utils/enum/
  git commit -m "refactor(common-ts): create utils/enum module"
  ```

---

## Task 4: Create `utils/strings/` module

**Files:**
- Create: `src/utils/strings/format.ts`
- Create: `src/utils/strings/parse.ts`
- Create: `src/utils/strings/convert.ts`
- Create: `src/utils/strings/status.ts`
- Create: `src/utils/strings/index.ts`

**Source mapping:**
- `format.ts`: `abbreviateAddress` (common-ui-utils/commonUiUtils.ts:92 — uses `getCachedUiString` from `../core/cache`), `abbreviateAccountName` (utils/strings.ts:6), `trimTrailingZeros` (common-ui-utils/commonUiUtils.ts:954), `toSnakeCase` (utils/index.ts:657), `toCamelCase` (utils/index.ts:660), `normalizeBaseAssetSymbol` (utils/index.ts:699)
- `parse.ts`: `splitByCapitalLetters`, `lowerCaseNonFirstWords`, `disallowNegativeStringInput` (utils/strings.ts:25-42), `isValidBase58` (utils/strings.ts:3)
- `convert.ts`: `toPrintableObject`, `convertStringValuesToNumbers`, `extractStringValuesFromObject` (utils/strings.ts:69-152)
- `status.ts`: `LAST_ORDER_STATUS_LABELS` (note: not currently exported in source — add `export` keyword), `LastOrderStatus`, `LastOrderStatusLabel`, `lastOrderStatusToNormalEng` (utils/strings.ts:47-64)

- [ ] **Step 1: Create all files in `src/utils/strings/`**

  In `format.ts`, import `getCachedUiString` from `../core/cache`. The `abbreviateAddress` function depends on it.

- [ ] **Step 2: Create `src/utils/strings/index.ts` barrel**

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/strings/
  git commit -m "refactor(common-ts): create utils/strings module"
  ```

---

## Task 5: Create `utils/validation/` module

**Files:**
- Create: `src/utils/validation/index.ts`
- Create: `src/utils/validation/address.ts`
- Create: `src/utils/validation/notional.ts`
- Create: `src/utils/validation/input.ts`

**Source mapping:**
- `address.ts`: all content from `src/utils/validation.ts` (re-exports `isValidBase58` from `../strings/parse`)
- `notional.ts`: `isNotionalDust` from `src/utils/validation.ts:3`
- `input.ts`: `formatTokenInputCurried` from `src/common-ui-utils/commonUiUtils.ts:974`

- [ ] **Step 1: Create all files in `src/utils/validation/`**

  Split current `validation.ts` content: address-related goes to `address.ts`, `isNotionalDust` goes to `notional.ts`, `formatTokenInputCurried` comes from `common-ui-utils/commonUiUtils.ts`.

- [ ] **Step 2: Create `src/utils/validation/index.ts` barrel**

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/validation/
  git commit -m "refactor(common-ts): create utils/validation module"
  ```

---

## Task 6: Create `utils/token/` module

**Files:**
- Create: `src/utils/token/address.ts`
- Create: `src/utils/token/account.ts`
- Create: `src/utils/token/instructions.ts`
- Create: `src/utils/token/index.ts`

**Source mapping:**
- `address.ts`: `getTokenAddress` from both `utils/token.ts:17` (string params) and `common-ui-utils/commonUiUtils.ts:808` (PublicKey params) — keep both, export with overloads or separate names (`getTokenAddress` for PublicKey, `getTokenAddressFromStrings` or simply both). Also `getTokenAddressForDepositAndWithdraw` from `utils/token.ts:36`.
- `account.ts`: `getTokenAccount` from `common-ui-utils/commonUiUtils.ts:822` (richer version with warning), `getBalanceFromTokenAccountResult` from `common-ui-utils/commonUiUtils.ts:815`. Also keep the string-based version from `utils/token.ts:52` as a separate function.
- `instructions.ts`: `createTokenAccountIx` from `utils/token.ts:81`, re-exports of `TOKEN_PROGRAM_ID` and `createTransferCheckedInstruction` from `utils/token.ts:12-15`.

- [ ] **Step 1: Create all files in `src/utils/token/`**

  For deduplication: keep both `getTokenAddress` signatures (string params and PublicKey params) in `address.ts`. Name the PublicKey version `getTokenAddress` and add a `getTokenAddressFromStrings` wrapper for the string version, or keep both with different parameter overloads.

  Similarly for `getTokenAccount`: keep the richer version (with warning detection) from `commonUiUtils.ts` as the primary, and keep the simpler string-based version from `token.ts` alongside it.

- [ ] **Step 2: Create `src/utils/token/index.ts` barrel**

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/token/
  git commit -m "refactor(common-ts): create utils/token module with deduplicated functions"
  ```

---

## Task 7: Create `utils/trading/` module

**Files:**
- Create: `src/utils/trading/auction.ts`
- Create: `src/utils/trading/pnl.ts`
- Create: `src/utils/trading/liquidation.ts`
- Create: `src/utils/trading/leverage.ts`
- Create: `src/utils/trading/lp.ts`
- Create: `src/utils/trading/price.ts`
- Create: `src/utils/trading/size.ts`
- Create: `src/utils/trading/index.ts`

**Source mapping:**
- `auction.ts`: `getMarketAuctionParams`, `getLimitAuctionParams`, `deriveMarketOrderParams`, `getPriceObject` (common-ui-utils/commonUiUtils.ts:395-772)
- `pnl.ts`: `calculatePnlPctFromPosition`, `calculatePotentialProfit`, `POTENTIAL_PROFIT_DEFAULT_STATE` (common-ui-utils/trading.ts:21-149)
- `liquidation.ts`: `calculateLiquidationPriceAfterPerpTrade` (common-ui-utils/trading.ts:162-275)
- `leverage.ts`: `convertLeverageToMarginRatio`, `convertMarginRatioToLeverage`, `getMarginUsedForPosition`, `validateLeverageChange` (common-ui-utils/trading.ts:277-486)
- `lp.ts`: `getLpSharesAmountForQuote`, `getQuoteValueForLpShares` (common-ui-utils/commonUiUtils.ts:775-806)
- `price.ts`: `getMarketOrderLimitPrice`, `checkIsMarketOrderType` (common-ui-utils/commonUiUtils.ts:358-393, common-ui-utils/trading.ts:154-156)
- `size.ts`: `getMarketTickSize`, `getMarketTickSizeDecimals`, `getMarketStepSize`, `getMarketStepSizeDecimals`, `isEntirePositionOrder`, `getMaxLeverageOrderSize`, `formatOrderSize` (common-ui-utils/trading.ts:295-409)

Note: `auction.ts` imports `getMarketOrderLimitPrice` from `./price` and `getPriceObject` is used by `deriveMarketOrderParams`, so they must be in the same file or `auction.ts` imports from `./price`.

- [ ] **Step 1: Create all files in `src/utils/trading/`**

  Key internal dependency: `deriveMarketOrderParams` calls `getMarketOrderLimitPrice` and `getPriceObject`. Put `getPriceObject` in `auction.ts` alongside `deriveMarketOrderParams` since it's only used there. Import `getMarketOrderLimitPrice` from `./price`.

  `calculatePnlPctFromPosition` in `pnl.ts` calls `convertMarginRatioToLeverage` from `./leverage`.

- [ ] **Step 2: Create `src/utils/trading/index.ts` barrel**

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/trading/
  git commit -m "refactor(common-ts): create utils/trading module"
  ```

---

## Task 8: Create `utils/markets/` module

**Files:**
- Create: `src/utils/markets/config.ts`
- Create: `src/utils/markets/leverage.ts`
- Create: `src/utils/markets/operations.ts`
- Create: `src/utils/markets/interest.ts`
- Create: `src/utils/markets/balances.ts`
- Create: `src/utils/markets/index.ts`

**Source mapping:**
- `config.ts`: `getMarketConfig`, `getBaseAssetSymbol` (common-ui-utils/market.ts:19-123)
- `leverage.ts`: `getMaxLeverageForMarket`, `getMaxLeverageForMarketAccount` (common-ui-utils/market.ts:125-206)
- `operations.ts`: `getPausedOperations`, `PerpOperationsMap`, `SpotOperationsMap`, `InsuranceFundOperationsMap` (common-ui-utils/market.ts:29-99)
- `interest.ts`: `getCurrentOpenInterestForMarket`, `getDepositAprForMarket`, `getBorrowAprForMarket` (utils/index.ts:493-574)
- `balances.ts`: `getTotalBorrowsForMarket`, `getTotalDepositsForMarket` (utils/index.ts:576-637)

Note: `src/utils/markets/precisions.ts` already exists and stays unchanged.

- [ ] **Step 1: Create all files in `src/utils/markets/`**

- [ ] **Step 2: Create `src/utils/markets/index.ts` barrel**

  Re-export from all sub-modules AND the existing `./precisions` file.

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/markets/
  git commit -m "refactor(common-ts): create utils/markets module"
  ```

---

## Task 9: Create `utils/orders/` module

**Files:**
- Create: `src/utils/orders/labels.ts`
- Create: `src/utils/orders/filters.ts`
- Create: `src/utils/orders/sort.ts`
- Create: `src/utils/orders/oracle.ts`
- Create: `src/utils/orders/flags.ts`
- Create: `src/utils/orders/misc.ts`
- Create: `src/utils/orders/index.ts`

**Source mapping:**
- `labels.ts`: `getOrderLabelFromOrderDetails`, `getUIOrderTypeFromSdkOrderType` (common-ui-utils/order.ts:34-214)
- `filters.ts`: `orderActionRecordIsTrade`, `uiOrderActionRecordIsTrade`, `filterTradeRecordsFromOrderActionRecords`, `filterTradeRecordsFromUIOrderRecords`, `isOrderTriggered` (utils/index.ts:313-335, common-ui-utils/order.ts:291-314)
- `sort.ts`: `getSortScoreForOrderRecords`, `getSortScoreForOrderActionRecords`, `sortUIMatchedOrderRecordAndAction`, `sortUIOrderActionRecords`, `sortUIOrderRecords`, `sortOrderRecords`, `getLatestOfTwoUIOrderRecords`, `getLatestOfTwoOrderRecords`, `getUIOrderRecordsLaterThanTarget`, `getChronologicalValueForOrderAction` (private) (utils/index.ts:138-310). Also types: `PartialOrderActionRecord`, `PartialUISerializableOrderActionRecord`, `PartialOrderActionEventRecord`.
- `oracle.ts`: `getLimitPriceFromOracleOffset`, `isAuctionEmpty` (common-ui-utils/order.ts:130-153)
- `flags.ts`: `getPerpOrderParamsBitFlags`, `getPerpAuctionDuration`, `HighLeverageOptions` type (common-ui-utils/order.ts:217-289)
- `misc.ts`: `orderIsNull`, `getTradeInfoFromActionRecord`, `getAnchorEnumString` (utils/index.ts:163-390)

- [ ] **Step 1: Create all files in `src/utils/orders/`**

  Key: `sort.ts` needs types `PartialOrderActionRecord`, `PartialUISerializableOrderActionRecord`, `PartialOrderActionEventRecord` moved alongside it.

- [ ] **Step 2: Create `src/utils/orders/index.ts` barrel**

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/orders/
  git commit -m "refactor(common-ts): create utils/orders module"
  ```

---

## Task 10: Create `utils/positions/` module

**Files:**
- Create: `src/utils/positions/open.ts`
- Create: `src/utils/positions/user.ts`
- Create: `src/utils/positions/index.ts`

**Source mapping:**
- `open.ts`: `getOpenPositionData` (common-ui-utils/user.ts:32-206)
- `user.ts`: `checkIfUserAccountExists`, `getUserMaxLeverageForMarket` (common-ui-utils/user.ts:208-313)

Note: `getOpenPositionData` calls `TRADING_UTILS.calculatePotentialProfit`. Update to import directly: `import { calculatePotentialProfit } from '../trading/pnl'`.

- [ ] **Step 1: Create all files in `src/utils/positions/`**

- [ ] **Step 2: Create `src/utils/positions/index.ts` barrel**

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/positions/
  git commit -m "refactor(common-ts): create utils/positions module"
  ```

---

## Task 11: Create `utils/accounts/` module

**Files:**
- Create: `src/utils/accounts/init.ts`
- Create: `src/utils/accounts/keys.ts`
- Create: `src/utils/accounts/subaccounts.ts`
- Create: `src/utils/accounts/wallet.ts`
- Create: `src/utils/accounts/signature.ts`
- Create: `src/utils/accounts/multiple.ts`
- Create: `src/utils/accounts/index.ts`

**Source mapping:**
- `init.ts`: `initializeAndSubscribeToNewUserAccount`, `awaitAccountInitializationChainState`, `updateUserAccount` (private), `ACCOUNT_INITIALIZATION_RETRY_DELAY_MS`, `ACCOUNT_INITIALIZATION_RETRY_ATTEMPTS` (common-ui-utils/commonUiUtils.ts:88-271). Imports `sleep` from `../core/async`.
- `keys.ts`: `getUserKey`, `getIdAndAuthorityFromKey`, `getMarketKey` (common-ui-utils/commonUiUtils.ts:104-274). Imports `getCachedUiString` from `../core/cache`.
- `subaccounts.ts`: `fetchCurrentSubaccounts`, `fetchUserClientsAndAccounts`, `userExists` (common-ui-utils/commonUiUtils.ts:130-941)
- `wallet.ts`: all content from `src/utils/WalletConnectionState.ts` + `createPlaceholderIWallet` (common-ui-utils/commonUiUtils.ts:280-305)
- `signature.ts`: `getSignatureVerificationMessageForSettings`, `verifySignature`, `hashSignature`, `compareSignatures` (common-ui-utils/commonUiUtils.ts:307-338)
- `multiple.ts`: `getMultipleAccounts`, `getMultipleAccountsCore`, `getMultipleAccountsInfoChunked` (common-ui-utils/commonUiUtils.ts:870-924, utils/index.ts:820-829). Uses `chunks` from `../core/arrays`.

- [ ] **Step 1: Create all files in `src/utils/accounts/`**

- [ ] **Step 2: Move `src/common-ui-utils/settings/settings.ts` to `src/utils/settings/settings.ts`**

  Copy the file to `src/utils/settings/settings.ts`. This must happen before Task 13 deletes `src/common-ui-utils/`. The file has no imports from `common-ui-utils/` so no import path changes are needed.

  ```bash
  mkdir -p src/utils/settings
  cp src/common-ui-utils/settings/settings.ts src/utils/settings/settings.ts
  ```

- [ ] **Step 3: Create `src/utils/accounts/index.ts` barrel**

- [ ] **Step 4: Commit**

  ```bash
  git add src/utils/accounts/ src/utils/settings/
  git commit -m "refactor(common-ts): create utils/accounts module, move settings to utils/"
  ```

---

## Task 12: Create deprecation facades in `src/_deprecated/`

**Files:**
- Create: `src/_deprecated/utils.ts`
- Create: `src/_deprecated/common-ui-utils.ts`
- Create: `src/_deprecated/common-math.ts`
- Create: `src/_deprecated/equality-checks.ts`
- Create: `src/_deprecated/trading-utils.ts`
- Create: `src/_deprecated/market-utils.ts`
- Create: `src/_deprecated/order-utils.ts`
- Create: `src/_deprecated/user-utils.ts`

Each file reconstructs the original namespace object by importing from new module locations.

- [ ] **Step 1: Create `src/_deprecated/utils.ts`**

  Reconstruct `COMMON_UTILS` exactly matching the shape from `src/utils/index.ts:831-861`. Import each function from its new canonical location.

  ```typescript
  import { getIfVaultBalance, getIfStakingVaultApr } from '../utils/insuranceFund';
  import { getCurrentOpenInterestForMarket, getDepositAprForMarket, getBorrowAprForMarket } from '../utils/markets/interest';
  import { getTotalBorrowsForMarket, getTotalDepositsForMarket } from '../utils/markets/balances';
  import { dividesExactly } from '../utils/math/precision';
  import { toSnakeCase, toCamelCase, normalizeBaseAssetSymbol } from '../utils/strings/format';
  import { getTieredSortScore } from '../utils/math/sort';
  import { calculateZScore, calculateMean, calculateMedian } from '../utils/math/numbers';
  import { glueArray, chunks } from '../utils/core/arrays';
  import { timedPromise } from '../utils/core/async';
  import { bnMax, bnMin, bnMean, bnMedian } from '../utils/math/bn';
  import { getMultipleAccountsInfoChunked } from '../utils/accounts/multiple';

  /** @deprecated Use direct imports from '@drift-labs/common/utils/math' etc. */
  export const COMMON_UTILS = {
    getIfVaultBalance, getIfStakingVaultApr,
    getCurrentOpenInterestForMarket, getDepositAprForMarket, getBorrowAprForMarket,
    getTotalBorrowsForMarket, getTotalDepositsForMarket,
    dividesExactly, toSnakeCase, toCamelCase, getTieredSortScore, normalizeBaseAssetSymbol,
    calculateZScore, glueArray, timedPromise, chunks, getMultipleAccountsInfoChunked,
    MATH: {
      NUM: { mean: calculateMean, median: calculateMedian },
      BN: { bnMax, bnMin, bnMean, bnMedian },
    },
  };
  ```

- [ ] **Step 2: Create `src/_deprecated/trading-utils.ts`**

  Reconstruct `TRADING_UTILS` matching shape from `src/common-ui-utils/trading.ts:488-504`.

- [ ] **Step 3: Create `src/_deprecated/market-utils.ts`**

  Reconstruct `MARKET_UTILS` matching shape from `src/common-ui-utils/market.ts:208-217`.

- [ ] **Step 4: Create `src/_deprecated/order-utils.ts`**

  Reconstruct `ORDER_COMMON_UTILS` matching shape from `src/common-ui-utils/order.ts:316-324`.

- [ ] **Step 5: Create `src/_deprecated/user-utils.ts`**

  Reconstruct `USER_UTILS` matching shape from `src/common-ui-utils/user.ts:315-319`.

- [ ] **Step 6: Create `src/_deprecated/common-ui-utils.ts`**

  Reconstruct `COMMON_UI_UTILS` matching shape from `src/common-ui-utils/commonUiUtils.ts:1011-1045`. Import individual functions from new modules and spread in the sub-namespace utils.

- [ ] **Step 7: Create `src/_deprecated/common-math.ts`**

  Reconstruct `COMMON_MATH` matching shape from `src/utils/math.ts:232-234`:
  ```typescript
  import { calculateSpreadBidAskMark } from '../utils/math/spread';
  /** @deprecated Use direct import from '@drift-labs/common/utils/math' */
  export const COMMON_MATH = { calculateSpreadBidAskMark };
  ```

- [ ] **Step 8: Create `src/_deprecated/equality-checks.ts`**

  Re-export `EQUALITY_CHECKS` from `../utils/core/equality`.

- [ ] **Step 9: Commit**

  ```bash
  git add src/_deprecated/
  git commit -m "refactor(common-ts): create deprecation facades for backwards compatibility"
  ```

---

## Task 13: Create new `utils/index.ts` barrel, rewrite `src/index.ts`, fix all internal imports, delete old files

**Files:**
- Create: `src/utils/index.ts` (new barrel re-exporting all domain modules)
- Modify: `src/index.ts` (complete rewrite)
- Modify: `src/utils/superstake.ts` (import update: `aprFromApy`)
- Modify: any `src/drift/` files importing from `../utils` or `../common-ui-utils`
- Delete: old source files (see list below)

- [ ] **Step 1: Create new `src/utils/index.ts` barrel**

  This barrel re-exports all domain modules so that existing `from '../utils'` imports still resolve. This is critical for minimizing import path breakage.

  ```typescript
  export * from './math';
  export * from './strings';
  export * from './enum';
  export * from './validation';
  export * from './token';
  export * from './trading';
  export * from './markets';
  export * from './orders';
  export * from './positions';
  export * from './accounts';
  export * from './core';
  ```

- [ ] **Step 2: Rewrite `src/index.ts`**

  Replace the entire barrel with the new structure from the spec. See `src/index.ts (Main Barrel)` section in the design spec. Include `export * from './utils/insuranceFund'` so `getIfVaultBalance` and `getIfStakingVaultApr` remain available as direct named exports.

- [ ] **Step 3: Fix ALL internal imports before deleting old files**

  Search the entire `src/` tree for imports from old paths and update them. Key files:

  **Within `src/utils/` itself:**
  - `src/utils/superstake.ts`: change `import { aprFromApy } from '../utils'` → `import { aprFromApy } from './math/numbers'`
  - Any other `src/utils/*.ts` file importing from `'.'` or `'./index'` or `'../utils'`

  **Within `src/drift/`:**
  - `src/drift/cli.ts` (or similar): `ENUM_UTILS` from `'../utils'` → `'../utils/enum'`
  - Any file importing `sleep` from `'../utils'` → `'../utils/core/async'` (or just `'../utils/core'`)

  **Search commands:**
  ```bash
  grep -rn "from '\.\./utils'" src/ --include="*.ts" | grep -v node_modules
  grep -rn "from '\.\./common-ui-utils'" src/ --include="*.ts" | grep -v node_modules
  grep -rn "from '\./commonUiUtils'" src/ --include="*.ts" | grep -v node_modules
  grep -rn "from '\.'" src/utils/ --include="*.ts" | grep -v node_modules
  ```

  Note: Many of these imports will continue to work via the new `src/utils/index.ts` barrel. Only imports that reference deleted files directly (like `from '../utils/index'`, `from '../common-ui-utils'`, `from '../common-ui-utils/commonUiUtils'`) **must** be updated.

- [ ] **Step 4: Delete old source files**

  ```bash
  rm -rf src/common-ui-utils/
  rm src/utils/equalityChecks.ts
  rm src/utils/fetch.ts
  rm src/utils/WalletConnectionState.ts
  rm src/utils/enum.ts
  rm src/utils/strings.ts
  rm src/utils/validation.ts
  rm src/utils/token.ts
  rm src/utils/math.ts
  ```

  Note: Do NOT delete `src/utils/index.ts` — it was replaced in Step 1 with the new barrel.

- [ ] **Step 5: Run TypeScript compiler**

  Run: `npx tsc --noEmit`
  Fix all errors. Common issues will be:
  - Missing imports from old paths
  - Circular dependency issues
  - Duplicate identifier errors

- [ ] **Step 6: Run tests**

  Run: `npm test`
  All 114 tests should pass.

- [ ] **Step 7: Commit**

  ```bash
  git add -A
  git commit -m "refactor(common-ts): rewrite barrels, fix internal imports, delete old files"
  ```

---

## Task 14: Update test imports

**Files:**
- Modify: `tests/utils/stringUtils.test.ts`
- Modify: `tests/utils/orders.test.ts`
- Modify: `tests/utils/enumUtils.test.ts`
- Modify: `tests/utils/candles.test.ts`
- Modify: `tests/utils/equalityChecks.test.ts`
- Modify: `tests/drift/Drift/clients/CentralServerDrift/driftClientContextWrapper.test.ts`

No changes needed for: `tests/utils/math.test.ts` (barrel still works), `tests/utils/CircularBuffer.test.ts` (`CircularBuffers/` is unchanged).

- [ ] **Step 1: Update test imports to use new paths**

  - `stringUtils.test.ts`: change `from '../../src/common-ui-utils/commonUiUtils'` → `from '../../src/utils/strings'` (barrel re-exports `abbreviateAddress`, `trimTrailingZeros`). Keep `from '../../src/utils/strings'` for `abbreviateAccountName`.
  - `orders.test.ts`: change `from '../../src/common-ui-utils/commonUiUtils'` → `from '../../src/_deprecated/common-ui-utils'` (tests use `COMMON_UI_UTILS` namespace)
  - `enumUtils.test.ts`: change `from '../../src/utils'` → `from '../../src/utils/enum'`
  - `candles.test.ts`: change `from '../../src/utils'` → import `PartialUISerializableOrderActionRecord` from `'../../src/utils/orders'` (use barrel, not specific file)
  - `equalityChecks.test.ts`: change `from '../../src/utils/equalityChecks'` → `from '../../src/utils/core/equality'`
  - `driftClientContextWrapper.test.ts`: change `from '../../../../../src/utils'` → `from '../../../../../src/utils/core'` (imports `sleep`)

- [ ] **Step 2: Run tests**

  Run: `npm test`
  All 114 tests should pass.

- [ ] **Step 3: Commit**

  ```bash
  git add tests/
  git commit -m "refactor(common-ts): update test imports for new module structure"
  ```

---

## Task 15: Update `package.json` with exports and typesVersions

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `exports` field to `package.json`**

  Add the full exports map with `types` and `default` conditions for each subpath as specified in the design spec.

- [ ] **Step 2: Add `typesVersions` field**

  Add the `typesVersions` fallback for `moduleResolution: "node"` consumers as specified in the design spec.

- [ ] **Step 3: Run build**

  Run: `npm run build`
  Verify `lib/` output contains all expected directories and files.

- [ ] **Step 4: Verify subpath exports resolve**

  Manually check that `lib/utils/math/index.js` and `lib/utils/math/index.d.ts` exist.

- [ ] **Step 5: Commit**

  ```bash
  git add package.json
  git commit -m "refactor(common-ts): add subpath exports and typesVersions to package.json"
  ```

---

## Task 16: Check for circular dependencies and final verification

- [ ] **Step 1: Run circular dependency check**

  Run: `npm run circular-deps`
  (This runs `bunx madge --circular --extensions ts,tsx src`)

  If cycles are found, resolve them by adjusting imports.

- [ ] **Step 2: Run full build**

  Run: `npm run build`

- [ ] **Step 3: Run all tests**

  Run: `npm test`

- [ ] **Step 4: Verify deprecated exports work**

  Create a temporary test file that imports `COMMON_UI_UTILS`, `COMMON_UTILS`, `TRADING_UTILS`, `MARKET_UTILS`, `ORDER_COMMON_UTILS`, `USER_UTILS`, `COMMON_MATH`, `EQUALITY_CHECKS` from the main barrel and verify they have the expected members.

- [ ] **Step 5: Final commit**

  ```bash
  git add -A
  git commit -m "refactor(common-ts): finalize utils restructure, verify no circular deps"
  ```
