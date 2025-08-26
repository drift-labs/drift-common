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
	MainnetPerpMarkets,
	MainnetSpotMarkets,
	MarketType,
	OrderType,
	PerpMarketConfig,
	PositionDirection,
	PostOnlyParams,
	PublicKey,
	SpotMarketConfig,
	User,
	WhileValidTxSender,
} from '@drift-labs/sdk';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { COMMON_UI_UTILS } from '../../../common-ui-utils/commonUiUtils';
import {
	DEFAULT_ACCOUNT_LOADER_COMMITMENT,
	DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS,
	DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY,
	DEFAULT_TX_SENDER_RETRY_INTERVAL,
} from '../constants';
import { MarketId } from '../../../types';
import { createDepositTxn } from '../../base/actions/spot/deposit';
import { createWithdrawTxn } from '../../base/actions/spot/withdraw';
import { createSettleFundingTxn } from '../../base/actions/perp/settleFunding';
import { createSettlePnlTxn } from '../../base/actions/perp/settlePnl';
import {
	createOpenPerpMarketOrderTxn,
	AuctionParamsRequestOptions,
	SwiftOrderOptions,
	SwiftOrderResult,
} from '../../base/actions/trade/openPerpOrder/openPerpMarketOrder';
import { createOpenPerpNonMarketOrderTxn } from '../../base/actions/trade/openPerpOrder/openPerpNonMarketOrder';

/**
 * A Drift client that fetches user data on-demand, while market data is continuously subscribed to.
 *
 * This is useful for an API server that fetches user data on-demand, and return transaction messages specific to a given user
 */
export class CentralServerDrift {
	private driftClient: DriftClient;
	private _perpMarketConfigs: PerpMarketConfig[];
	private spotMarketConfigs: SpotMarketConfig[];

	/**
	 * @param solanaRpcEndpoint - The Solana RPC endpoint to use for reading RPC data.
	 * @param driftEnv - The drift environment to use for the drift client.
	 * @param activeTradeMarket - The active trade market to use for the drift client. This is used to subscribe to the market account, oracle data and mark price more frequently compared to the other markets.
	 * @param additionalDriftClientConfig - Additional DriftClient config to use for the DriftClient.
	 */
	constructor(config: {
		solanaRpcEndpoint: string;
		driftEnv: DriftEnv;
		additionalDriftClientConfig?: Partial<Omit<DriftClientConfig, 'env'>>;
		activeTradeMarket?: MarketId;
		marketsToSubscribe?: MarketId[];
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
			...config.additionalDriftClientConfig,
		};
		this.driftClient = new DriftClient(driftClientConfig);

		const txSender = new WhileValidTxSender({
			connection,
			wallet,
			additionalConnections: [],
			additionalTxSenderCallbacks: [],
			txHandler: this.driftClient.txHandler,
			confirmationStrategy: DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY,
			retrySleep: DEFAULT_TX_SENDER_RETRY_INTERVAL,
		});

		this.driftClient.txSender = txSender;
		this._perpMarketConfigs =
			driftEnv === 'devnet' ? DevnetPerpMarkets : MainnetPerpMarkets;
		this.spotMarketConfigs =
			driftEnv === 'devnet' ? DevnetSpotMarkets : MainnetSpotMarkets;
	}

