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
	PerpMarkets,
	SpotMarkets,
	WhileValidTxSender,
} from '@drift-labs/sdk';
import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';
import { COMMON_UI_UTILS } from '../../../../common-ui-utils/commonUiUtils';
import {
	DEFAULT_ACCOUNT_LOADER_COMMITMENT,
	DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS,
	DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY,
	DEFAULT_TX_SENDER_RETRY_INTERVAL,
	DELISTED_MARKET_STATUSES,
	PollingCategory,
} from '../../constants';
import { MarketId } from '../../../../types';
import { MARKET_UTILS } from '../../../../common-ui-utils/market';
import { PollingDlob } from '../../data/PollingDlob';
import { EnvironmentConstants } from '../../../../EnvironmentConstants';
import { MarkPriceLookup, MarkPriceCache } from '../../stores/MarkPriceCache';
import {
	OraclePriceLookup,
	OraclePriceCache,
} from '../../stores/OraclePriceCache';
import { Subscription } from 'rxjs';
import {
	UserAccountCache,
	UserAccountLookup,
} from '../../stores/UserAccountCache';
import { ENUM_UTILS } from '../../../../utils';
import { SubscriptionManager } from './SubscriptionManager';
import {
	TradingOperations,
	CreateUserAndDepositParams,
	DepositParams,
	WithdrawParams,
	PerpOrderParams,
	SwapParams,
	SettlePnlParams,
} from './TradingOperations';

export interface AuthorityDriftConfig {
	solanaRpcEndpoint: string;
	driftEnv: DriftEnv;
	wallet?: IWallet;
	driftDlobServerHttpUrl?: string;
	onUserAccountUpdate?: (userPubKey: PublicKey) => void;
	tradableMarkets?: MarketId[];
	selectedTradeMarket?: MarketId;
	additionalDriftClientConfig?: Partial<Omit<DriftClientConfig, 'env'>>;
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
	private driftClient: DriftClient;

	/**
	 * Handles bulk account loading from the RPC.
	 */
	private accountLoader: CustomizedCadenceBulkAccountLoader;

	/**
	 * Handles polling the DLOB server for mark price and oracle price data for markets.
	 * It is also the fallback source for orderbook data, if the websocket DLOB subscriber is unavailable.
	 */
	private pollingDlob: PollingDlob;

	/**
	 * Subscription to the polling DLOB data.
	 */
	private pollingDlobSubscription: Subscription;

	/**
	 * Handles all trading operations including deposits, withdrawals, and position management.
	 */
	private tradingOps: TradingOperations;

	/**
	 * Manages all subscription operations including user accounts, market subscriptions, and polling optimization.
	 */
	private subscriptionManager: SubscriptionManager;

	/**
	 * Stores the fetched mark prices for all tradable markets.
	 * Mark price sources includes:
	 * - Websocket DLOB subscriber (active market, derived when fetching orderbook data)
	 * - Polling DLOB server (all non-active markets)
	 */
	private _markPriceCache: MarkPriceCache;

	/**
	 * Stores the fetched oracle prices for all tradable markets.
	 * Oracle price sources includes:
	 * - DriftClient oracle account subscriptions
	 * - Polling DLOB server (all non-active markets)
	 */
	private _oraclePriceCache: OraclePriceCache;

	/**
	 * Stores the fetched user account data for all user accounts.
	 */
	private _userAccountCache: UserAccountCache;

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
	private tradableMarkets: MarketId[] = [];

	private driftDlobServerHttpUrl: string | undefined;

