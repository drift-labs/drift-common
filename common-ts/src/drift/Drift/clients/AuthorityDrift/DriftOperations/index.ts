import {
	BigNum,
	DriftClient,
	JupiterClient,
	MarketType,
	MAX_LEVERAGE_ORDER_SIZE,
	QuoteResponse,
	SwapMode,
	TxParams,
	User,
	UserStatsAccount,
	ZERO,
} from '@drift-labs/sdk';
import { TransactionSignature } from '@solana/web3.js';
import { MARKET_UTILS } from '../../../../../common-ui-utils/market';
import { MAIN_POOL_ID } from '../../../../../constants';
import { TRADING_UTILS } from '../../../../../common-ui-utils/trading';
import { UserAccountCache } from '../../../stores/UserAccountCache';
import { createDepositTxn } from '../../../../base/actions/spot/deposit';
import { createUserAndDepositCollateralBaseTxn } from '../../../../base/actions/user/create';
import { createWithdrawTxn } from '../../../../base/actions/spot/withdraw';
import { deleteUserTxn } from '../../../../base/actions/user/delete';
import { createSettlePnlTxn } from '../../../../base/actions/perp/settlePnl';
import {
	CreateUserAndDepositParams,
	DepositParams,
	WithdrawParams,
	PerpOrderParams,
	SwapParams,
	SettleAccountPnlParams,
	CancelOrdersParams,
} from './types';
import { createCancelOrdersTxn } from '../../../../base/actions/trade/cancelOrder';
import {
	createOpenPerpMarketOrder,
	OpenPerpMarketOrderParams,
} from '../../../../base/actions/trade/openPerpOrder/openPerpMarketOrder';
import { createSwapTxn } from '../../../../base/actions/trade/swap';
import { createOpenPerpNonMarketOrder } from '../../../../base/actions/trade/openPerpOrder/openPerpNonMarketOrder';

/**
 * Handles majority of the relevant operations on the Drift program including deposits,
 * withdrawals, position management, and trading operations.
 *
 * This class encapsulates the trading logic and provides a clean API for
 * executing various trading operations while handling common patterns like
 * token address resolution and transaction preparation.
 */
export class DriftOperations {
	static readonly DEFAULT_TX_PARAMS: TxParams = {
		computeUnitsPrice: 50_000,
		useSimulatedComputeUnits: true,
		computeUnitsBufferMultiplier: 1.3,
	};

	static readonly MAX_COMPUTE_UNITS_PRICE = 1e15 / 10 / 1_400_000; // 1e15 = 1 SOL worth of micro lamports; 1e15 / 10 = 0.1 SOL worth of micro lamports; 1.4M = max compute units;

	/**
	 * Creates a new DriftOperations instance.
	 *
	 * @param driftClient - The DriftClient instance for executing transactions
	 * @param getUserAccountCache - Function to get the user account cache. We lazily load the user account cache, so that we always get the latest user account data.
	 * @param getPriorityFee - Function to get current priority fee in micro lamports
	 */
	constructor(
		private driftClient: DriftClient,
		private getUserAccountCache: () => UserAccountCache,
		private dlobServerHttpUrl: string,
		private swiftServerUrl: string,
		private getPriorityFee: () => number
	) {}

