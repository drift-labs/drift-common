import {
	BigNum,
	BN,
	CustomizedCadenceBulkAccountLoader,
	DelistedMarketSetting,
	DevnetPerpMarkets,
	DevnetSpotMarkets,
	DRIFT_PROGRAM_ID,
	DriftClient,
	DriftClientConfig,
	DriftEnv,
	fetchUserStatsAccount,
	getMarketsAndOraclesForSubscription,
	MainnetPerpMarkets,
	MainnetSpotMarkets,
	MarketType,
	OneShotUserAccountSubscriber,
	OrderTriggerCondition,
	PerpMarketConfig,
	PositionDirection,
	PriorityFeeMethod,
	PriorityFeeSubscriber,
	PriorityFeeSubscriberConfig,
	PublicKey,
	SpotMarketConfig,
	SwapMode,
	TxParams,
	UnifiedQuoteResponse,
	UnifiedSwapClient,
	User,
	WhileValidTxSender,
} from '@drift-labs/sdk';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { COMMON_UI_UTILS } from '../../../../common-ui-utils/commonUiUtils';
import {
	DEFAULT_ACCOUNT_LOADER_COMMITMENT,
	DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS,
	DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY,
	DEFAULT_TX_SENDER_RETRY_INTERVAL,
	HIGH_ACTIVITY_MARKET_ACCOUNTS,
} from '../../constants';
import { createDepositTxn } from '../../../base/actions/spot/deposit';
import { createWithdrawTxn } from '../../../base/actions/spot/withdraw';
import { createSettleFundingTxn } from '../../../base/actions/perp/settleFunding';
import { createSettlePnlTxn } from '../../../base/actions/perp/settlePnl';
import { createOpenPerpMarketOrder } from '../../../base/actions/trade/openPerpOrder/openPerpMarketOrder';
import {
	createOpenPerpNonMarketOrder,
	OpenPerpNonMarketOrderParams,
} from '../../../base/actions/trade/openPerpOrder/openPerpNonMarketOrder';
import { createEditOrderTxn } from '../../../base/actions/trade/editOrder';
import { createCancelOrdersTxn } from '../../../base/actions/trade/cancelOrder';
import { createSwapTxn } from '../../../base/actions/trade/swap';
import { createUserAndDepositCollateralBaseTxn } from '../../../base/actions/user/create';
import { deleteUserTxn } from '../../../base/actions/user/delete';
import { TxnOrSwiftResult } from '../../../base/actions/trade/openPerpOrder/types';
import { WithTxnParams } from '../../../base/types';
import { EnvironmentConstants } from '../../../../EnvironmentConstants';
import {
	CentralServerGetOpenPerpMarketOrderTxnParams,
	CentralServerGetOpenPerpNonMarketOrderTxnParams,
} from './types';
import { CentralServerDriftMarkets } from './markets';
import { DriftOperations } from '../AuthorityDrift/DriftOperations';

/**
 * A Drift client that fetches user data on-demand, while market data is continuously subscribed to.
 *
 * This is useful for an API server that fetches user data on-demand, and return transaction messages specific to a given user
 */
export class CentralServerDrift {
	private _driftClient: DriftClient;
	private _perpMarketConfigs: PerpMarketConfig[];
	private _spotMarketConfigs: SpotMarketConfig[];
	/**
	 * The public endpoints that can be used to retrieve Drift data / interact with the Drift program.
	 */
	private _driftEndpoints: {
		dlobServerHttpUrl: string;
		swiftServerUrl: string;
	};

	/**
	 * Handles priority fee tracking and calculation for optimized transaction costs.
	 */
	private priorityFeeSubscriber!: PriorityFeeSubscriber;

	public readonly markets: CentralServerDriftMarkets;

