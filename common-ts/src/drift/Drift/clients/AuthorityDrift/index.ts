import {
	CustomizedCadenceBulkAccountLoader,
	DelistedMarketSetting,
	DRIFT_PROGRAM_ID,
	DriftClient,
	DriftClientConfig,
	DriftEnv,
	getMarketsAndOraclesForSubscription,
	IWallet,
	MarketType,
	PerpMarketConfig,
	PerpMarkets,
	QuoteResponse,
	SpotMarketConfig,
	SpotMarkets,
	SwapMode,
	User,
	WhileValidTxSender,
	IWalletV2,
	TxParams,
} from '@drift-labs/sdk';
import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';
import { COMMON_UI_UTILS } from '../../../../common-ui-utils/commonUiUtils';
import {
	DEFAULT_ACCOUNT_LOADER_COMMITMENT,
	DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS,
	DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY,
	DEFAULT_TX_SENDER_RETRY_INTERVAL,
	DELISTED_MARKET_STATUSES,
	HIGH_ACTIVITY_MARKET_ACCOUNTS,
	PollingCategory,
} from '../../constants';
import { MarketId } from '../../../../types';
import { MARKET_UTILS } from '../../../../common-ui-utils/market';
import {
	POLLING_DEPTHS,
	POLLING_INTERVALS,
	PollingDlob,
} from '../../data/PollingDlob';
import { EnvironmentConstants } from '../../../../EnvironmentConstants';
import { MarkPriceLookup, MarkPriceCache } from '../../stores/MarkPriceCache';
import {
	OraclePriceLookup,
	OraclePriceCache,
} from '../../stores/OraclePriceCache';
import { DriftL2OrderbookManager } from './DriftL2OrderbookManager';
import { Subscription } from 'rxjs';
import {
	EnhancedAccountData,
	UserAccountCache,
	UserAccountLookup,
} from '../../stores/UserAccountCache';
import { ENUM_UTILS } from '../../../../utils';
import { checkGeoBlock } from '../../../../utils/geoblock';
import {
	PriorityFeeSubscriber,
	PriorityFeeSubscriberConfig,
	PriorityFeeMethod,
} from '@drift-labs/sdk';
import { SubscriptionManager } from './SubscriptionManager';
import { DriftOperations } from './DriftOperations';
import {
	CreateUserAndDepositParams,
	DepositParams,
	WithdrawParams,
	PerpOrderParams,
	SwapParams,
	SettleAccountPnlParams,
	CancelOrdersParams,
	CreateRevenueShareEscrowParams,
} from './DriftOperations/types';
import { Initialize } from '../../../../Config';
import { L2WithOracleAndMarketData } from '../../../../utils/orderbook/types';
import { GeoBlockError } from '../../constants/errors';
import {
	DEFAULT_ORDERBOOK_GROUPING,
	DEFAULT_ORDERBOOK_SUBSCRIPTION_CONFIG,
} from '../../constants/orderbook';
import { OrderbookGrouping } from '../../../../utils/dlob-server/DlobServerWebsocketUtils';

/**
 * Decorator that prevents method execution if the user is geographically blocked.
 * Throws a GeoBlockError if the user is blocked.
 *
 * @param target - The class prototype
 * @param propertyName - The method name
 * @param descriptor - The method descriptor
 */
function enforceGeoBlock(
	_target: any,
	propertyName: string,
	descriptor: PropertyDescriptor
): PropertyDescriptor {
	const originalMethod = descriptor.value;

	descriptor.value = function (this: AuthorityDrift, ...args: any[]) {
		if (this._isGeoBlocked) {
			throw new GeoBlockError(propertyName);
		}
		return originalMethod.apply(this, args);
	};

	return descriptor;
}

export interface AuthorityDriftConfig {
	solanaRpcEndpoint: string;
	driftEnv: DriftEnv;
	wallet?: IWalletV2;
	driftDlobServerHttpUrl?: string;
	tradableMarkets?: MarketId[];
	selectedTradeMarket?: MarketId;
	additionalDriftClientConfig?: Partial<Omit<DriftClientConfig, 'env'>>;
	priorityFeeSubscriberConfig?: Partial<PriorityFeeSubscriberConfig>;
	orderbookConfig?: {
		dlobWebSocketUrl?: string;
		orderbookGrouping?: OrderbookGrouping;
	};
}

