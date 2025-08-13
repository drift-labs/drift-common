import {
	BigNum,
	DriftClient,
	MarketType,
	ReferrerInfo,
	ZERO,
} from '@drift-labs/sdk';
import { PublicKey, TransactionSignature } from '@solana/web3.js';
import { MARKET_UTILS } from '../../../../common-ui-utils/market';
import { getTokenAddressForDepositAndWithdraw } from '../../../../utils/token';
import { USER_UTILS } from '../../../../common-ui-utils/user';
import { MAIN_POOL_ID } from '../../../../constants';
import { TRADING_UTILS } from '../../../../common-ui-utils/trading';
import { UserAccountCache } from '../../stores/UserAccountCache';

/**
 * Interface for deposit operation parameters.
 */
export interface DepositParams {
	subAccountId: number;
	amount: BigNum;
	spotMarketIndex: number;
	isMaxBorrowRepayment?: boolean;
}

/**
 * Interface for withdraw operation parameters.
 */
export interface WithdrawParams {
	subAccountId: number;
	amount: BigNum;
	spotMarketIndex: number;
	allowBorrow?: boolean;
	isMax?: boolean;
}

/**
 * Interface for create user and deposit operation parameters.
 */
export interface CreateUserAndDepositParams {
	depositAmount: BigNum;
	depositSpotMarketIndex: number;
	name?: string;
	maxLeverage?: number;
	poolId?: number;
	subAccountId?: number;
	referrerName?: string;
}

/**
 * Interface for perp market order parameters.
 */
export interface PerpOrderParams {
	marketIndex: number;
	direction: 'long' | 'short';
	baseAssetAmount: BigNum;
	price?: BigNum;
	orderType: 'market' | 'limit';
	subAccountId?: number;
	reduceOnly?: boolean;
	postOnly?: boolean;
}

/**
 * Interface for swap operation parameters.
 */
export interface SwapParams {
	fromMarketIndex: number;
	toMarketIndex: number;
	amount: BigNum;
	subAccountId?: number;
	minReceiveAmount?: BigNum;
}

/**
 * Interface for settle PnL operation parameters.
 */
export interface SettlePnlParams {
	subAccountId: number;
	marketIndex: number;
	counterpartySubAccountId?: number;
}

/**
 * Handles all trading operations for the Drift protocol including deposits,
 * withdrawals, position management, and settlement operations.
 *
 * This class encapsulates the trading logic and provides a clean API for
 * executing various trading operations while handling common patterns like
 * token address resolution and transaction preparation.
 */
export class TradingOperations {
	/**
	 * Creates a new TradingOperations instance.
	 *
	 * @param driftClient - The DriftClient instance for executing transactions
	 * @param userAccountCache - Cache for user account data updates
	 */
	constructor(
		private driftClient: DriftClient,
		private userAccountCache: UserAccountCache
	) {}

	/**
	 * Fetches referrer information for a given referrer name.
	 *
	 * This method looks up referrer account data to enable referral rewards
	 * when creating new user accounts.
	 *
	 * @param referrerName - The name of the referrer to look up
	 * @returns Promise resolving to ReferrerInfo or null if not found
	 */
	private async getReferrerInfo(
		referrerName: string
	): Promise<ReferrerInfo | null> {
		if (!referrerName) {
			return null;
		}

		const referrerNameAccount = await this.driftClient.fetchReferrerNameAccount(
			referrerName
		);

		if (referrerNameAccount) {
			return {
				referrer: referrerNameAccount.user,
				referrerStats: referrerNameAccount.userStats,
			};
		} else {
			return null;
		}
	}