	/**
	 * @param solanaRpcEndpoint - The Solana RPC endpoint to use for reading RPC data.
	 * @param driftEnv - The drift environment to use for the drift client.
	 * @param supportedPerpMarkets - The perp markets indexes to support. See https://github.com/drift-labs/protocol-v2/blob/master/sdk/src/constants/perpMarkets.ts for all available markets. It is recommended to only include markets that will be used.
	 * @param supportedSpotMarkets - The spot markets indexes to support. See https://github.com/drift-labs/protocol-v2/blob/master/sdk/src/constants/spotMarkets.ts for all available markets. It is recommended to only include markets that will be used.
	 */
	constructor(config: {
		solanaRpcEndpoint: string;
		driftEnv: DriftEnv;
		supportedPerpMarkets: number[];
		supportedSpotMarkets: number[];
		additionalDriftClientConfig?: Partial<Omit<DriftClientConfig, 'env'>>;
		priorityFeeSubscriberConfig?: Partial<PriorityFeeSubscriberConfig>;
	}) {
		const driftEnv = config.driftEnv;

		const connection = new Connection(config.solanaRpcEndpoint);
		const driftProgramID = new PublicKey(DRIFT_PROGRAM_ID);
		const accountLoader = new CustomizedCadenceBulkAccountLoader(
			connection,
			DEFAULT_ACCOUNT_LOADER_COMMITMENT,
			DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS
		);

		const wallet = COMMON_UI_UTILS.createPlaceholderIWallet(); // use random wallet to initialize a central-server instance

		const allPerpMarketConfigs =
			driftEnv === 'devnet' ? DevnetPerpMarkets : MainnetPerpMarkets;
		const allSpotMarketConfigs =
			driftEnv === 'devnet' ? DevnetSpotMarkets : MainnetSpotMarkets;
		this._perpMarketConfigs = config.supportedPerpMarkets.map((marketIndex) =>
			allPerpMarketConfigs.find((market) => market.marketIndex === marketIndex)
		);
		this._spotMarketConfigs = config.supportedSpotMarkets.map((marketIndex) =>
			allSpotMarketConfigs.find((market) => market.marketIndex === marketIndex)
		);

		const oracleInfos = getMarketsAndOraclesForSubscription(
			driftEnv,
			this._perpMarketConfigs,
			this._spotMarketConfigs
		);

		const driftClientConfig: DriftClientConfig = {
			env: driftEnv,
			connection,
			wallet,
			programID: driftProgramID,
			enableMetricsEvents: false,
			accountSubscription: {
				type: 'polling',
				accountLoader,
			},
			userStats: false,
			includeDelegates: false,
			skipLoadUsers: true,
			delistedMarketSetting: DelistedMarketSetting.Unsubscribe,
			perpMarketIndexes: this._perpMarketConfigs.map(
				(market) => market.marketIndex
			),
			spotMarketIndexes: this._spotMarketConfigs.map(
				(market) => market.marketIndex
			),
			oracleInfos: oracleInfos.oracleInfos,
			...config.additionalDriftClientConfig,
		};
		this._driftClient = new DriftClient(driftClientConfig);
		this.markets = new CentralServerDriftMarkets(this._driftClient);

		const txSender = new WhileValidTxSender({
			connection,
			wallet,
			additionalConnections: [],
			additionalTxSenderCallbacks: [],
			txHandler: this._driftClient.txHandler,
			confirmationStrategy: DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY,
			retrySleep: DEFAULT_TX_SENDER_RETRY_INTERVAL,
		});

		this._driftClient.txSender = txSender;

		// set up Drift endpoints
		const driftDlobServerHttpUrlToUse =
			EnvironmentConstants.dlobServerHttpUrl[
				config.driftEnv === 'devnet' ? 'dev' : 'mainnet'
			];
		const swiftServerUrlToUse =
			EnvironmentConstants.swiftServerUrl[
				config.driftEnv === 'devnet' ? 'staging' : 'mainnet'
			];
		this._driftEndpoints = {
			dlobServerHttpUrl: driftDlobServerHttpUrlToUse,
			swiftServerUrl: swiftServerUrlToUse,
		};

		const priorityFeeConfig: PriorityFeeSubscriberConfig = {
			connection: this.driftClient.connection,
			priorityFeeMethod: PriorityFeeMethod.SOLANA,
			addresses: HIGH_ACTIVITY_MARKET_ACCOUNTS,
			...config.priorityFeeSubscriberConfig,
		};

		this.priorityFeeSubscriber = new PriorityFeeSubscriber(priorityFeeConfig);
	}

	public get driftClient() {
		return this._driftClient;
	}