/**
 * A Drift client that is used to subscribe to all accounts for a given authority.
 *
 * This is useful for applications that want to subscribe to all user accounts for a given authority,
 * such as a UI to trade on Drift or a wallet application that allows trading on Drift.
 */
export class AuthorityDrift {
	/**
	 * Handles all Drift program interactions e.g. trading, read account details, etc.
	 */
	private _driftClient!: DriftClient;

	/**
	 * Handles bulk account loading from the RPC.
	 */
	private accountLoader!: CustomizedCadenceBulkAccountLoader;

	/**
	 * Handles polling the DLOB server for mark price and oracle price data for markets.
	 * It is also the fallback source for orderbook data, if the websocket DLOB subscriber is unavailable.
	 */
	private _pollingDlob!: PollingDlob;

	/**
	 * Subscription to the polling DLOB data.
	 */
	private pollingDlobSubscription: Subscription | null = null;

	/**
	 * Subscription to the orderbook data.
	 */
	private orderbookSubscription: Subscription | null = null;

	/**
	 * Handles all trading operations including deposits, withdrawals, and position management.
	 */
	private driftOperations!: DriftOperations;

	/**
	 * Manages all subscription operations including user accounts, market subscriptions, and polling optimization.
	 */
	private subscriptionManager!: SubscriptionManager;

	/**
	 * Stores the fetched mark prices for all tradable markets.
	 * Mark price sources includes:
	 * - Websocket DLOB subscriber (active market, derived when fetching orderbook data)
	 * - Polling DLOB server (all non-active markets)
	 */
	private _markPriceCache!: MarkPriceCache;

	/**
	 * Stores the fetched oracle prices for all tradable markets.
	 * Oracle price sources includes:
	 * - DriftClient oracle account subscriptions
	 * - Polling DLOB server (all non-active markets)
	 */
	private _oraclePriceCache!: OraclePriceCache;

	/**
	 * Stores the fetched user account data for all user accounts.
	 */
	private _userAccountCache!: UserAccountCache;

	/**
	 * Manages real-time orderbook subscriptions via websocket.
	 */
	private _orderbookManager!: DriftL2OrderbookManager;

	/**
	 * Handles priority fee tracking and calculation for optimized transaction costs.
	 */
	private priorityFeeSubscriber!: PriorityFeeSubscriber;

	/**
	 * Stores whether the user is geographically blocked from using the service.
	 * This is checked during subscription and cached for decorator use.
	 */
	protected _isGeoBlocked: boolean = false;

	/**
	 * The selected trade market to use for the drift client. This is used to subscribe to the market account,
	 * oracle data and mark price more frequently compared to the other markets.
	 *
	 * Example usage:
	 * - When the UI wants to display the orderbook of this market.
	 * - When the user is interacting with the trade form to trade on this market.
	 */
	private selectedTradeMarket: MarketId | null = null;

	/**
	 * The markets that are tradable through this client. This affects oracle price, mark price and market account subscriptions.
	 */
	private _tradableMarkets: MarketId[] = [];

	private _spotMarketConfigs: SpotMarketConfig[] = [];
	private _perpMarketConfigs: PerpMarketConfig[] = [];

	/**
	 * The public endpoints that can be used to retrieve Drift data / interact with the Drift program.
	 */
	private _driftEndpoints: {
		dlobServerHttpUrl: string;
		swiftServerUrl: string;
		orderbookWebsocketUrl: string;
	};