	/**
	 * Creates a new user account and deposits initial collateral.
	 *
	 * This method handles the complete onboarding flow for new users including:
	 * - Validating that the subaccount doesn't already exist
	 * - Resolving referrer information if provided
	 * - Getting the correct token address for deposits
	 * - Creating the user account with custom leverage settings
	 * - Subscribing to the new user's account updates
	 *
	 * @param params - The parameters for user creation and initial deposit
	 * @returns Promise resolving to transaction signature and user account public key
	 *
	 * @throws Error if subaccount already exists
	 *
	 * @example
	 * ```typescript
	 * const result = await tradingOps.createUserAndDeposit({
	 *   depositAmount: new BigNum(100),
	 *   depositSpotMarketIndex: 0, // USDC
	 *   name: "Trading Account",
	 *   maxLeverage: 5,
	 *   subAccountId: 0
	 * });
	 * ```
	 */
	async createUserAndDeposit(params: CreateUserAndDepositParams): Promise<{
		txSig: TransactionSignature;
		userAccountPublicKey: PublicKey;
	}> {
		const {
			depositAmount,
			depositSpotMarketIndex,
			name,
			maxLeverage,
			poolId = MAIN_POOL_ID,
			subAccountId,
			referrerName,
		} = params;

		const spotMarketConfig = MARKET_UTILS.getMarketConfig(
			this.driftClient.env,
			MarketType.SPOT,
			depositSpotMarketIndex
		);

		const referrerInfoPromise = this.getReferrerInfo(referrerName);
		const subaccountExistsPromise = USER_UTILS.checkIfUserAccountExists(
			this.driftClient,
			{
				type: 'subAccountId',
				subAccountId,
				authority: this.driftClient.wallet.publicKey,
			}
		);
		const associatedDepositTokenAddressPromise =
			getTokenAddressForDepositAndWithdraw(
				spotMarketConfig.mint,
				this.driftClient.wallet.publicKey
			);

		const [referrerInfo, subaccountExists, associatedDepositTokenAddress] =
			await Promise.all([
				referrerInfoPromise,
				subaccountExistsPromise,
				associatedDepositTokenAddressPromise,
			]);

		if (subaccountExists) {
			throw new Error('Subaccount already exists');
		}

		const newAccountName = name ?? `Account ${subAccountId}`;
		const customMaxMarginRatio = TRADING_UTILS.convertLeverageToMarginRatio(
			maxLeverage ?? 0
		);

		const [txSig, userAccountPublicKey] =
			await this.driftClient.initializeUserAccountAndDepositCollateral(
				depositAmount.val,
				associatedDepositTokenAddress,
				depositSpotMarketIndex,
				subAccountId,
				newAccountName,
				undefined, // donation amount
				referrerInfo,
				ZERO,
				undefined, // tx params
				customMaxMarginRatio,
				poolId
			);

		await this.driftClient.addUser(
			subAccountId,
			this.driftClient.wallet.publicKey
		); // adds user to driftclient's user map, subscribes to user account data
		const user = this.driftClient.getUser(
			subAccountId,
			this.driftClient.wallet.publicKey
		);

		user.eventEmitter.on('update', () => {
			this.userAccountCache.updateUserAccount(user);
		});

		return {
			txSig,
			userAccountPublicKey,
		};
	}

	/**
	 * Deposits collateral into a user's spot market position.
	 *
	 * This method handles depositing tokens into a user's account, with optional
	 * support for max borrow repayment scenarios where the deposit amount may be
	 * over-estimated to ensure complete repayment of borrowed funds.
	 *
	 * @param params - The deposit parameters
	 * @returns Promise resolving to the transaction signature
	 *
	 * @example
	 * ```typescript
	 * const txSig = await tradingOps.deposit({
	 *   subAccountId: 0,
	 *   amount: new BigNum(50),
	 *   spotMarketIndex: 0, // USDC
	 *   isMaxBorrowRepayment: false
	 * });
	 * ```
	 */
	async deposit(params: DepositParams): Promise<TransactionSignature> {
		const { subAccountId, amount, spotMarketIndex, isMaxBorrowRepayment } =
			params;

		const spotMarketConfig = MARKET_UTILS.getMarketConfig(
			this.driftClient.env,
			MarketType.SPOT,
			spotMarketIndex
		);

		const authority = this.driftClient.wallet.publicKey;
		const associatedDepositTokenAddress =
			await getTokenAddressForDepositAndWithdraw(
				spotMarketConfig.mint,
				authority
			);

		let finalDepositAmount = amount;

		if (isMaxBorrowRepayment) {
			// we over-estimate to ensure that there is no borrow dust left
			// since isMaxBorrowRepayment = reduceOnly, it is safe to over-estimate
			finalDepositAmount = finalDepositAmount.scale(2, 1);
		}

		return this.driftClient.deposit(
			finalDepositAmount.val,
			spotMarketIndex,
			associatedDepositTokenAddress,
			subAccountId,
			isMaxBorrowRepayment
		);
	}