	/**
	 * Gets transaction parameters with dynamic priority fees.
	 * Falls back to default if priority fee function is not available.
	 */
	private getTxParams(overrides?: Partial<TxParams>): TxParams {
		const unsafePriorityFee = Math.floor(
			this.getPriorityFee() ??
				DriftOperations.DEFAULT_TX_PARAMS.computeUnitsPrice
		);

		const safePriorityFee = Math.min(
			unsafePriorityFee,
			DriftOperations.MAX_COMPUTE_UNITS_PRICE
		);

		return {
			...DriftOperations.DEFAULT_TX_PARAMS,
			computeUnitsPrice: safePriorityFee,
			...overrides,
		};
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
		user: User;
	}> {
		const {
			depositAmount,
			depositSpotMarketIndex,
			newAccountName,
			maxLeverage,
			poolId = MAIN_POOL_ID,
			referrerName,
		} = params;

		const spotMarketConfig = MARKET_UTILS.getMarketConfig(
			this.driftClient.env,
			MarketType.SPOT,
			depositSpotMarketIndex
		);

		const customMaxMarginRatio = TRADING_UTILS.convertLeverageToMarginRatio(
			maxLeverage ?? 0
		);

		let userStatsAccount: UserStatsAccount | undefined = undefined;

		try {
			userStatsAccount = this.driftClient.userStats?.getAccount();
		} catch (error) {
			// ignore
		}

		const { transaction, subAccountId } =
			await createUserAndDepositCollateralBaseTxn({
				driftClient: this.driftClient,
				amount: depositAmount.val,
				spotMarketConfig: spotMarketConfig,
				authority: this.driftClient.wallet.publicKey,
				userStatsAccount: userStatsAccount,
				accountName: newAccountName,
				referrerName,
				customMaxMarginRatio,
				poolId,
				txParams: this.getTxParams(),
			});

		const { txSig } = await this.driftClient.sendTransaction(transaction);

		await this.driftClient.addUser(
			subAccountId,
			this.driftClient.wallet.publicKey
		); // adds user to driftclient's user map, subscribes to user account data
		const user = this.driftClient.getUser(
			subAccountId,
			this.driftClient.wallet.publicKey
		);

		user.eventEmitter.on('update', () => {
			this.getUserAccountCache().updateUserAccount(user);
		});

		return {
			txSig,
			user,
		};
	}

	/**
	 * Deletes a user account.
	 *
	 * This method removes a user's sub-account from the Drift.
	 *
	 * @param subAccountId - The ID of the sub-account to delete
	 * @returns A promise that resolves to the transaction signature of the deletion
	 *
	 * @throws {Error} When the user account is not found in the cache
	 *
	 * @example
	 * ```typescript
	 * // Delete user sub-account with ID 0
	 * const txSignature = await tradingOps.deleteUser(0);
	 * console.log('User deleted with transaction:', txSignature);
	 * ```
	 */
	async deleteUser(subAccountId: number): Promise<TransactionSignature> {
		const user = this.getUserAccountCache().getUser(
			subAccountId,
			this.driftClient.wallet.publicKey
		);

		if (!user) {
			throw new Error('User not found');
		}

		const deleteTxn = await deleteUserTxn({
			driftClient: this.driftClient,
			userPublicKey: user.userClient.userAccountPublicKey,
			txParams: this.getTxParams(),
		});

		const { txSig } = await this.driftClient.sendTransaction(deleteTxn);

		return txSig;
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

		const user = this.getUserAccountCache().getUser(
			subAccountId,
			this.driftClient.wallet.publicKey
		);

		if (!user) {
			throw new Error('User not found');
		}

		const depositTxn = await createDepositTxn({
			driftClient: this.driftClient,
			user: user.userClient,
			amount: amount,
			spotMarketConfig: spotMarketConfig,
			isMaxBorrowRepayment,
			txParams: this.getTxParams(),
		});

		const { txSig } = await this.driftClient.sendTransaction(depositTxn);

		return txSig;
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
			isBorrow = false,
			isMax = false,
		} = params;

		const spotMarketConfig = MARKET_UTILS.getMarketConfig(
			this.driftClient.env,
			MarketType.SPOT,
			spotMarketIndex
		);

		const accountData = this.getUserAccountCache().getUser(
			subAccountId,
			this.driftClient.wallet.publicKey
		);

		if (!accountData) {
			throw new Error('User not found');
		}

		const withdrawTxn = await createWithdrawTxn({
			driftClient: this.driftClient,
			amount,
			spotMarketConfig,
			user: accountData.userClient,
			isBorrow,
			isMax,
			txParams: this.getTxParams(),
		});

		const { txSig } = await this.driftClient.sendTransaction(withdrawTxn);