	public async subscribe() {
		await this._driftClient.subscribe();
		await this.priorityFeeSubscriber.subscribe();
	}

	public async unsubscribe() {
		await this._driftClient.unsubscribe();
		await this.priorityFeeSubscriber.unsubscribe();
	}

	/**
	 * Manages DriftClient state for transaction creation with proper setup and cleanup.
	 * This abstraction handles:
	 * - User creation and subscription
	 * - Authority management
	 * - Wallet replacement for correct transaction signing
	 * - Cleanup and state restoration
	 *
	 * @param userAccountPublicKey - The user account public key
	 * @param operation - The transaction creation operation to execute
	 * @returns The result of the operation
	 */
	private async driftClientContextWrapper<T>(
		userAccountPublicKey: PublicKey,
		operation: (user: User) => Promise<T>,
		externalWallet?: PublicKey
	): Promise<T> {
		const user = new User({
			driftClient: this._driftClient,
			userAccountPublicKey,
			accountSubscription: {
				type: 'custom',
				userAccountSubscriber: new OneShotUserAccountSubscriber(
					this._driftClient.program,
					userAccountPublicKey,
					undefined,
					undefined
				),
			},
		});

		// Store original state
		const originalWallet = this._driftClient.wallet;
		const originalAuthority = this._driftClient.authority;

		try {
			// Setup: Subscribe to user and configure DriftClient
			await user.subscribe();

			const authority = user.getUserAccount().authority;
			this._driftClient.authority = authority;

			const success = await this._driftClient.addUser(
				user.getUserAccount().subAccountId,
				authority
			);

			if (!success) {
				throw new Error('Failed to add user to DriftClient');
			}

			// Replace wallet with user's authority to ensure correct transaction signing
			// This is necessary because DriftClient adds wallet.publicKey to instructions
			const userWallet = {
				publicKey: externalWallet ?? authority,
				signTransaction: () =>
					Promise.reject(
						'This is a placeholder - do not sign with this wallet'
					),
				signAllTransactions: () =>
					Promise.reject(
						'This is a placeholder - do not sign with this wallet'
					),
			};

			// Update wallet in all places that reference it
			this._driftClient.wallet = userWallet;
			//@ts-ignore
			this._driftClient.provider.wallet = userWallet;
			this._driftClient.txHandler.updateWallet(userWallet);

			// Execute the operation
			const result = await operation(user);

			return result;
		} finally {
			// Cleanup: Always restore original state and unsubscribe
			this._driftClient.wallet = originalWallet;
			this._driftClient.txHandler.updateWallet(originalWallet);
			this._driftClient.authority = originalAuthority;

			try {
				await user.unsubscribe();
				this._driftClient.users.clear();
			} catch (cleanupError) {
				console.warn('Error during cleanup:', cleanupError);
				// Don't throw cleanup errors, but log them
			}
		}
	}

	/**
	 * Returns a User object for a given user account public key. This fetches the user account data once.
	 *
	 * You may read more about the User object [here](https://github.com/drift-labs/protocol-v2/blob/master/sdk/src/user.ts)
	 *
	 * @param userAccountPublicKey - The user account public key
	 */
	public async getUser(userAccountPublicKey: PublicKey): Promise<User> {
		const oneShotUserAccountSubscriber = new OneShotUserAccountSubscriber(
			this._driftClient.program,
			userAccountPublicKey,
			undefined,
			undefined
		);
		const user = new User({
			driftClient: this._driftClient,
			userAccountPublicKey,
			accountSubscription: {
				type: 'custom',
				userAccountSubscriber: oneShotUserAccountSubscriber,
			},
		});
		await user.subscribe();
		return user;
	}

