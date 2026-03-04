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
	MIN_I64,
	OneShotUserAccountSubscriber,
	OrderTriggerCondition,
	PerpMarketConfig,
	PositionDirection,
	PriorityFeeMethod,
	PriorityFeeSubscriber,
	PriorityFeeSubscriberConfig,
	PublicKey,
	SettlePnlMode,
	SpotMarketConfig,
	SwapMode,
	TxParams,
	UnifiedQuoteResponse,
	UnifiedSwapClient,
	User,
	WhileValidTxSender,
	ZERO,
} from '@drift-labs/sdk';
import {
	Connection,
	Transaction,
	TransactionInstruction,
	VersionedTransaction,
} from '@solana/web3.js';
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
import { getTokenAddressForDepositAndWithdraw } from '../../../../utils/token';
import { createSettleFundingTxn } from '../../../base/actions/perp/settleFunding';
import {
	createSettlePnlIx,
	createSettlePnlTxn,
} from '../../../base/actions/perp/settlePnl';
import {
	createOpenPerpMarketOrder,
	createOpenPerpMarketOrderIxs,
} from '../../../base/actions/trade/openPerpOrder/openPerpMarketOrder';
import {
	createOpenPerpNonMarketOrder,
	OpenPerpNonMarketOrderParams,
} from '../../../base/actions/trade/openPerpOrder/openPerpNonMarketOrder';
import { createEditOrderTxn } from '../../../base/actions/trade/editOrder';
import { createCancelOrdersTxn } from '../../../base/actions/trade/cancelOrder';
import { createSwapTxn } from '../../../base/actions/trade/swap';
import { createUserAndDepositCollateralBaseTxn } from '../../../base/actions/user/create';
import { deleteUserTxn } from '../../../base/actions/user/delete';
import { createRevenueShareEscrowTxn } from '../../../base/actions/builder/createRevenueShareEscrow';
import { createRevenueShareAccountTxn } from '../../../base/actions/builder/createRevenueShareAccount';
import { configureBuilderTxn } from '../../../base/actions/builder/configureBuilder';
import { TxnOrSwiftResult } from '../../../base/actions/trade/openPerpOrder/types';
import { WithTxnParams } from '../../../base/types';
import { EnvironmentConstants } from '../../../../EnvironmentConstants';
import {
	CentralServerGetOpenPerpMarketOrderTxnParams,
	CentralServerGetOpenPerpNonMarketOrderTxnParams,
	CentralServerGetOpenIsolatedPerpPositionTxnParams,
	CentralServerGetCloseIsolatedPerpPositionTxnParams,
	CentralServerGetWithdrawIsolatedPerpPositionCollateralTxnParams,
	CentralServerGetCloseAndWithdrawIsolatedPerpPositionTxnParams,
	CentralServerGetDepositAndOpenIsolatedPerpPositionTxnParams,
	CentralServerGetCloseAndWithdrawIsolatedPerpPositionToWalletTxnParams,
} from './types';
import { CentralServerDriftMarkets } from './markets';
import { DriftOperations } from '../AuthorityDrift/DriftOperations';