	/**
	 * @param solanaRpcEndpoint - The Solana RPC endpoint to use for reading RPC data.
	 * @param driftEnv - The drift environment to use for the drift client.
	 * @param authority - The authority (wallet) whose user accounts to subscribe to.
	 * @param tradableMarkets - The markets that are tradable through this client.
	 * @param selectedTradeMarket - The active trade market to use for the drift client. This is used to subscribe to the market account, oracle data and mark price more frequently compared to the other markets.
	 * @param additionalDriftClientConfig - Additional DriftClient config to use for the DriftClient.
	 */
	constructor(config: AuthorityDriftConfig) {
		// set up tradable markets
		this.selectedTradeMarket = config.selectedTradeMarket ?? null;

		const perpTradableMarkets = PerpMarkets[config.driftEnv].map(
			(marketConfig) => MarketId.createPerpMarket(marketConfig.marketIndex)
		);
		const spotTradableMarkets = SpotMarkets[config.driftEnv].map(
			(marketConfig) => MarketId.createSpotMarket(marketConfig.marketIndex)
		);

		this._tradableMarkets = config.tradableMarkets ?? [
			...perpTradableMarkets,
			...spotTradableMarkets,
		];
		this._spotMarketConfigs = spotTradableMarkets.map((market) =>
			MARKET_UTILS.getMarketConfig(
				config.driftEnv,
				MarketType.SPOT,
				market.marketIndex
			)
		);
		this._perpMarketConfigs = perpTradableMarkets.map((market) =>
			MARKET_UTILS.getMarketConfig(
				config.driftEnv,
				MarketType.PERP,
				market.marketIndex
			)
		);

		// set up Drift endpoints
		const driftDlobServerHttpUrlToUse =
			config.driftDlobServerHttpUrl ??
			EnvironmentConstants.dlobServerHttpUrl[
				config.driftEnv === 'devnet' ? 'dev' : 'mainnet'
			];
		const swiftServerUrlToUse =
			EnvironmentConstants.swiftServerUrl[
				config.driftEnv === 'devnet' ? 'staging' : 'mainnet'
			];
		const orderbookWebsocketUrlToUse =
			config.orderbookConfig?.dlobWebSocketUrl ??
			EnvironmentConstants.dlobServerWsUrl[
				config.driftEnv === 'devnet' ? 'dev' : 'mainnet'
			];
		this._driftEndpoints = {
			dlobServerHttpUrl: driftDlobServerHttpUrlToUse,
			swiftServerUrl: swiftServerUrlToUse,
			orderbookWebsocketUrl: orderbookWebsocketUrlToUse,
		};

		// we set this up because SerializableTypes
		Initialize(config.driftEnv);

		// set up clients and stores
		const driftClient = this.setupDriftClient(config);
		this.initializePollingDlob(driftDlobServerHttpUrlToUse);
		this.initializeStores(driftClient);
		this.initializeOrderbookManager(
			orderbookWebsocketUrlToUse,
			config.orderbookConfig?.orderbookGrouping
		);
		this.initializePriorityFeeSubscriber(config.priorityFeeSubscriberConfig);
		this.initializeManagers(driftDlobServerHttpUrlToUse, swiftServerUrlToUse);
	}

	public get driftClient(): DriftClient {
		return this._driftClient;
	}

	public get authority(): PublicKey {
		return this._driftClient.wallet.publicKey;
	}

	public get pollingDlob(): PollingDlob {
		return this._pollingDlob;
	}

	public get oraclePriceCache(): OraclePriceLookup {
		return this._oraclePriceCache.store;
	}

	public get markPriceCache(): MarkPriceLookup {
		return this._markPriceCache.store;
	}

	public get userAccountCache(): UserAccountLookup {
		return this._userAccountCache.store;
	}

	public get orderbookCache(): L2WithOracleAndMarketData | null {
		return this._orderbookManager.store;
	}

	public get orderbookManager(): DriftL2OrderbookManager {
		return this._orderbookManager;
	}

	public get tradableMarkets(): MarketId[] {
		return this._tradableMarkets;
	}

	/**
	 * Gets the current geoblock status of the user.
	 *
	 * @returns True if the user is geographically blocked, false otherwise
	 */
	public get isGeoBlocked(): boolean {
		return this._isGeoBlocked;
	}

	/**
	 * The public endpoints that can be used to retrieve Drift data / interact with the Drift program.
	 */
	public get driftEndpoints(): {
		dlobServerHttpUrl: string;
		swiftServerUrl: string;
	} {
		return this._driftEndpoints;
	}