		return txSig;
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
	async openPerpOrder(
		params: PerpOrderParams
	): Promise<TransactionSignature | void> {
		const accountData = this.getUserAccountCache().getUser(
			params.subAccountId,
			this.driftClient.wallet.publicKey
		);

		if (!accountData) {
			throw new Error('User not found');
		}

		const user = accountData.userClient;

		const processBracketOrders = (bracketOrdersInput?: {
			takeProfitPrice?: BigNum;
			stopLossPrice?: BigNum;
		}) => {
			const bracketOrders: OpenPerpMarketOrderParams['bracketOrders'] = {};

			if (bracketOrdersInput?.takeProfitPrice) {
				bracketOrders.takeProfit = {
					triggerPrice: bracketOrdersInput.takeProfitPrice.val,
					baseAssetAmount: params.size.val,
				};
			}

			if (bracketOrdersInput?.stopLossPrice) {
				bracketOrders.stopLoss = {
					triggerPrice: bracketOrdersInput.stopLossPrice.val,
					baseAssetAmount: params.size.val,
				};
			}

			return bracketOrders;
		};

		const amountBN = params.isMaxLeverage
			? MAX_LEVERAGE_ORDER_SIZE
			: params.size.val;

		switch (params.orderConfig.orderType) {
			case 'market': {
				const useSwift = !params.orderConfig.disableSwift;

				const bracketOrders = processBracketOrders(
					params.orderConfig.bracketOrders
				);

				// we split the logic for SWIFT and non-SWIFT orders to achieve better type inference
				if (useSwift) {
					const swiftOrderResult = await createOpenPerpMarketOrder({
						driftClient: this.driftClient,
						user,
						assetType: params.assetType,
						useSwift: true,
						swiftOptions: {
							// @ts-ignore TODO: we might want to add signMessage to the IWallet interface
							wallet: this.driftClient.wallet,
							swiftServerUrl: this.swiftServerUrl,
							...params.orderConfig.swiftOptions,
						},
						direction: params.direction,
						amount: amountBN,
						bracketOrders,
						dlobServerHttpUrl: this.dlobServerHttpUrl,
						marketIndex: params.marketIndex,
						optionalAuctionParamsInputs:
							params.orderConfig.optionalAuctionParamsInputs,
					});

					return swiftOrderResult;
				} else {
					const result = await createOpenPerpMarketOrder({
						driftClient: this.driftClient,
						user,
						assetType: params.assetType,
						marketIndex: params.marketIndex,
						direction: params.direction,
						amount: amountBN,
						bracketOrders,
						optionalAuctionParamsInputs:
							params.orderConfig.optionalAuctionParamsInputs,
						dlobServerHttpUrl: this.dlobServerHttpUrl,
						useSwift: false,
					});

					const { txSig } = await this.driftClient.sendTransaction(result);

					return txSig;
				}
			}
			case 'limit': {
				const useSwift = !params.orderConfig.disableSwift;

				const bracketOrders = processBracketOrders(
					params.orderConfig.bracketOrders
				);

				// we split the logic for SWIFT and non-SWIFT orders to achieve better type inference
				if (useSwift) {
					const swiftOrderResult = await createOpenPerpNonMarketOrder({
						driftClient: this.driftClient,
						user,
						direction: params.direction,
						marketIndex: params.marketIndex,
						amount: amountBN,
						assetType: params.assetType,
						orderConfig: {
							orderType: 'limit',
							limitPrice: params.orderConfig.limitPrice.val,
							bracketOrders,
						},
						reduceOnly: params.reduceOnly,
						postOnly: params.postOnly,
						useSwift: true,
						swiftOptions: {
							// @ts-ignore TODO: we might want to add signMessage to the IWallet interface
							wallet: this.driftClient.wallet,
							swiftServerUrl: this.swiftServerUrl,
							...params.orderConfig.swiftOptions,
						},
					});

					return swiftOrderResult;
				} else {
					const txn = await createOpenPerpNonMarketOrder({
						driftClient: this.driftClient,
						user,
						direction: params.direction,
						marketIndex: params.marketIndex,
						amount: amountBN,
						assetType: params.assetType,
						orderConfig: {
							orderType: 'limit',
							limitPrice: params.orderConfig.limitPrice.val,
							bracketOrders,
						},
						reduceOnly: params.reduceOnly,
						postOnly: params.postOnly,
						useSwift: false,
						txParams: this.getTxParams(),
					});

					const { txSig } = await this.driftClient.sendTransaction(txn);

					return txSig;
				}
			}
			case 'takeProfit':
			case 'stopLoss': {
				const txn = await createOpenPerpNonMarketOrder({
					driftClient: this.driftClient,
					user,
					direction: params.direction,
					marketIndex: params.marketIndex,
					amount: amountBN,
					assetType: params.assetType,
					orderConfig: {
						orderType: params.orderConfig.orderType,
						triggerPrice: params.orderConfig.triggerPrice.val,
						limitPrice: params.orderConfig.limitPrice?.val ?? ZERO,
					},
					reduceOnly: params.reduceOnly,
					useSwift: false,
					txParams: this.getTxParams(),
				});

				const { txSig } = await this.driftClient.sendTransaction(txn);

				return txSig;
			}
			case 'oracleLimit': {
				const txn = await createOpenPerpNonMarketOrder({
					driftClient: this.driftClient,
					user,
					direction: params.direction,
					marketIndex: params.marketIndex,
					amount: amountBN,
					assetType: params.assetType,
					orderConfig: {
						orderType: 'oracleLimit',
						oraclePriceOffset: params.orderConfig.oraclePriceOffset.val,
					},
					reduceOnly: params.reduceOnly,
					useSwift: false,
					txParams: this.getTxParams(),
				});

				const { txSig } = await this.driftClient.sendTransaction(txn);

				return txSig;
			}
			default: {
				const _exhaustiveCheck: never = params.orderConfig;
				throw new Error('Invalid order type');
			}
		}
	}