	/**
	 * Gets transaction parameters with dynamic priority fees.
	 * Falls back to default if priority fee function is not available.
	 */
	getTxParams(overrides?: Partial<TxParams>): TxParams {
		const unsafePriorityFee = Math.floor(
			this.priorityFeeSubscriber.getCustomStrategyResult() ??
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

	public async getCreateAndDepositTxn(
		authority: PublicKey,
		amount: BN,
		spotMarketIndex: number,
		options?: {
			referrerName?: string;
			accountName?: string;
			poolId?: number;
			fromSubAccountId?: number;
			customMaxMarginRatio?: number;
			txParams?: TxParams;
		}
	): Promise<{
		transaction: VersionedTransaction | Transaction;
		userAccountPublicKey: PublicKey;
		subAccountId: number;
	}> {
		const spotMarketConfig = this._spotMarketConfigs.find(
			(market) => market.marketIndex === spotMarketIndex
		);

		if (!spotMarketConfig) {
			throw new Error(
				`Spot market config not found for index ${spotMarketIndex}`
			);
		}

		const userStatsAccount = await fetchUserStatsAccount(
			this._driftClient.connection,
			this._driftClient.program,
			authority
		);

		const originalWallet = this._driftClient.wallet;
		const originalAuthority = this._driftClient.authority;

		const authorityWallet = {
			publicKey: authority,
			signTransaction: () =>
				Promise.reject('This is a placeholder - do not sign with this wallet'),
			signAllTransactions: () =>
				Promise.reject('This is a placeholder - do not sign with this wallet'),
		};

		try {
			this._driftClient.wallet = authorityWallet;
			// @ts-ignore
			this._driftClient.provider.wallet = authorityWallet;
			this._driftClient.txHandler.updateWallet(authorityWallet);
			this._driftClient.authority = authority;

			return await createUserAndDepositCollateralBaseTxn({
				driftClient: this._driftClient,
				amount,
				spotMarketConfig,
				authority,
				userStatsAccount,
				referrerName: options?.referrerName,
				accountName: options?.accountName,
				poolId: options?.poolId,
				fromSubAccountId: options?.fromSubAccountId,
				customMaxMarginRatio: options?.customMaxMarginRatio,
				txParams: options?.txParams ?? this.getTxParams(),
			});
		} finally {
			this._driftClient.wallet = originalWallet;
			this._driftClient.txHandler.updateWallet(originalWallet);
			// @ts-ignore
			this._driftClient.provider.wallet = originalWallet;
			this._driftClient.authority = originalAuthority;
		}
	}

	public async getDepositTxn(
		userAccountPublicKey: PublicKey,
		amount: BN,
		spotMarketIndex: number,
		options?: {
			txParams?: TxParams;
			/**
			 * Optional external wallet to deposit from. If provided, the deposit will be made
			 * from this wallet instead of the user's authority wallet.
			 */
			externalWallet?: PublicKey;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const spotMarketConfig = this._spotMarketConfigs.find(
					(market) => market.marketIndex === spotMarketIndex
				);

				if (!spotMarketConfig) {
					throw new Error(
						`Spot market config not found for index ${spotMarketIndex}`
					);
				}

				const depositTxn = await createDepositTxn({
					driftClient: this._driftClient,
					user,
					amount: BigNum.from(amount, spotMarketConfig.precisionExp),
					spotMarketConfig,
					txParams: options?.txParams ?? this.getTxParams(),
					externalWallet: options?.externalWallet,
				});

				return depositTxn;
			},
			options?.externalWallet
		);
	}

	public async getDeleteUserTxn(
		userAccountPublicKey: PublicKey,
		options?: {
			txParams?: TxParams;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(userAccountPublicKey, async () => {
			return deleteUserTxn({
				driftClient: this._driftClient,
				userPublicKey: userAccountPublicKey,
				txParams: options?.txParams ?? this.getTxParams(),
			});
		});
	}

	public async getWithdrawTxn(
		userAccountPublicKey: PublicKey,
		amount: BN,
		spotMarketIndex: number,
		options?: {
			isBorrow?: boolean;
			isMax?: boolean;
			txParams?: TxParams;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const spotMarketConfig = this._spotMarketConfigs.find(
					(market) => market.marketIndex === spotMarketIndex
				);

				if (!spotMarketConfig) {
					throw new Error(
						`Spot market config not found for index ${spotMarketIndex}`
					);
				}

				const withdrawTxn = await createWithdrawTxn({
					driftClient: this._driftClient,
					user,
					amount: BigNum.from(amount, spotMarketConfig.precisionExp),
					spotMarketConfig,
					isBorrow: options?.isBorrow,
					isMax: options?.isMax,
					txParams: options?.txParams ?? this.getTxParams(),
				});

				return withdrawTxn;
			}
		);
	}

	public async getSettleFundingTxn(
		userAccountPublicKey: PublicKey,
		options?: {
			txParams?: TxParams;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const settleFundingTxn = await createSettleFundingTxn({
					driftClient: this._driftClient,
					user,
					txParams: options?.txParams ?? this.getTxParams(),
				});

				return settleFundingTxn;
			}
		);
	}

