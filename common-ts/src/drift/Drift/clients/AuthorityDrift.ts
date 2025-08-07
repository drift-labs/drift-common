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
	PerpMarkets,
	PublicKey,
	ReferrerInfo,
	SpotMarkets,
	WhileValidTxSender,
	ZERO,
} from '@drift-labs/sdk';
import { Connection, TransactionSignature } from '@solana/web3.js';
import { COMMON_UI_UTILS } from 'src/common-ui-utils/commonUiUtils';
import {
	DEFAULT_ACCOUNT_LOADER_COMMITMENT,
	DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS,
	DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY,
	DEFAULT_TX_SENDER_RETRY_INTERVAL,
} from '../constants';
import { MarketId } from 'src/types';
import { MARKET_UTILS } from 'src/common-ui-utils/market';
import { PollingDlob } from '../data/PollingDlob';
import { EnvironmentConstants } from 'src/EnvironmentConstants';
import { MarkPriceStore } from '../stores/MarkPriceStore';
import { OraclePriceStore } from '../stores/OraclePriceStore';
import { Subscription } from 'rxjs';
import { UserAccountStore } from '../stores/UserAccountStore';
import { getTokenAddressForDepositAndWithdraw } from 'src/utils/token';
import { USER_UTILS } from 'src/common-ui-utils/user';
import { MAIN_POOL_ID } from 'src/constants';
import { TRADING_UTILS } from 'src/common-ui-utils/trading';

interface AuthorityDriftConfig {
	solanaRpcEndpoint: string;
	driftEnv: DriftEnv;
	wallet?: IWallet;
	driftDlobServerHttpUrl?: string;
	onUserAccountUpdate?: (userPubKey: PublicKey) => void;
	tradableMarkets?: MarketId[];
	activeTradeMarket?: MarketId;
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
	private markPriceStore: MarkPriceStore;

	/**
	 * Stores the fetched oracle prices for all tradable markets.
	 * Oracle price sources includes:
	 * - DriftClient oracle account subscriptions
	 * - Polling DLOB server (all non-active markets)
	 */
	private oraclePriceStore: OraclePriceStore;

	/**
	 * Stores the fetched user account data for all user accounts.
	 */
	private userAccountStore: UserAccountStore;

	/**
	 * The active trade market to use for the drift client. This is used to subscribe to the market account,
	 * oracle data and mark price more frequently compared to the other markets.
	 *
	 * Example usage:
	 * - When the UI wants to display the orderbook of this market.
	 * - When the user is interacting with the trade form to trade on this market.
	 */
	private activeTradeMarket: MarketId | null = null;

	/**
	 * @param solanaRpcEndpoint - The Solana RPC endpoint to use for reading RPC data.
	 * @param driftEnv - The drift environment to use for the drift client.
	 * @param authority - The authority (wallet) whose user accounts to subscribe to.
	 * @param onUserAccountUpdate - The function to call when a user account is updated.
	 * @param tradableMarkets - The markets that are tradable through this client.
	 * @param activeTradeMarket - The active trade market to use for the drift client. This is used to subscribe to the market account, oracle data and mark price more frequently compared to the other markets.
	 * @param additionalDriftClientConfig - Additional DriftClient config to use for the DriftClient.
	 */
	constructor(readonly config: AuthorityDriftConfig) {
		this.activeTradeMarket = config.activeTradeMarket ?? null;

		const driftClient = this.setupDriftClient(config);
		this.setupStores(driftClient);
		this.setupPollingDlob(config.driftDlobServerHttpUrl);
	}

	private setupStores(driftClient: DriftClient) {
		this.markPriceStore = new MarkPriceStore();
		this.oraclePriceStore = new OraclePriceStore();
		this.userAccountStore = new UserAccountStore(
			driftClient,
			this.oraclePriceStore,
			this.markPriceStore
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

	private setupPollingDlob(driftDlobServerHttpUrl?: string) {
		const driftDlobServerHttpUrlToUse =
			driftDlobServerHttpUrl ??
			EnvironmentConstants.dlobServerHttpUrl[
				this.config.driftEnv === 'devnet' ? 'dev' : 'mainnet'
			];

		const pollingDlob = new PollingDlob({
			driftDlobServerHttpUrl: driftDlobServerHttpUrlToUse,
		});

		pollingDlob.addInterval('orderbook', 1, 100); // used to get orderbook data. this is mainly used as a fallback from the Websocket DLOB subscriber
		pollingDlob.addInterval('active-market', 1, 1); // used to get the mark price at a higher frequency for the current active market (e.g. market that the user is trading on). this won't be needed when the websocket DLOB is set up
		pollingDlob.addInterval('user-involved', 2, 1); // markets that the user is involved in
		pollingDlob.addInterval('user-not-involved', 30, 1); // markets that the user is not involved in

		// add all markets to the user-not-involved interval first, until user-involved markets are known
		pollingDlob.addMarketsToInterval(
			'user-not-involved',
			this.config.tradableMarkets.map((market) => market.key)
		);
		if (this.activeTradeMarket) {
			pollingDlob.addMarketToInterval(
				'active-market',
				this.activeTradeMarket.key
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

			this.markPriceStore.updateMarkPrices(...updatedMarkPrices);
			this.oraclePriceStore.updateOraclePrices(...updatedOraclePrices);
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
		users.forEach((user) => {
			user.eventEmitter.on('update', () => {
				this.userAccountStore.updateUserAccount(user);
			});
		});
	}

	public async subscribe() {
		const driftClientSubscribePromise = this.driftClient.subscribe();
		const pollingDlobStartPromise = this.pollingDlob.start();

		await Promise.all([driftClientSubscribePromise, pollingDlobStartPromise]);

		this.subscribeToAllUsersUpdates();
	}

	public async unsubscribe() {
		this.unsubscribeFromPollingDlob();
		this.userAccountStore.reset();

		const driftClientUnsubscribePromise = this.driftClient.unsubscribe();

		await Promise.all([driftClientUnsubscribePromise]);

		this.pollingDlobSubscription = null;
	}

	public async updateAuthority(wallet: IWallet, activeSubAccountId?: number) {
		this.config.wallet = wallet;

		await Promise.all(this.driftClient.unsubscribeUsers());
		this.userAccountStore.reset();

		const updateWalletResult = await this.driftClient.updateWallet(
			wallet,
			undefined,
			activeSubAccountId,
			true,
			undefined
		);

		if (!updateWalletResult) {
			throw new Error('Failed to update wallet');
		}

		if (activeSubAccountId) {
			await this.driftClient.switchActiveUser(activeSubAccountId);
		}

		this.subscribeToAllUsersUpdates();
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
			this.config.driftEnv,
			MarketType.SPOT,
			depositSpotMarketIndex
		);

		const referrerInfoPromise = this.getReferrerInfo(referrerName);
		const subaccountExistsPromise = USER_UTILS.checkIfUserAccountExists(
			this.driftClient,
			{
				type: 'subAccountId',
				subAccountId,
				authority: this.config.wallet.publicKey,
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

		await this.driftClient.addUser(subAccountId, this.config.wallet.publicKey); // adds user to driftclient's user map, subscribes to user account data
		const user = this.driftClient.getUser(
			subAccountId,
			this.config.wallet.publicKey
		);

		user.eventEmitter.on('update', () => {
			this.userAccountStore.updateUserAccount(user);
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
			this.config.driftEnv,
			MarketType.SPOT,
			spotMarketIndex
		);

		const authority = this.config.wallet.publicKey;
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
			this.config.driftEnv,
			MarketType.SPOT,
			spotMarketIndex
		);

		const authority = this.config.wallet.publicKey;
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