	private set tradableMarkets(tradableMarkets: MarketId[]) {
		this._tradableMarkets = tradableMarkets;
		this._spotMarketConfigs = tradableMarkets
			.filter((market) => !market.isPerp)
			.map((market) =>
				MARKET_UTILS.getMarketConfig(
					this._driftClient.env,
					MarketType.SPOT,
					market.marketIndex
				)
			);
		this._perpMarketConfigs = tradableMarkets
			.filter((market) => market.isPerp)
			.map((market) =>
				MARKET_UTILS.getMarketConfig(
					this._driftClient.env,
					MarketType.PERP,
					market.marketIndex
				)
			);
	}

	public get spotMarketConfigs(): SpotMarketConfig[] {
		return this._spotMarketConfigs;
	}

	public get perpMarketConfigs(): PerpMarketConfig[] {
		return this._perpMarketConfigs;
	}

	private initializeStores(driftClient: DriftClient) {
		this._markPriceCache = new MarkPriceCache();
		this._oraclePriceCache = new OraclePriceCache();
		this._userAccountCache = new UserAccountCache(
			driftClient,
			this._oraclePriceCache,
			this._markPriceCache
		);
	}

	private initializeOrderbookManager(
		orderbookWebsocketUrl: string,
		orderbookGrouping: OrderbookGrouping = DEFAULT_ORDERBOOK_GROUPING
	) {
		this._orderbookManager = new DriftL2OrderbookManager({
			wsUrl: orderbookWebsocketUrl,
			subscriptionConfig: this.selectedTradeMarket
				? {
						...DEFAULT_ORDERBOOK_SUBSCRIPTION_CONFIG,
						grouping: orderbookGrouping,
						marketId: this.selectedTradeMarket,
				  }
				: undefined,
		});
	}

	private initializePollingDlob(driftDlobServerHttpUrl: string) {
		this._pollingDlob = new PollingDlob({
			driftDlobServerHttpUrl: driftDlobServerHttpUrl,
		});
	}

	private initializePriorityFeeSubscriber(
		config?: Partial<PriorityFeeSubscriberConfig>
	) {
		// Convert tradable markets to DriftMarketInfo format for priority fee subscriber
		const driftMarkets = this._tradableMarkets.map((market) => ({
			marketType: market.marketTypeStr,
			marketIndex: market.marketIndex,
		}));

		const priorityFeeConfig: PriorityFeeSubscriberConfig = {
			connection: this.driftClient.connection,
			priorityFeeMethod: PriorityFeeMethod.SOLANA,
			driftMarkets,
			addresses: HIGH_ACTIVITY_MARKET_ACCOUNTS,
			...config,
		};

		this.priorityFeeSubscriber = new PriorityFeeSubscriber(priorityFeeConfig);
	}

	private setupDriftClient(
		config: Omit<AuthorityDriftConfig, 'onUserAccountUpdate'>
	) {
		const driftEnv = config.driftEnv;

		const connection = new Connection(config.solanaRpcEndpoint);
		const driftProgramID = new PublicKey(DRIFT_PROGRAM_ID);
		const accountLoader = new CustomizedCadenceBulkAccountLoader(
			connection,
			DEFAULT_ACCOUNT_LOADER_COMMITMENT,
			DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS
		);
		this.accountLoader = accountLoader;

		const wallet = config.wallet ?? COMMON_UI_UTILS.createPlaceholderIWallet();
		const skipInitialUsersLoad = !config.wallet;

		const perpMarkets =
			config.tradableMarkets
				?.filter((market) => market.isPerp)
				.map((market) =>
					MARKET_UTILS.getMarketConfig(
						driftEnv,
						MarketType.PERP,
						market.marketIndex
					)
				) ?? PerpMarkets[driftEnv];
		const spotMarkets =
			config.tradableMarkets
				?.filter((market) => !market.isPerp)
				.map((market) =>
					MARKET_UTILS.getMarketConfig(
						driftEnv,
						MarketType.SPOT,
						market.marketIndex
					)
				) ?? SpotMarkets[driftEnv];
		const { perpMarketIndexes, spotMarketIndexes, oracleInfos } =
			getMarketsAndOraclesForSubscription(driftEnv, perpMarkets, spotMarkets);

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
			userStats: true,
			includeDelegates: true,
			skipLoadUsers: skipInitialUsersLoad,
			delistedMarketSetting: DelistedMarketSetting.Unsubscribe,
			perpMarketIndexes,
			spotMarketIndexes,
			oracleInfos,
			...config.additionalDriftClientConfig,
		};
		this._driftClient = new DriftClient(driftClientConfig);

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

