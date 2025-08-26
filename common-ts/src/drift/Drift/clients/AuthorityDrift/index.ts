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
	AccountData,
	UserAccountCache,
	UserAccountLookup,
} from '../../stores/UserAccountCache';
import { ENUM_UTILS } from '../../../../utils';
import { SubscriptionManager } from './SubscriptionManager';
import { DriftOperations } from './DriftOperations';
import {
	CreateUserAndDepositParams,
	DepositParams,
	WithdrawParams,
	PerpOrderParams,
	SwapParams,
	SettleAccountPnlParams,
} from './DriftOperations/types';
import { Initialize } from '../../../../Config';
import { SwiftOrderResult } from 'src/drift/base/actions/trade/openPerpOrder/openPerpMarketOrder';

export interface AuthorityDriftConfig {
	solanaRpcEndpoint: string;
	driftEnv: DriftEnv;
	wallet?: IWallet;
	driftDlobServerHttpUrl?: string;
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
	private driftClient!: DriftClient;

	/**
	 * Handles bulk account loading from the RPC.
	 */
	private accountLoader!: CustomizedCadenceBulkAccountLoader;

	/**
	 * Handles polling the DLOB server for mark price and oracle price data for markets.
	 * It is also the fallback source for orderbook data, if the websocket DLOB subscriber is unavailable.
	 */
	private pollingDlob!: PollingDlob;

	/**
	 * Subscription to the polling DLOB data.
	 */
	private pollingDlobSubscription: Subscription | null = null;

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
				config.driftEnv === 'devnet' ? 'dev' : 'mainnet'
			];
		this._driftEndpoints = {
			dlobServerHttpUrl: driftDlobServerHttpUrlToUse,
			swiftServerUrl: swiftServerUrlToUse,
		};

		// we set this up because SerializableTypes
		Initialize(config.driftEnv);

		// set up clients and stores
		const driftClient = this.setupDriftClient(config);
		this.initializePollingDlob(driftDlobServerHttpUrlToUse);
		this.initializeStores(driftClient);
		this.initializeManagers(driftDlobServerHttpUrlToUse);
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

	public get tradableMarkets(): MarketId[] {
		return this._tradableMarkets;
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
					this.driftClient.env,
					MarketType.SPOT,
					market.marketIndex
				)
			);
		this._perpMarketConfigs = tradableMarkets
			.filter((market) => market.isPerp)
			.map((market) =>
				MARKET_UTILS.getMarketConfig(
					this.driftClient.env,
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

	private initializePollingDlob(driftDlobServerHttpUrl: string) {
		this.pollingDlob = new PollingDlob({
			driftDlobServerHttpUrl: driftDlobServerHttpUrl,
		});
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
		this.pollingDlob.addInterval(PollingCategory.ORDERBOOK, 1, 100); // used to get orderbook data. this is mainly used as a fallback from the Websocket DLOB subscriber
		this.pollingDlob.addInterval(PollingCategory.SELECTED_MARKET, 1, 1); // used to get the mark price at a higher frequency for the current active market (e.g. market that the user is trading on). this won't be needed when the websocket DLOB is set up
		this.pollingDlob.addInterval(PollingCategory.USER_INVOLVED, 2, 1); // markets that the user is involved in
		this.pollingDlob.addInterval(PollingCategory.USER_NOT_INVOLVED, 30, 1); // markets that the user is not involved in

		// add all markets to the user-not-involved interval first, until user-involved markets are known
		this.pollingDlob.addMarketsToInterval(
			'user-not-involved',
			this._tradableMarkets.map((market) => market.key)
		);
		if (this.selectedTradeMarket) {
			this.pollingDlob.addMarketToInterval(
				'active-market',
				this.selectedTradeMarket.key
			);
		}

		this.pollingDlobSubscription = this.pollingDlob
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
						price: marketData.data.oracleData.price,
						lastUpdateSlot: marketData.data.oracleData.slot,
					};
				});

				this._markPriceCache.updateMarkPrices(...updatedMarkPrices);
				this._oraclePriceCache.updateOraclePrices(...updatedOraclePrices);
			});
	}

	private initializeManagers(dlobServerHttpUrl: string) {
		// Initialize trading operations
		this.driftOperations = new DriftOperations(
			this.driftClient,
			() => this._userAccountCache,
			dlobServerHttpUrl,
			EnvironmentConstants.swiftServerUrl[
				this.driftClient.env === 'mainnet-beta' ? 'mainnet' : 'dev'
			]
		);

		// Initialize subscription manager with all subscription and market operations
		this.subscriptionManager = new SubscriptionManager(
			this.driftClient,
			this.accountLoader,
			this.pollingDlob,
			this._userAccountCache,
			this._tradableMarkets,
			this.selectedTradeMarket
		);
	}

	private unsubscribeFromPollingDlob() {
		this.pollingDlobSubscription?.unsubscribe();
		this.pollingDlobSubscription = null;

		this.pollingDlob.stop();
	}

	public async subscribe() {
		await this.driftClient.subscribe();

		// filter out markets that are delisted
		const actualTradableMarkets = this._tradableMarkets.filter((market) => {
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

		this._tradableMarkets = actualTradableMarkets;
		this.subscriptionManager.updateTradableMarkets(actualTradableMarkets);
		this.setupPollingDlob();

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

	public onUserAccountUpdate(callback: (userAccount: AccountData) => void) {
		return this._userAccountCache.onUpdate(callback);
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
		user: User;
	}> {
		return this.driftOperations.createUserAndDeposit(params);
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
	public async openPerpOrder(
		params: PerpOrderParams
	): Promise<TransactionSignature | SwiftOrderResult> {
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
		params: Omit<SwapParams, 'jupiterQuote'> & {
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
	public async settlePnl(
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
}