export type {
	CentralServerGetOpenIsolatedPerpPositionTxnParams,
	CentralServerGetCloseIsolatedPerpPositionTxnParams,
	CentralServerGetWithdrawIsolatedPerpPositionCollateralTxnParams,
	CentralServerGetCloseAndWithdrawIsolatedPerpPositionTxnParams,
	CentralServerGetDepositAndOpenIsolatedPerpPositionTxnParams,
	CentralServerGetCloseAndWithdrawIsolatedPerpPositionToWalletTxnParams,
} from './types';

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
	 * Temporarily swaps the DriftClient wallet/authority context to build transactions
	 * for a given authority, then restores the original state.
	 *
	 * Use this for authority-based operations that don't require a User account subscription
	 * (e.g. creating revenue share accounts, managing builders).
	 *
	 * @param authority - The authority to set on the DriftClient
	 * @param operation - The transaction creation operation to execute
	 * @returns The result of the operation
	 */
	private async authorityContextWrapper<T>(
		authority: PublicKey,
		operation: () => Promise<T>
	): Promise<T> {
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

			return await operation();
		} finally {
			this._driftClient.wallet = originalWallet;
			this._driftClient.txHandler.updateWallet(originalWallet);
			// @ts-ignore
			this._driftClient.provider.wallet = originalWallet;
			this._driftClient.authority = originalAuthority;
		}
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
			/**
			 * Optional external wallet to deposit from. If provided, the deposit will be made
			 * from this wallet instead of the authority wallet.
			 */
			externalWallet?: PublicKey;
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

		return this.authorityContextWrapper(
			options?.externalWallet ?? authority,
			async () => {
				this._driftClient.authority = authority;
				// Clear userStatsAccountPublicKey cache so it's recalculated for the new authority
				// @ts-ignore - accessing private property for cache invalidation
				this._driftClient.userStatsAccountPublicKey = undefined;

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
					externalWallet: options?.externalWallet,
				});
			}
		);
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
	 * Create a transaction to open an isolated perp position.
	 * Transfers collateral from cross account into isolated, then places the order.
	 * Uses useSwift: false (Swift has limitations with isolated deposits).
	 */
	public async getOpenIsolatedPerpPositionTxn(
		params: CentralServerGetOpenIsolatedPerpPositionTxnParams
	): Promise<Transaction | VersionedTransaction> {
		const { isolatedPositionDeposit, userAccountPublicKey, ...rest } = params;
		if (isolatedPositionDeposit.isZero()) {
			throw new Error(
				'isolatedPositionDeposit is required and must be non-zero'
			);
		}
		const perpMarketConfig = this._perpMarketConfigs.find(
			(m) => m.marketIndex === params.marketIndex
		);
		if (!perpMarketConfig) {
			throw new Error(
				`Perp market config not found for index ${params.marketIndex}`
			);
		}
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const openTxn = await createOpenPerpMarketOrder({
					...rest,
					useSwift: false,
					driftClient: this._driftClient,
					user,
					dlobServerHttpUrl: this._driftEndpoints.dlobServerHttpUrl,
					isolatedPositionDeposit,
					txParams: params.txParams ?? this.getTxParams(),
					mainSignerOverride: rest.mainSignerOverride,
				});
				return openTxn;
			},
			rest.mainSignerOverride
		);
	}

	/**
	 * Create a transaction to close an isolated perp position (reduce-only market order).
	 * Does not transfer collateral out; use getWithdrawIsolatedPerpPositionCollateralTxn for that.
	 * If you intend to fully close and then withdraw in a follow-up tx, consider passing
	 * placeAndTake: { enable: true, referrerInfo: undefined } so the close fills atomically.
	 */
	public async getCloseIsolatedPerpPositionTxn(
		params: CentralServerGetCloseIsolatedPerpPositionTxnParams
	): Promise<VersionedTransaction | Transaction> {
		const perpMarketConfig = this._perpMarketConfigs.find(
			(m) => m.marketIndex === params.marketIndex
		);
		if (!perpMarketConfig) {
			throw new Error(
				`Perp market config not found for index ${params.marketIndex}`
			);
		}
		return this.driftClientContextWrapper(
			params.userAccountPublicKey,
			async (user) => {
				const closeTxn = await createOpenPerpMarketOrder({
					useSwift: false,
					driftClient: this._driftClient,
					user,
					marketIndex: params.marketIndex,
					direction: params.direction,
					amount: params.baseAssetAmount,
					assetType: params.assetType ?? 'base',
					reduceOnly: true,
					dlobServerHttpUrl: this._driftEndpoints.dlobServerHttpUrl,
					positionMaxLeverage: 0,
					txParams: params.txParams ?? this.getTxParams(),
					mainSignerOverride: params.mainSignerOverride,
					placeAndTake: params.placeAndTake,
				});
				return closeTxn;
			},
			params.mainSignerOverride
		);
	}

	/**
	 * Create a transaction to withdraw collateral from an isolated perp position back to cross. Often to be called after fully closing position
	 */
	public async getWithdrawIsolatedPerpPositionCollateralTxn(
		params: CentralServerGetWithdrawIsolatedPerpPositionCollateralTxnParams
	): Promise<VersionedTransaction | Transaction> {
		const perpMarketConfig = this._perpMarketConfigs.find(
			(m) => m.marketIndex === params.marketIndex
		);
		if (!perpMarketConfig) {
			throw new Error(
				`Perp market config not found for index ${params.marketIndex}`
			);
		}
		return this.driftClientContextWrapper(
			params.userAccountPublicKey,
			async (user) => {
				const signingAuthority = params.mainSignerOverride;
				const ixs: import('@solana/web3.js').TransactionInstruction[] = [];
				const shouldSettlePnl =
					params.settlePnlFirst ?? params.isFullWithdrawal ?? false;
				if (shouldSettlePnl) {
					const settleIx = await createSettlePnlIx({
						driftClient: this._driftClient,
						user,
						marketIndexes: [params.marketIndex],
						mode: SettlePnlMode.TRY_SETTLE,
						mainSignerOverride: signingAuthority,
					});
					ixs.push(settleIx);
				}
				const position =
					user.getUserAccount().perpPositions[params.marketIndex];
				const transferAmount =
					params.isFullWithdrawal && position.baseAssetAmount.eq(ZERO)
						? MIN_I64
						: params.amount.neg();
				const transferIx =
					await this._driftClient.getTransferIsolatedPerpPositionDepositIx(
						transferAmount,
						params.marketIndex,
						user.getUserAccount().subAccountId,
						true,
						signingAuthority
					);
				ixs.push(transferIx);
				return this._driftClient.buildTransaction(
					ixs,
					params.txParams ?? this.getTxParams()
				);
			},
			params.mainSignerOverride
		);
	}

	/**
	 * Single transaction: close isolated position + optionally withdraw collateral.
	 * Without placeAndTake that atomically fills the close, the entire transaction may FAIL:
	 * the withdraw ix runs after the close, and if the close did not fill in this tx,
	 * the whole tx will fail. Strongly consider placeAndTake: { enable: true, referrerInfo: undefined }
	 * when closing and withdrawing in the same tx.
	 */
	public async getCloseAndWithdrawIsolatedPerpPositionTxn(
		params: CentralServerGetCloseAndWithdrawIsolatedPerpPositionTxnParams
	): Promise<VersionedTransaction | Transaction> {
		const perpMarketConfig = this._perpMarketConfigs.find(
			(m) => m.marketIndex === params.marketIndex
		);
		if (!perpMarketConfig) {
			throw new Error(
				`Perp market config not found for index ${params.marketIndex}`
			);
		}
		return this.driftClientContextWrapper(
			params.userAccountPublicKey,
			async (user) => {
				const signingAuthority = params.mainSignerOverride;
				const ixs: TransactionInstruction[] = [];
				if (
					params.settlePnlBeforeClose &&
					params.withdrawCollateralAfterClose
				) {
					const settleIx = await createSettlePnlIx({
						driftClient: this._driftClient,
						user,
						marketIndexes: [params.marketIndex],
						mode: SettlePnlMode.TRY_SETTLE,
						mainSignerOverride: signingAuthority,
					});
					ixs.push(settleIx);
				}
				const closeIxs = await createOpenPerpMarketOrderIxs({
					driftClient: this._driftClient,
					user,
					marketIndex: params.marketIndex,
					direction: params.direction,
					amount: params.baseAssetAmount,
					assetType: params.assetType ?? 'base',
					reduceOnly: true,
					dlobServerHttpUrl: this._driftEndpoints.dlobServerHttpUrl,
					positionMaxLeverage: 0,
					mainSignerOverride: signingAuthority,
					placeAndTake: params.placeAndTake,
				});
				ixs.push(...closeIxs);
				if (params.withdrawCollateralAfterClose) {
					const transferIx =
						await this._driftClient.getTransferIsolatedPerpPositionDepositIx(
							MIN_I64,
							params.marketIndex,
							user.getUserAccount().subAccountId,
							true,
							signingAuthority
						);
					ixs.push(transferIx);
				}
				return this._driftClient.buildTransaction(
					ixs,
					params.txParams ?? this.getTxParams()
				);
			},
			params.mainSignerOverride
		);
	}

	/**
	 * Deposit from wallet + open isolated perp position in one transaction.
	 * Flow: deposit from wallet directly into isolated, then place order.
	 */
	public async getDepositAndOpenIsolatedPerpPositionTxn(
		params: CentralServerGetDepositAndOpenIsolatedPerpPositionTxnParams
	): Promise<Transaction | VersionedTransaction> {
		const { depositAmount, userAccountPublicKey, ...rest } = params;
		if (!depositAmount || depositAmount.isZero()) {
			throw new Error('depositAmount is required and must be non-zero');
		}
		const perpMarketConfig = this._perpMarketConfigs.find(
			(m) => m.marketIndex === params.marketIndex
		);
		if (!perpMarketConfig) {
			throw new Error(
				`Perp market config not found for index ${params.marketIndex}`
			);
		}
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const signingAuthority = rest.mainSignerOverride;
				const subAccountId = user.getUserAccount().subAccountId;

				const perpMarketAccount = this._driftClient.getPerpMarketAccount(
					params.marketIndex
				);
				const quoteSpotMarketIndex = perpMarketAccount.quoteSpotMarketIndex;
				const spotMarketAccount =
					this._driftClient.getSpotMarketAccount(quoteSpotMarketIndex);
				const depositor = signingAuthority ?? user.getUserAccount().authority;
				const tokenProgram =
					this._driftClient.getTokenProgramForSpotMarket(spotMarketAccount);
				const userTokenAccount = await getTokenAddressForDepositAndWithdraw(
					spotMarketAccount.mint,
					depositor,
					tokenProgram
				);

				const depositIx =
					await this._driftClient.getDepositIntoIsolatedPerpPositionIx(
						depositAmount,
						params.marketIndex,
						userTokenAccount,
						subAccountId
					);

				const orderIxs = await createOpenPerpMarketOrderIxs({
					...rest,
					driftClient: this._driftClient,
					user,
					dlobServerHttpUrl: this._driftEndpoints.dlobServerHttpUrl,
					isolatedPositionDeposit: undefined,
					mainSignerOverride: signingAuthority,
				});

				const ixs = [depositIx, ...orderIxs];
				return this._driftClient.buildTransaction(
					ixs,
					params.txParams ?? this.getTxParams()
				);
			},
			rest.mainSignerOverride
		);
	}

	/**
	 * Close isolated position + withdraw to wallet in one transaction.
	 * Flow: close order, then withdraw from isolated directly to wallet (bundle handles settle if needed).
	 * Without placeAndTake that atomically fills the close, the entire transaction may FAIL:
	 * the withdraw runs after the close, and if the close did not fill in this tx, the withdraw may fail depending on withdraw amount.
	 * Strongly consider placeAndTake: { enable: true, referrerInfo: undefined } when closing and withdrawing.
	 */
	public async getCloseAndWithdrawIsolatedPerpPositionToWalletTxn(
		params: CentralServerGetCloseAndWithdrawIsolatedPerpPositionToWalletTxnParams
	): Promise<VersionedTransaction | Transaction> {
		const perpMarketConfig = this._perpMarketConfigs.find(
			(m) => m.marketIndex === params.marketIndex
		);
		if (!perpMarketConfig) {
			throw new Error(
				`Perp market config not found for index ${params.marketIndex}`
			);
		}
		return this.driftClientContextWrapper(
			params.userAccountPublicKey,
			async (user) => {
				const signingAuthority = params.mainSignerOverride;
				const subAccountId = user.getUserAccount().subAccountId;

				const closeIxs = await createOpenPerpMarketOrderIxs({
					driftClient: this._driftClient,
					user,
					marketIndex: params.marketIndex,
					direction: params.direction,
					amount: params.baseAssetAmount,
					assetType: params.assetType ?? 'base',
					reduceOnly: true,
					dlobServerHttpUrl: this._driftEndpoints.dlobServerHttpUrl,
					positionMaxLeverage: 0,
					mainSignerOverride: signingAuthority,
					placeAndTake: params.placeAndTake,
				});

				const perpMarketAccount = this._driftClient.getPerpMarketAccount(
					params.marketIndex
				);
				const quoteSpotMarketIndex = perpMarketAccount.quoteSpotMarketIndex;
				const spotMarketAccount =
					this._driftClient.getSpotMarketAccount(quoteSpotMarketIndex);
				const withdrawToAuthority =
					params.mainSignerOverride ?? user.getUserAccount().authority;
				const userTokenAccount = await getTokenAddressForDepositAndWithdraw(
					spotMarketAccount.mint,
					withdrawToAuthority,
					this._driftClient.getTokenProgramForSpotMarket(spotMarketAccount)
				);

				const withdrawAmount =
					params.estimatedWithdrawAmount ??
					this._driftClient.getIsolatedPerpPositionTokenAmount(
						params.marketIndex,
						subAccountId
					);
				const withdrawIxs =
					await this._driftClient.getWithdrawFromIsolatedPerpPositionIxsBundle(
						withdrawAmount,
						params.marketIndex,
						subAccountId,
						userTokenAccount
					);

				const ixs = [...closeIxs, ...withdrawIxs];
				return this._driftClient.buildTransaction(
					ixs,
					params.txParams ?? this.getTxParams()
				);
			},
			params.mainSignerOverride
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

	/**
	 * Create a transaction to initialize a RevenueShareEscrow account for a user.
	 * Optionally bundles an initial builder approval in the same transaction.
	 */
	public async getCreateRevenueShareEscrowTxn(
		authority: PublicKey,
		options?: {
			numOrders?: number;
			builder?: {
				builderAuthority: PublicKey;
				maxFeeTenthBps: number;
			};
			txParams?: TxParams;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.authorityContextWrapper(authority, () =>
			createRevenueShareEscrowTxn({
				driftClient: this._driftClient,
				authority,
				numOrders: options?.numOrders ?? 16,
				builder: options?.builder,
				txParams: options?.txParams ?? this.getTxParams(),
			})
		);
	}

	/**
	 * Create a transaction to initialize a RevenueShare account for a builder.
	 * This must be initialized before a builder can receive builder fees.
	 */
	public async getCreateRevenueShareAccountTxn(
		authority: PublicKey,
		options?: {
			txParams?: TxParams;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.authorityContextWrapper(authority, () =>
			createRevenueShareAccountTxn({
				driftClient: this._driftClient,
				authority,
				txParams: options?.txParams ?? this.getTxParams(),
			})
		);
	}

	/**
	 * Create a transaction to configure a builder's approval status and fee cap.
	 * Handles approve, update, and revoke operations.
	 * Set maxFeeTenthBps to 0 to revoke a builder.
	 */
	public async getConfigureApprovedBuilderTxn(
		authority: PublicKey,
		builderAuthority: PublicKey,
		maxFeeTenthBps: number,
		options?: {
			txParams?: TxParams;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.authorityContextWrapper(authority, () =>
			configureBuilderTxn({
				driftClient: this._driftClient,
				authority,
				builderAuthority,
				maxFeeTenthBps,
				txParams: options?.txParams ?? this.getTxParams(),
			})
		);
	}

	public async sendSignedTransaction(tx: VersionedTransaction | Transaction) {
		return this._driftClient.sendTransaction(tx, undefined, undefined, true);
	}
}