		return this._driftClient;
	}

	private setupOrderbookManager() {
		this.orderbookSubscription = this._orderbookManager.onUpdate(
			(orderbookData) => {
				const marketKey = new MarketId(
					orderbookData.marketIndex,
					ENUM_UTILS.toObj(orderbookData.marketType as string) as MarketType
				).key;

				const markPrice = orderbookData.markPrice;

				this._markPriceCache.updateMarkPrices({
					marketKey,
					markPrice,
					bestAsk: orderbookData.bestAskPrice,
					bestBid: orderbookData.bestBidPrice,
					lastUpdateSlot: orderbookData.slot ?? 0,
				});

				this._oraclePriceCache.updateOraclePrices({
					...orderbookData.oracleData,
					marketKey,
				});
			}
		);
	}

	private setupPollingDlob() {
		// DriftL2OrderbookManager will handle the fetching of data for the selected trade market through websocket

		this._pollingDlob.addInterval(
			PollingCategory.USER_INVOLVED,
			POLLING_INTERVALS.BACKGROUND_DEEP,
			POLLING_DEPTHS.DEEP
		); // markets that the user is involved in
		this._pollingDlob.addInterval(
			PollingCategory.USER_NOT_INVOLVED,
			POLLING_INTERVALS.BACKGROUND_SHALLOW,
			POLLING_DEPTHS.SHALLOW
		); // markets that the user is not involved in

		// add all markets to the user-not-involved interval first, until user-involved markets are known
		this._pollingDlob.addMarketsToInterval(
			PollingCategory.USER_NOT_INVOLVED,
			this._tradableMarkets.map((market) => market.key)
		);

		this.pollingDlobSubscription = this._pollingDlob
			.onData()
			.subscribe((data) => {
				const updatedMarkPrices = data.map((marketData) => {
					return {
						marketKey: marketData.marketId.key,
						markPrice: marketData.data.markPrice,
						bestBid: marketData.data.bestBidPrice,
						bestAsk: marketData.data.bestAskPrice,
						lastUpdateSlot: marketData.data.slot ?? 0,
					};
				});
				const updatedOraclePrices = data.map((marketData) => {
					return {
						marketKey: marketData.marketId.key,
						...marketData.data.oracleData,
					};
				});

				this._markPriceCache.updateMarkPrices(...updatedMarkPrices);
				this._oraclePriceCache.updateOraclePrices(...updatedOraclePrices);
			});
	}

	private initializeManagers(
		dlobServerHttpUrl: string,
		swiftServerUrl: string
	) {
		// Initialize trading operations
		this.driftOperations = new DriftOperations(
			this._driftClient,
			() => this._userAccountCache,
			dlobServerHttpUrl,
			swiftServerUrl,
			() => this.priorityFeeSubscriber.getCustomStrategyResult()
		);

		// Initialize subscription manager with all subscription and market operations
		this.subscriptionManager = new SubscriptionManager(
			this._driftClient,
			this.accountLoader,
			this._pollingDlob,
			this._orderbookManager,
			this._userAccountCache,
			this._tradableMarkets,
			this.selectedTradeMarket
		);
	}

	private unsubscribeFromPollingDlob() {
		this.pollingDlobSubscription?.unsubscribe();
		this.pollingDlobSubscription = null;

		this._pollingDlob.stop();
	}

	private unsubscribeFromOrderbook() {
		this.orderbookSubscription?.unsubscribe();
		this.orderbookSubscription = null;

		this._orderbookManager.unsubscribe();
	}

	public async subscribe() {
		const handleGeoBlock = async () => {
			try {
				this._isGeoBlocked = (await checkGeoBlock()) ?? false;
			} catch (error) {
				console.warn('Failed to check geoblock status:', error);
				this._isGeoBlocked = false; // Default to not blocked if check fails
			}
		};

		// async logic that doesn't require DriftClient to be subscribed
		const handleGeoBlockPromise = handleGeoBlock();
		const pollingDlobStartPromise = this._pollingDlob.start();
		const priorityFeeSubscribePromise = this.priorityFeeSubscriber.subscribe();
		const orderbookSubscribePromise = this._orderbookManager.subscribe();

		await this._driftClient.subscribe();

		// filter out markets that are delisted
		const actualTradableMarkets = this._tradableMarkets.filter((market) => {
			const marketAccount = market.isPerp
				? this._driftClient.getPerpMarketAccount(market.marketIndex)
				: this._driftClient.getSpotMarketAccount(market.marketIndex);

			if (
				!marketAccount ||
				DELISTED_MARKET_STATUSES.some((marketStatus) =>
					ENUM_UTILS.match(marketAccount.status, marketStatus)
				)
			) {
				return false;
			}

			return true;
		});

		this._tradableMarkets = actualTradableMarkets;
		this.subscriptionManager.updateTradableMarkets(actualTradableMarkets);
		this.setupPollingDlob();
		this.setupOrderbookManager();

		const subscribeToNonWhitelistedButUserInvolvedMarketsPromise =
			this.subscriptionManager.subscribeToNonWhitelistedButUserInvolvedMarkets(
				this._driftClient.getUsers()
			);

		await Promise.all([
			pollingDlobStartPromise,
			subscribeToNonWhitelistedButUserInvolvedMarketsPromise,
			priorityFeeSubscribePromise,
			handleGeoBlockPromise,
			orderbookSubscribePromise,
		]);

		this.subscriptionManager.subscribeToAllUsersUpdates();

		// TODO: subscribe to oracle price updates from drift client?
	}

	public async unsubscribe() {
		this.unsubscribeFromPollingDlob();
		this.unsubscribeFromOrderbook();
		this._userAccountCache.destroy();
		this._markPriceCache.destroy();
		this._orderbookManager.destroy();

		const driftClientUnsubscribePromise = this._driftClient.unsubscribe();
		const priorityFeeUnsubscribePromise =
			this.priorityFeeSubscriber.unsubscribe();

		await Promise.all(
			[driftClientUnsubscribePromise, priorityFeeUnsubscribePromise].filter(
				Boolean
			)
		);

		this.pollingDlobSubscription = null;
	}

	public onOraclePricesUpdate(
		callback: (oraclePrice: OraclePriceLookup) => void
	) {
		return this._oraclePriceCache.onUpdate(callback);
	}

	public onMarkPricesUpdate(callback: (markPrice: MarkPriceLookup) => void) {
		return this._markPriceCache.onUpdate(callback);
	}

	public onUserAccountUpdate(
		callback: (userAccount: EnhancedAccountData) => void
	) {
		return this._userAccountCache.onUpdate(callback);
	}

	public onOrderbookUpdate(
		callback: (orderbook: L2WithOracleAndMarketData) => void
	) {
		return this._orderbookManager.onUpdate(callback);
	}

	/**
	 * Updates the authority (wallet) for the drift client and reestablishes subscriptions.
	 *
	 * @param wallet - The new wallet to use as authority
	 * @param activeSubAccountId - Optional subaccount ID to switch to after wallet update
	 */
	public async updateAuthority(wallet: IWallet, activeSubAccountId?: number) {
		return this.subscriptionManager.updateAuthority(wallet, activeSubAccountId);
	}

	/**
	 * Updates the selected trade market and optimizes subscription polling.
	 *
	 * @param newSelectedTradeMarket - The new market to prioritize for trading
	 */
	public updateSelectedTradeMarket(newSelectedTradeMarket: MarketId | null) {
		const isNewSelectedTradeMarket =
			!!newSelectedTradeMarket !== !!this.selectedTradeMarket || // only one of them is null
			(!!newSelectedTradeMarket && // or both are not null and are different
				!!this.selectedTradeMarket &&
				!this.selectedTradeMarket.equals(newSelectedTradeMarket));

		if (!isNewSelectedTradeMarket) {
			return;
		}

		// Update the local reference
		this.selectedTradeMarket = newSelectedTradeMarket;

		// Delegate to subscription manager for all polling optimization
		this.subscriptionManager.updateSelectedTradeMarket(newSelectedTradeMarket);
	}

	/**
	 * Creates a new user account and deposits initial collateral.
	 *
	 * @param params - Parameters for creating user and depositing collateral
	 * @returns Promise resolving to transaction signature and user account public key
	 */
	public async createUserAndDeposit(
		params: CreateUserAndDepositParams
	): Promise<{
		txSig: TransactionSignature;
		user: User;
	}> {
		return this.driftOperations.createUserAndDeposit(params);
	}

	/**
	 * Creates a RevenueShareEscrow account for the user.
	 *
	 * @param params - Parameters for creating a RevenueShareEscrow account
	 * @returns Promise resolving to the transaction signature of the creation
	 */
	public async createRevenueShareEscrow(
		params: CreateRevenueShareEscrowParams
	): Promise<TransactionSignature> {
		return this.driftOperations.createRevenueShareEscrow(params);
	}

	/**
	 * Deposits collateral into a user's spot market position.
	 *
	 * @param params - Parameters for the deposit operation
	 * @returns Promise resolving to the transaction signature
	 */
	public async deposit(params: DepositParams): Promise<TransactionSignature> {
		return this.driftOperations.deposit(params);
	}

	/**
	 * Withdraws collateral from a user's spot market position.
	 *
	 * @param params - Parameters for the withdrawal operation
	 * @returns Promise resolving to the transaction signature
	 */
	public async withdraw(params: WithdrawParams): Promise<TransactionSignature> {
		return this.driftOperations.withdraw(params);
	}

	/**
	 * Opens a perpetual market order.
	 *
	 * @param params - Parameters for the perp order
	 * @returns Promise resolving to the transaction signature
	 */
	@enforceGeoBlock
	public async openPerpOrder(
		params: PerpOrderParams
	): Promise<TransactionSignature | void> {
		return this.driftOperations.openPerpOrder(params);
	}

	/**
	 * Executes a swap between two spot markets.
	 *
	 * @param params - Parameters for the swap operation
	 * @returns Promise resolving to the transaction signature
	 */
	public async swap(params: SwapParams): Promise<TransactionSignature> {
		return this.driftOperations.swap(params);
	}

	public async getSwapQuote(
		params: Omit<SwapParams, 'quote'> & {
			slippageBps?: number;
			swapMode?: SwapMode;
			onlyDirectRoutes?: boolean;
		}
	): Promise<QuoteResponse> {
		return this.driftOperations.getSwapQuote(params);
	}

	/**
	 * Settles profit and loss for a perpetual position.
	 *
	 * @param params - Parameters for the settle PnL operation
	 * @returns Promise resolving to the transaction signature
	 */
	public async settleAccountPnl(
		params: SettleAccountPnlParams
	): Promise<TransactionSignature> {
		return this.driftOperations.settleAccountPnl(params);
	}

	/**
	 * Deletes a user account from the Drift protocol.
	 *
	 * @param subAccountId - The ID of the sub-account to delete
	 * @returns Promise resolving to the transaction signature of the deletion
	 */
	public async deleteUser(subAccountId: number): Promise<TransactionSignature> {
		return this.driftOperations.deleteUser(subAccountId);
	}

	/**
	 * Cancels a list of open orders.
	 *
	 * @param params - See `CancelOrdersParams`
	 * @returns Promise resolving to the transaction signature of the cancellation
	 */
	public async cancelOrders(
		params: CancelOrdersParams
	): Promise<TransactionSignature> {
		return this.driftOperations.cancelOrders(params);
	}

	public getTxParams(overrides?: Partial<TxParams>): TxParams {
		return this.driftOperations.getTxParams(overrides);
	}
}
