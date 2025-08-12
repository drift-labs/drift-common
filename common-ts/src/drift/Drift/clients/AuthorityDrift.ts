import {
	BigNum,
	CustomizedCadenceBulkAccountLoader,
	DelistedMarketSetting,
	DRIFT_PROGRAM_ID,
	DriftClient,
	DriftClientConfig,
	DriftEnv,
	getMarketsAndOraclesForSubscription,
	IWallet,
	MarketType,
	PerpMarketAccount,
	PerpMarkets,
	PollingDriftClientAccountSubscriber,
	PublicKey,
	ReferrerInfo,
	SpotMarketAccount,
	SpotMarkets,
	User,
	WhileValidTxSender,
	ZERO,
} from '@drift-labs/sdk';
import { Connection, TransactionSignature } from '@solana/web3.js';
import { COMMON_UI_UTILS } from '../../../common-ui-utils/commonUiUtils';
import {
	DEFAULT_ACCOUNT_LOADER_COMMITMENT,
	DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS,
	DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY,
	DEFAULT_TX_SENDER_RETRY_INTERVAL,
	DELISTED_MARKET_STATUSES,
	PollingCategory,
	SELECTED_MARKET_ACCOUNT_POLLING_CADENCE,
	USER_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE,
	USER_NOT_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE,
} from '../constants';
import { MarketId, MarketKey } from '../../../types';
import { MARKET_UTILS } from '../../../common-ui-utils/market';
import { PollingDlob } from '../data/PollingDlob';
import { EnvironmentConstants } from '../../../EnvironmentConstants';
import { MarkPriceLookup, MarkPriceCache } from '../stores/MarkPriceCache';
import {
	OraclePriceLookup,
	OraclePriceCache,
} from '../stores/OraclePriceCache';
import { Subscription } from 'rxjs';
import {
	UserAccountCache,
	UserAccountLookup,
} from '../stores/UserAccountCache';
import { getTokenAddressForDepositAndWithdraw } from '../../../utils/token';
import { USER_UTILS } from '../../../common-ui-utils/user';
import { MAIN_POOL_ID } from '../../../constants';
import { TRADING_UTILS } from '../../../common-ui-utils/trading';
import { ENUM_UTILS } from '../../../utils';

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

	private unsubscribeFromPollingDlob() {
		this.pollingDlobSubscription.unsubscribe();
		this.pollingDlobSubscription = null;

		this.pollingDlob.stop();
	}

	private subscribeToAllUsersUpdates() {
		const users = this.driftClient.getUsers();

		this.handleSubscriptionUpdatesOnUserUpdates(...users);

		users.forEach((user) => {
			user.eventEmitter.on('update', () => {
				this.handleSubscriptionUpdatesOnUserUpdates(...users);
				this._userAccountCache.updateUserAccount(user);
			});
		});
	}

	private categorizeMarketsByUserInvolvement(...users: User[]): {
		userInvolvedMarkets: MarketId[];
		userNotInvolvedMarkets: MarketId[];
	} {
		const perpMarketIndexesSet = new Set<number>();
		const spotMarketIndexesSet = new Set<number>();
		users.forEach((user) => {
			const { activePerpPositions, activeSpotPositions } =
				user.getActivePositions();
			activePerpPositions.forEach((marketIndex) =>
				perpMarketIndexesSet.add(marketIndex)
			);
			activeSpotPositions.forEach((marketIndex) =>
				spotMarketIndexesSet.add(marketIndex)
			);
		});

		const userInvolvedMarkets = Array.from(perpMarketIndexesSet)
			.map((index) => MarketId.createPerpMarket(index))
			.concat(
				Array.from(spotMarketIndexesSet).map((index) =>
					MarketId.createSpotMarket(index)
				)
			)
			.filter((market) => market.key !== this.selectedTradeMarket?.key);
		const userInvolvedMarketKeys = userInvolvedMarkets.map(
			(market) => market.key
		);
		const userNotInvolvedMarkets = this.tradableMarkets
			.filter((market) => !userInvolvedMarketKeys.includes(market.key))
			.filter((market) => market.key !== this.selectedTradeMarket?.key);

		return { userInvolvedMarkets, userNotInvolvedMarkets };
	}

	/**
	 * Updates the polling cadence for a market account and its oracle account.
	 */
	private updateMarketAccountCadence(market: MarketId, newCadence: number) {
		const marketAccount = market.isPerp
			? this.driftClient.getPerpMarketAccount(market.marketIndex)
			: this.driftClient.getSpotMarketAccount(market.marketIndex);

		const currentMarketCadence = this.accountLoader.getAccountCadence(
			marketAccount.pubkey
		);

		if (currentMarketCadence !== newCadence) {
			this.accountLoader.setCustomPollingFrequency(
				marketAccount.pubkey,
				newCadence
			);
		}

		const oracleAccountPubKey = market.isPerp
			? (marketAccount as PerpMarketAccount).amm.oracle
			: (marketAccount as SpotMarketAccount).oracle;

		const currentOracleCadence =
			this.accountLoader.getAccountCadence(oracleAccountPubKey);

		if (currentOracleCadence !== newCadence) {
			this.accountLoader.setCustomPollingFrequency(
				oracleAccountPubKey,
				newCadence
			);
		}
	}

	private updateAccountLoaderCadenceForMarkets(
		userInvolvedMarkets: MarketId[],
		userNotInvolvedMarkets: MarketId[]
	) {
		if (this.selectedTradeMarket) {
			this.updateMarketAccountCadence(
				this.selectedTradeMarket,
				SELECTED_MARKET_ACCOUNT_POLLING_CADENCE
			);
		}

		userInvolvedMarkets.forEach((market) => {
			this.updateMarketAccountCadence(
				market,
				USER_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE
			);
		});

		userNotInvolvedMarkets.forEach((market) => {
			this.updateMarketAccountCadence(
				market,
				USER_NOT_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE
			);
		});
	}

	private updatePollingDlobIntervals(
		userInvolvedMarkets: MarketKey[],
		userNotInvolvedMarkets: MarketKey[]
	) {
		if (this.selectedTradeMarket) {
			this.pollingDlob.addMarketToInterval(
				PollingCategory.SELECTED_MARKET,
				this.selectedTradeMarket.key
			);
		}
		this.pollingDlob.addMarketsToInterval(
			PollingCategory.USER_INVOLVED,
			userInvolvedMarkets
		);
		this.pollingDlob.addMarketsToInterval(
			PollingCategory.USER_NOT_INVOLVED,
			userNotInvolvedMarkets
		);
	}

	/**
	 * When a user account data is updated, we want to ensure that all markets (both spot and perp)
	 * that the user is involved in, are subscribed to:
	 * - for polling mark and oracle prices on the dlob, we want to poll them at a higher frequency
	 * - for market account and oracle account subscription thru DriftClient, we want to poll them at a higher frequency
	 *
	 * Note: If the user has an active position in a market that is not in the tradableMarkets,
	 * the market's oracle price, mark price and market account will still be subscribed to.
	 * This ensures that the state is accurate for the user.
	 */
	private handleSubscriptionUpdatesOnUserUpdates(...users: User[]) {
		const { userInvolvedMarkets, userNotInvolvedMarkets } =
			this.categorizeMarketsByUserInvolvement(...users);

		// update market account cadences
		this.updateAccountLoaderCadenceForMarkets(
			userInvolvedMarkets,
			userNotInvolvedMarkets
		);

		// handle polling dlob polling intervals
		this.updatePollingDlobIntervals(
			userInvolvedMarkets.map((market) => market.key),
			userNotInvolvedMarkets.map((market) => market.key)
		);
	}

	private async subscribeToNonWhitelistedButUserInvolvedMarkets(users: User[]) {
		const perpMarketIndexesSet = new Set(
			(
				this.driftClient
					.accountSubscriber as PollingDriftClientAccountSubscriber
			).perpMarketIndexes
		);
		const spotMarketIndexesSet = new Set(
			(
				this.driftClient
					.accountSubscriber as PollingDriftClientAccountSubscriber
			).spotMarketIndexes
		);

		const { userInvolvedMarkets } = this.categorizeMarketsByUserInvolvement(
			...users
		);

		userInvolvedMarkets.forEach((market) => {
			if (market.isPerp) {
				perpMarketIndexesSet.add(market.marketIndex);
			} else {
				spotMarketIndexesSet.add(market.marketIndex);
			}
		});

		(
			this.driftClient.accountSubscriber as PollingDriftClientAccountSubscriber
		).perpMarketIndexes = Array.from(perpMarketIndexesSet);
		(
			this.driftClient.accountSubscriber as PollingDriftClientAccountSubscriber
		).spotMarketIndexes = Array.from(spotMarketIndexesSet);

		// TODO: see if this can be optimized - instead of unsubscribing and resubscribing, find a way to add the new markets to the existing subscription
		await (
			this.driftClient.accountSubscriber as PollingDriftClientAccountSubscriber
		).unsubscribe();
		await (
			this.driftClient.accountSubscriber as PollingDriftClientAccountSubscriber
		).subscribe();
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

		await this.pollingDlob.start();

		await this.subscribeToNonWhitelistedButUserInvolvedMarkets(
			this.driftClient.getUsers()
		);

		this.subscribeToAllUsersUpdates();

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

	public async updateAuthority(wallet: IWallet, activeSubAccountId?: number) {
		if (this.driftClient.wallet.publicKey.equals(wallet.publicKey)) {
			return;
		}

		await Promise.all(this.driftClient.unsubscribeUsers());
		this._userAccountCache.reset();

		const updateWalletResult = await this.driftClient.updateWallet(
			wallet,
			undefined,
			activeSubAccountId,
			true,
			undefined
		);

		await this.subscribeToNonWhitelistedButUserInvolvedMarkets(
			this.driftClient.getUsers()
		);

		if (!updateWalletResult) {
			throw new Error('Failed to update wallet');
		}

		if (activeSubAccountId) {
			await this.driftClient.switchActiveUser(activeSubAccountId);
		}

		this.subscribeToAllUsersUpdates();
	}

	public async updateSelectedTradeMarket(selectedTradeMarket: MarketId) {
		const previousSelectedTradeMarket = this.selectedTradeMarket;

		if (previousSelectedTradeMarket) {
			this.pollingDlob.removeMarketFromInterval(
				PollingCategory.SELECTED_MARKET,
				previousSelectedTradeMarket.key
			);
		}

		// update the selected trade market
		this.selectedTradeMarket = selectedTradeMarket;
		this.pollingDlob.addMarketToInterval(
			PollingCategory.SELECTED_MARKET,
			selectedTradeMarket.key
		);
		this.updateMarketAccountCadence(
			selectedTradeMarket,
			SELECTED_MARKET_ACCOUNT_POLLING_CADENCE
		);

		// add the previous selected market to the appropriate polling interval
		let isUserInvolvedInPreviousSelectedTradeMarket = false;
		const allUsers = this._userAccountCache.allUsers;
		for (const user of allUsers) {
			const { activePerpPositions, activeSpotPositions } =
				user.userClient.getActivePositions();
			if (
				activePerpPositions.includes(previousSelectedTradeMarket.marketIndex) ||
				activeSpotPositions.includes(previousSelectedTradeMarket.marketIndex)
			) {
				isUserInvolvedInPreviousSelectedTradeMarket = true;
				break;
			}
		}
		const pollingCategoryOfPreviousSelectedMarket =
			isUserInvolvedInPreviousSelectedTradeMarket
				? PollingCategory.USER_INVOLVED
				: PollingCategory.USER_NOT_INVOLVED;
		this.pollingDlob.addMarketToInterval(
			pollingCategoryOfPreviousSelectedMarket,
			selectedTradeMarket.key
		);
		const pollingCadenceOfPreviousSelectedMarket =
			isUserInvolvedInPreviousSelectedTradeMarket
				? USER_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE
				: USER_NOT_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE;
		this.updateMarketAccountCadence(
			previousSelectedTradeMarket,
			pollingCadenceOfPreviousSelectedMarket
		);
	}

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

	public async createUserAndDeposit({
		depositAmount,
		depositSpotMarketIndex,
		name,
		maxLeverage,
		poolId = MAIN_POOL_ID,
		subAccountId,
		referrerName,
	}: {
		depositAmount: BigNum;
		depositSpotMarketIndex: number;
		name?: string;
		maxLeverage?: number;
		poolId?: number;
		subAccountId?: number;
		referrerName?: string;
	}) {
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
			this._userAccountCache.updateUserAccount(user);
		});

		return {
			txSig,
			userAccountPublicKey,
		};
	}

	public async deposit({
		subAccountId,
		amount,
		spotMarketIndex,
		isMaxBorrowRepayment,
	}: {
		subAccountId: number;
		amount: BigNum;
		spotMarketIndex: number;
		isMaxBorrowRepayment?: boolean;
	}): Promise<TransactionSignature> {
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

	public async withdraw({
		subAccountId,
		amount,
		spotMarketIndex,
		allowBorrow = false,
		isMax = false,
	}: {
		subAccountId: number;
		amount: BigNum;
		spotMarketIndex: number;
		allowBorrow?: boolean;
		isMax?: boolean;
	}) {
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
}