	public async getSettlePnlTxn(
		userAccountPublicKey: PublicKey,
		marketIndexes: number[],
		options?: {
			txParams?: TxParams;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const settlePnlTxn = await createSettlePnlTxn({
					driftClient: this._driftClient,
					user,
					marketIndexes,
					txParams: options?.txParams ?? this.getTxParams(),
				});

				return settlePnlTxn;
			}
		);
	}

	// overloads for better type inference
	public async getOpenPerpMarketOrderTxn(
		params: CentralServerGetOpenPerpMarketOrderTxnParams<true>
	): Promise<void>;
	public async getOpenPerpMarketOrderTxn(
		params: CentralServerGetOpenPerpMarketOrderTxnParams<false>
	): Promise<Transaction | VersionedTransaction>;
	public async getOpenPerpMarketOrderTxn<T extends boolean>({
		userAccountPublicKey,
		...rest
	}: CentralServerGetOpenPerpMarketOrderTxnParams<T>): Promise<
		TxnOrSwiftResult<T>
	> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user): Promise<TxnOrSwiftResult<T>> => {
				const {
					useSwift,
					swiftOptions,
					placeAndTake,
					txParams,
					...otherProps
				} = rest;

				if (useSwift) {
					const swiftOrderResult = await createOpenPerpMarketOrder({
						useSwift: true,
						swiftOptions: {
							...swiftOptions,
							swiftServerUrl: this._driftEndpoints.swiftServerUrl,
						},
						driftClient: this._driftClient,
						user,
						dlobServerHttpUrl: this._driftEndpoints.dlobServerHttpUrl,
						txParams: txParams ?? this.getTxParams(),
						...otherProps,
					});
					return swiftOrderResult as TxnOrSwiftResult<T>;
				} else {
					const openPerpMarketOrderTxn = await createOpenPerpMarketOrder({
						placeAndTake,
						useSwift: false,
						driftClient: this._driftClient,
						user,
						dlobServerHttpUrl: this._driftEndpoints.dlobServerHttpUrl,
						txParams: txParams ?? this.getTxParams(),
						...otherProps,
					});
					return openPerpMarketOrderTxn as TxnOrSwiftResult<T>;
				}
			}
		);
	}

	/**
	 * Create a perp non-market order with amount and asset type
	 */
	public async getOpenPerpNonMarketOrderTxn(
		params: CentralServerGetOpenPerpNonMarketOrderTxnParams<true>
	): Promise<void>;
	public async getOpenPerpNonMarketOrderTxn(
		params: CentralServerGetOpenPerpNonMarketOrderTxnParams<false>
	): Promise<Transaction | VersionedTransaction>;
	public async getOpenPerpNonMarketOrderTxn<T extends boolean>({
		userAccountPublicKey,
		...rest
	}: WithTxnParams<
		Omit<OpenPerpNonMarketOrderParams<T>, 'driftClient' | 'user'>
	> & {
		userAccountPublicKey: PublicKey;
	}): Promise<TxnOrSwiftResult<T>> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const { useSwift, swiftOptions, txParams, ...otherProps } = rest;

				if (useSwift) {
					const swiftOrderResult = await createOpenPerpNonMarketOrder({
						useSwift: true,
						swiftOptions: {
							...swiftOptions,
							swiftServerUrl: this._driftEndpoints.swiftServerUrl,
						},
						driftClient: this._driftClient,
						user,
						dlobServerHttpUrl: this._driftEndpoints.dlobServerHttpUrl,
						txParams: txParams ?? this.getTxParams(),
						...otherProps,
					});
					return swiftOrderResult as TxnOrSwiftResult<T>;
				} else {
					const openPerpNonMarketOrderTxn = await createOpenPerpNonMarketOrder({
						useSwift: false,
						driftClient: this._driftClient,
						user,
						dlobServerHttpUrl: this._driftEndpoints.dlobServerHttpUrl,
						txParams: txParams ?? this.getTxParams(),
						...otherProps,
					});
					return openPerpNonMarketOrderTxn as TxnOrSwiftResult<T>;
				}
			}
		);
	}

	/**
	 * Create a transaction to edit an existing order
	 */
	public async getEditOrderTxn(
		userAccountPublicKey: PublicKey,
		orderId: number,
		editOrderParams: {
			newDirection?: PositionDirection;
			newBaseAmount?: BN;
			newLimitPrice?: BN;
			newOraclePriceOffset?: number;
			newTriggerPrice?: BN;
			newTriggerCondition?: OrderTriggerCondition;
			auctionDuration?: number;
			auctionStartPrice?: BN;
			auctionEndPrice?: BN;
			reduceOnly?: boolean;
			postOnly?: boolean;
			bitFlags?: number;
			maxTs?: BN;
			policy?: number;
			positionMaxLeverage?: number;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const editOrderTxn = await createEditOrderTxn({
					driftClient: this._driftClient,
					user,
					orderId,
					editOrderParams,
				});

				return editOrderTxn;
			}
		);
	}

	/**
	 * Create a transaction to cancel specific orders by their IDs
	 */
	public async getCancelOrdersTxn(
		userAccountPublicKey: PublicKey,
		orderIds: number[]
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const cancelOrdersTxn = await createCancelOrdersTxn({
					driftClient: this._driftClient,
					user,
					orderIds,
				});

				return cancelOrdersTxn;
			}
		);
	}

	/**
	 * Create a transaction to cancel all orders for a user
	 */
	public async getCancelAllOrdersTxn(
		userAccountPublicKey: PublicKey,
		marketType?: MarketType,
		marketIndex?: number,
		direction?: PositionDirection
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const ix = await this._driftClient.getCancelOrdersIx(
					marketType ?? null,
					marketIndex ?? null,
					direction ?? null,
					user.getUserAccount().subAccountId
				);

				const cancelAllOrdersTxn = await this._driftClient.buildTransaction(ix);

				return cancelAllOrdersTxn;
			}
		);
	}

	/**
	 * Create a swap transaction between two spot markets using Jupiter
	 */
	public async getSwapTxn(
		userAccountPublicKey: PublicKey,
		fromMarketIndex: number,
		toMarketIndex: number,
		amount: BN,
		options?: {
			slippageBps?: number;
			swapMode?: SwapMode;
			onlyDirectRoutes?: boolean;
			quote?: UnifiedQuoteResponse;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const fromSpotMarketConfig = this._spotMarketConfigs.find(
					(market) => market.marketIndex === fromMarketIndex
				);
				const toSpotMarketConfig = this._spotMarketConfigs.find(
					(market) => market.marketIndex === toMarketIndex
				);

				if (!fromSpotMarketConfig) {
					throw new Error(
						`From spot market config not found for index ${fromMarketIndex}`
					);
				}

				if (!toSpotMarketConfig) {
					throw new Error(
						`To spot market config not found for index ${toMarketIndex}`
					);
				}

				const swapClient = new UnifiedSwapClient({
					clientType: 'jupiter',
					connection: this._driftClient.connection,
				});

				// Get quote if not provided
				let quote = options?.quote;
				if (!quote) {
					quote = await swapClient.getQuote({
						inputMint: fromSpotMarketConfig.mint,
						outputMint: toSpotMarketConfig.mint,
						amount,
						slippageBps: options?.slippageBps ?? 10, // Default 0.1%
						swapMode: options?.swapMode ?? 'ExactIn',
						onlyDirectRoutes: options?.onlyDirectRoutes ?? false,
					});
				}

				const swapTxn = await createSwapTxn({
					driftClient: this._driftClient,
					swapClient,
					user,
					swapFromMarketIndex: fromMarketIndex,
					swapToMarketIndex: toMarketIndex,
					amount,
					quote,
					txParams: {
						useSimulatedComputeUnits: true,
						computeUnitsBufferMultiplier: 1.5,
					},
				});

				return swapTxn;
			}
		);
	}

	public async sendSignedTransaction(tx: VersionedTransaction | Transaction) {
		return this._driftClient.sendTransaction(tx, undefined, undefined, true);
	}
}