	public async subscribe() {
		await this.driftClient.subscribe();
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
		operation: (user: User) => Promise<T>
	): Promise<T> {
		const user = new User({
			driftClient: this.driftClient,
			userAccountPublicKey,
		});

		// Store original state
		const originalWallet = this.driftClient.wallet;
		const originalAuthority = this.driftClient.authority;

		try {
			// Setup: Subscribe to user and configure DriftClient
			await user.subscribe();

			const authority = user.getUserAccount().authority;
			this.driftClient.authority = authority;

			const success = await this.driftClient.addUser(
				user.getUserAccount().subAccountId,
				authority
			);

			if (!success) {
				throw new Error('Failed to add user to DriftClient');
			}

			// Replace wallet with user's authority to ensure correct transaction signing
			// This is necessary because DriftClient adds wallet.publicKey to instructions
			const userWallet = {
				publicKey: authority,
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
			this.driftClient.wallet = userWallet;
			this.driftClient.txHandler.updateWallet(userWallet);
			// Note: We don't update provider.wallet because it's readonly, but TxHandler should be sufficient

			// Execute the operation
			const result = await operation(user);

			return result;
		} finally {
			// Cleanup: Always restore original state and unsubscribe
			this.driftClient.wallet = originalWallet;
			this.driftClient.txHandler.updateWallet(originalWallet);
			this.driftClient.authority = originalAuthority;

			try {
				await user.unsubscribe();
				this.driftClient.users.clear();
			} catch (cleanupError) {
				console.warn('Error during cleanup:', cleanupError);
				// Don't throw cleanup errors, but log them
			}
		}
	}

	public async getDepositTxn(
		userAccountPublicKey: PublicKey,
		amount: BN,
		spotMarketIndex: number
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const spotMarketConfig = this.spotMarketConfigs.find(
					(market) => market.marketIndex === spotMarketIndex
				);

				if (!spotMarketConfig) {
					throw new Error(
						`Spot market config not found for index ${spotMarketIndex}`
					);
				}

				const depositTxn = await createDepositTxn({
					driftClient: this.driftClient,
					user,
					amount: BigNum.from(amount, spotMarketConfig.precisionExp),
					spotMarketConfig,
				});

				return depositTxn;
			}
		);
	}

	public async getWithdrawTxn(
		userAccountPublicKey: PublicKey,
		amount: BN,
		spotMarketIndex: number,
		options?: {
			isBorrow?: boolean;
			isMax?: boolean;
		}
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const spotMarketConfig = this.spotMarketConfigs.find(
					(market) => market.marketIndex === spotMarketIndex
				);

				if (!spotMarketConfig) {
					throw new Error(
						`Spot market config not found for index ${spotMarketIndex}`
					);
				}

				const withdrawTxn = await createWithdrawTxn({
					driftClient: this.driftClient,
					user,
					amount: BigNum.from(amount, spotMarketConfig.precisionExp),
					spotMarketConfig,
					isBorrow: options?.isBorrow,
					isMax: options?.isMax,
				});

				return withdrawTxn;
			}
		);
	}

	public async getSettleFundingTxn(
		userAccountPublicKey: PublicKey
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const settleFundingTxn = await createSettleFundingTxn({
					driftClient: this.driftClient,
					user,
				});

				return settleFundingTxn;
			}
		);
	}

	public async getSettlePnlTxn(
		userAccountPublicKey: PublicKey,
		marketIndexes: number[]
	): Promise<VersionedTransaction | Transaction> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const settlePnlTxn = await createSettlePnlTxn({
					driftClient: this.driftClient,
					user,
					marketIndexes,
				});

				return settlePnlTxn;
			}
		);
	}

	public async getOpenPerpMarketOrderTxn(
		userAccountPublicKey: PublicKey,
		assetType: 'base' | 'quote',
		marketIndex: number,
		direction: PositionDirection,
		amount: BN,
		dlobServerHttpUrl: string,
		auctionParamsOptions?: AuctionParamsRequestOptions,
		useSwift?: boolean,
		swiftOptions?: SwiftOrderOptions,
		marketType?: MarketType
	): Promise<VersionedTransaction | Transaction | SwiftOrderResult> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const openPerpMarketOrderTxn = await createOpenPerpMarketOrderTxn({
					driftClient: this.driftClient,
					user,
					assetType,
					marketIndex,
					direction,
					amount,
					dlobServerHttpUrl,
					auctionParamsOptions,
					useSwift,
					swiftOptions,
					marketType,
				});

				return openPerpMarketOrderTxn;
			}
		);
	}

	/**
	 * Create a perp non-market order with amount and asset type
	 */
	public async getOpenPerpNonMarketOrderTxn(
		userAccountPublicKey: PublicKey,
		marketIndex: number,
		direction: PositionDirection,
		amount: BN,
		assetType: 'base' | 'quote',
		limitPrice?: BN,
		triggerPrice?: BN,
		orderType?: OrderType,
		reduceOnly?: boolean,
		postOnly?: PostOnlyParams,
		useSwift?: boolean,
		swiftOptions?: SwiftOrderOptions,
		marketType?: MarketType
	): Promise<VersionedTransaction | Transaction | SwiftOrderResult> {
		return this.driftClientContextWrapper(
			userAccountPublicKey,
			async (user) => {
				const openPerpNonMarketOrderTxn = await createOpenPerpNonMarketOrderTxn(
					{
						driftClient: this.driftClient,
						user,
						marketIndex,
						direction,
						amount,
						assetType,
						limitPrice,
						triggerPrice,
						orderType,
						reduceOnly,
						postOnly,
						useSwift,
						swiftOptions,
						marketType,
					}
				);

				return openPerpNonMarketOrderTxn;
			}
		);
	}

	public async sendSignedTransaction(tx: VersionedTransaction | Transaction) {
		return this.driftClient.sendTransaction(tx, undefined, undefined, true);
	}
}