	/**
	 * @param solanaRpcEndpoint - The Solana RPC endpoint to use for reading RPC data.
	 * @param driftEnv - The drift environment to use for the drift client.
	 * @param authority - The authority (wallet) whose user accounts to subscribe to.
	 * @param onUserAccountUpdate - The function to call when a user account is updated.
	 * @param tradableMarkets - The markets that are tradable through this client.
	 * @param selectedTradeMarket - The active trade market to use for the drift client. This is used to subscribe to the market account, oracle data and mark price more frequently compared to the other markets.
	 * @param additionalDriftClientConfig - Additional DriftClient config to use for the DriftClient.
	 */
	constructor(config: AuthorityDriftConfig) {
		this.selectedTradeMarket = config.selectedTradeMarket ?? null;
		this.driftDlobServerHttpUrl = config.driftDlobServerHttpUrl;

		const perpTradableMarkets = PerpMarkets[config.driftEnv].map(
			(marketConfig) => MarketId.createPerpMarket(marketConfig.marketIndex)
		);
		const spotTradableMarkets = SpotMarkets[config.driftEnv].map(
			(marketConfig) => MarketId.createSpotMarket(marketConfig.marketIndex)
		);

		this.tradableMarkets = config.tradableMarkets ?? [
			...perpTradableMarkets,
			...spotTradableMarkets,
		];

		const driftClient = this.setupDriftClient(config);
		this.setupStores(driftClient);
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

	private setupStores(driftClient: DriftClient) {
		this._markPriceCache = new MarkPriceCache();
		this._oraclePriceCache = new OraclePriceCache();
		this._userAccountCache = new UserAccountCache(
			driftClient,
			this._oraclePriceCache,
			this._markPriceCache
		);
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

		return this.driftClient;
	}

	private setupPollingDlob() {
		const driftDlobServerHttpUrlToUse =
			this.driftDlobServerHttpUrl ??
			EnvironmentConstants.dlobServerHttpUrl[
				this.driftClient.env === 'devnet' ? 'dev' : 'mainnet'
			];

		const pollingDlob = new PollingDlob({
			driftDlobServerHttpUrl: driftDlobServerHttpUrlToUse,
		});

		pollingDlob.addInterval(PollingCategory.ORDERBOOK, 1, 100); // used to get orderbook data. this is mainly used as a fallback from the Websocket DLOB subscriber
		pollingDlob.addInterval(PollingCategory.SELECTED_MARKET, 1, 1); // used to get the mark price at a higher frequency for the current active market (e.g. market that the user is trading on). this won't be needed when the websocket DLOB is set up
		pollingDlob.addInterval(PollingCategory.USER_INVOLVED, 2, 1); // markets that the user is involved in
		pollingDlob.addInterval(PollingCategory.USER_NOT_INVOLVED, 30, 1); // markets that the user is not involved in

		// add all markets to the user-not-involved interval first, until user-involved markets are known
		pollingDlob.addMarketsToInterval(
			'user-not-involved',
			this.tradableMarkets.map((market) => market.key)
		);
		if (this.selectedTradeMarket) {
			pollingDlob.addMarketToInterval(
				'active-market',
				this.selectedTradeMarket.key
			);
		}

		this.pollingDlobSubscription = pollingDlob.onData().subscribe((data) => {
			const updatedMarkPrices = data.map((marketData) => {
				return {
					marketKey: marketData.marketId.key,
					markPrice: marketData.data.markPrice,
					bestBid: marketData.data.bestBidPrice,
					bestAsk: marketData.data.bestAskPrice,
					lastUpdateSlot: marketData.data.slot,
				};
			});
			const updatedOraclePrices = data.map((marketData) => {
				return {
					marketKey: marketData.marketId.key,
					price: marketData.data.oracleData.price,
					lastUpdateSlot: marketData.data.oracleData.slot,
				};
			});

			this._markPriceCache.updateMarkPrices(...updatedMarkPrices);
			this._oraclePriceCache.updateOraclePrices(...updatedOraclePrices);
		});

		this.pollingDlob = pollingDlob;
	}

	private initializeManagers() {
		// Initialize trading operations
		this.tradingOps = new TradingOperations(
			this.driftClient,
			this._userAccountCache
		);

		// Initialize subscription manager with all subscription and market operations
		this.subscriptionManager = new SubscriptionManager(
			this.driftClient,
			this.accountLoader,
			this.pollingDlob,
			this._userAccountCache,
			this.tradableMarkets,
			this.selectedTradeMarket
		);
	}

	private unsubscribeFromPollingDlob() {
		this.pollingDlobSubscription.unsubscribe();
		this.pollingDlobSubscription = null;

		this.pollingDlob.stop();
	}

	public async subscribe() {
		await this.driftClient.subscribe();

		// filter out markets that are delisted
		const actualTradableMarkets = this.tradableMarkets.filter((market) => {
			const marketAccount = market.isPerp
				? this.driftClient.getPerpMarketAccount(market.marketIndex)
				: this.driftClient.getSpotMarketAccount(market.marketIndex);

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

		this.tradableMarkets = actualTradableMarkets;
		this.setupPollingDlob();
		this.initializeManagers();

		const pollingDlobStartPromise = this.pollingDlob.start();

		const subscribeToNonWhitelistedButUserInvolvedMarketsPromise =
			this.subscriptionManager.subscribeToNonWhitelistedButUserInvolvedMarkets(
				this.driftClient.getUsers()
			);

		await Promise.all([
			pollingDlobStartPromise,
			subscribeToNonWhitelistedButUserInvolvedMarketsPromise,
		]);

		this.subscriptionManager.subscribeToAllUsersUpdates();

		// TODO: subscribe to oracle price updates from drift client?
	}

	public async unsubscribe() {
		this.unsubscribeFromPollingDlob();
		this._userAccountCache.reset();

		const driftClientUnsubscribePromise = this.driftClient.unsubscribe();

		await Promise.all([driftClientUnsubscribePromise]);

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
	 * @param selectedTradeMarket - The new market to prioritize for trading
	 */
	public async updateSelectedTradeMarket(selectedTradeMarket: MarketId) {
		// Update the local reference
		this.selectedTradeMarket = selectedTradeMarket;

		// Delegate to subscription manager for all polling optimization
		this.subscriptionManager.updateSelectedTradeMarket(selectedTradeMarket);
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
		userAccountPublicKey: PublicKey;
	}> {
		return this.tradingOps.createUserAndDeposit(params);
	}

	/**
	 * Deposits collateral into a user's spot market position.
	 *
	 * @param params - Parameters for the deposit operation
	 * @returns Promise resolving to the transaction signature
	 */
	public async deposit(params: DepositParams): Promise<TransactionSignature> {
		return this.tradingOps.deposit(params);
	}

	/**
	 * Withdraws collateral from a user's spot market position.
	 *
	 * @param params - Parameters for the withdrawal operation
	 * @returns Promise resolving to the transaction signature
	 */
	public async withdraw(params: WithdrawParams): Promise<TransactionSignature> {
		return this.tradingOps.withdraw(params);
	}

	/**
	 * Opens a perpetual market order.
	 *
	 * @param params - Parameters for the perp order
	 * @returns Promise resolving to the transaction signature
	 */
	public async openPerpMarketOrder(
		params: PerpOrderParams
	): Promise<TransactionSignature> {
		return this.tradingOps.openPerpMarketOrder(params);
	}

	/**
	 * Executes a swap between two spot markets.
	 *
	 * @param params - Parameters for the swap operation
	 * @returns Promise resolving to the transaction signature
	 */
	public async swap(params: SwapParams): Promise<TransactionSignature> {
		return this.tradingOps.swap(params);
	}

	/**
	 * Settles profit and loss for a perpetual position.
	 *
	 * @param params - Parameters for the settle PnL operation
	 * @returns Promise resolving to the transaction signature
	 */
	public async settlePnl(
		params: SettlePnlParams
	): Promise<TransactionSignature> {
		return this.tradingOps.settlePnl(params);
	}
}