	/**
	 * Withdraws collateral from a user's spot market position.
	 *
	 * This method handles withdrawing tokens from a user's account with options
	 * for borrowing (if allowBorrow is true) or reduce-only withdrawals. For max
	 * withdrawals with reduce-only, the amount is over-estimated to ensure
	 * complete withdrawal.
	 *
	 * @param params - The withdrawal parameters
	 * @returns Promise resolving to the transaction signature
	 *
	 * @example
	 * ```typescript
	 * const txSig = await tradingOps.withdraw({
	 *   subAccountId: 0,
	 *   amount: new BigNum(25),
	 *   spotMarketIndex: 0, // USDC
	 *   allowBorrow: false,
	 *   isMax: false
	 * });
	 * ```
	 */
	async withdraw(params: WithdrawParams): Promise<TransactionSignature> {
		const {
			subAccountId,
			amount,
			spotMarketIndex,
			allowBorrow = false,
			isMax = false,
		} = params;

		const spotMarketConfig = MARKET_UTILS.getMarketConfig(
			this.driftClient.env,
			MarketType.SPOT,
			spotMarketIndex
		);

		const authority = this.driftClient.wallet.publicKey;
		const associatedDepositTokenAddress =
			await getTokenAddressForDepositAndWithdraw(
				spotMarketConfig.mint,
				authority
			);

		const reduceOnly = !allowBorrow;

		let finalWithdrawAmount = amount;
		if (isMax && reduceOnly) {
			// we over-estimate to ensure that there is no borrow dust left
			// since reduceOnly is true, it is safe to over-estimate
			finalWithdrawAmount = finalWithdrawAmount.scale(2, 1);
		}

		return this.driftClient.withdraw(
			finalWithdrawAmount.val,
			spotMarketIndex,
			associatedDepositTokenAddress,
			reduceOnly,
			subAccountId
		);
	}

	/**
	 * Opens a perpetual market order (placeholder for future implementation).
	 *
	 * This method will handle opening long or short positions in perpetual markets
	 * with support for market and limit orders, reduce-only orders, and post-only orders.
	 *
	 * @param params - The perp order parameters
	 * @returns Promise resolving to the transaction signature
	 *
	 * @example
	 * ```typescript
	 * const txSig = await tradingOps.openPerpMarketOrder({
	 *   marketIndex: 0, // SOL-PERP
	 *   direction: 'long',
	 *   baseAssetAmount: new BigNum(1), // 1 SOL
	 *   orderType: 'market',
	 *   subAccountId: 0
	 * });
	 * ```
	 */
	async openPerpMarketOrder(
		_params: PerpOrderParams
	): Promise<TransactionSignature> {
		// TODO: Implement perp market order functionality
		throw new Error('openPerpMarketOrder not yet implemented');
	}

	/**
	 * Executes a swap between two spot markets (placeholder for future implementation).
	 *
	 * This method will handle swapping between different spot markets through
	 * the Drift protocol's swap functionality.
	 *
	 * @param params - The swap parameters
	 * @returns Promise resolving to the transaction signature
	 *
	 * @example
	 * ```typescript
	 * const txSig = await tradingOps.executeSwap({
	 *   fromMarketIndex: 0, // USDC
	 *   toMarketIndex: 1,   // SOL
	 *   amount: new BigNum(100),
	 *   subAccountId: 0,
	 *   minReceiveAmount: new BigNum(0.5)
	 * });
	 * ```
	 */
	async swap(_params: SwapParams): Promise<TransactionSignature> {
		// TODO: Implement swap functionality
		throw new Error('executeSwap not yet implemented');
	}

	/**
	 * Settles profit and loss for a perpetual position (placeholder for future implementation).
	 *
	 * This method will handle settling PnL between users or with the insurance fund
	 * for perpetual market positions.
	 *
	 * @param params - The settle PnL parameters
	 * @returns Promise resolving to the transaction signature
	 *
	 * @example
	 * ```typescript
	 * const txSig = await tradingOps.settlePnl({
	 *   subAccountId: 0,
	 *   marketIndex: 0, // SOL-PERP
	 *   counterpartySubAccountId: 1
	 * });
	 * ```
	 */
	async settlePnl(_params: SettlePnlParams): Promise<TransactionSignature> {
		// TODO: Implement settle PnL functionality
		throw new Error('settlePnl not yet implemented');
	}
}