	async getSwapQuote(
		params: Omit<SwapParams, 'jupiterQuote'> & {
			slippageBps?: number;
			swapMode?: SwapMode;
			onlyDirectRoutes?: boolean;
		}
	): Promise<QuoteResponse> {
		const jupiterClient = new JupiterClient({
			connection: this.driftClient.connection,
		});

		const inputMint = MARKET_UTILS.getMarketConfig(
			this.driftClient.env,
			MarketType.SPOT,
			params.fromMarketIndex
		).mint;
		const outputMint = MARKET_UTILS.getMarketConfig(
			this.driftClient.env,
			MarketType.SPOT,
			params.toMarketIndex
		).mint;

		const jupiterQuote = await jupiterClient.getQuote({
			inputMint,
			outputMint,
			amount: params.amount.val,
			slippageBps: params.slippageBps,
			swapMode: params.swapMode,
			onlyDirectRoutes: params.onlyDirectRoutes,
		});

		return jupiterQuote;
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
	async swap(params: SwapParams): Promise<TransactionSignature> {
		const accountData = this.getUserAccountCache().getUser(
			params.subAccountId,
			this.driftClient.wallet.publicKey
		);

		if (!accountData) {
			throw new Error('User not found');
		}

		const jupiterClient = new JupiterClient({
			connection: this.driftClient.connection,
		});

		const jupiterQuote = params.jupiterQuote
			? params.jupiterQuote
			: await this.getSwapQuote(params);

		const swapTxn = await createSwapTxn({
			driftClient: this.driftClient,
			jupiterClient,
			user: accountData.userClient,
			swapFromMarketIndex: params.fromMarketIndex,
			swapToMarketIndex: params.toMarketIndex,
			amount: params.amount.val,
			quote: jupiterQuote,
			txParams: this.getTxParams(),
		});

		const { txSig } = await this.driftClient.sendTransaction(swapTxn);

		return txSig;
	}

	/**
	 * Settles P&L and funding for all perp position.
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
	async settleAccountPnl(
		params: SettleAccountPnlParams
	): Promise<TransactionSignature> {
		const { subAccountId } = params;

		const accountData = this.getUserAccountCache().getUser(
			subAccountId,
			this.driftClient.wallet.publicKey
		);

		if (!accountData) {
			throw new Error('User not found');
		}

		const marketIndexes = accountData.openPerpPositions.map(
			(position) => position.marketIndex
		);

		const settlePnlTxn = await createSettlePnlTxn({
			driftClient: this.driftClient,
			user: accountData.userClient,
			marketIndexes,
			txParams: this.getTxParams(),
		});

		const { txSig } = await this.driftClient.sendTransaction(settlePnlTxn);

		return txSig;
	}

	async cancelOrders(
		params: CancelOrdersParams
	): Promise<TransactionSignature> {
		const { subAccountId, orderIds } = params;

		const accountData = this.getUserAccountCache().getUser(
			subAccountId,
			this.driftClient.wallet.publicKey
		);

		if (!accountData) {
			throw new Error('User not found');
		}

		const cancelOrdersTxn = await createCancelOrdersTxn(
			this.driftClient,
			accountData.userClient,
			orderIds,
			this.getTxParams()
		);

		const { txSig } = await this.driftClient.sendTransaction(cancelOrdersTxn);

		return txSig;
	}
}

/**
 * TODO:
 * - transfer between subaccounts
 * - close position?
 * - close multiple positions
 * - edit open order
 * - create user only
 *
 * - open spot order
 * - rename subaccount
 * - withdraw dust positions
 */
