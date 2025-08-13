import {
	CustomizedCadenceBulkAccountLoader,
	DriftClient,
	IWallet,
	PerpMarketAccount,
	PollingDriftClientAccountSubscriber,
	SpotMarketAccount,
	User,
} from '@drift-labs/sdk';
import { MarketId, MarketKey } from '../../../../types';
import { PollingDlob } from '../../data/PollingDlob';
import {
	PollingCategory,
	SELECTED_MARKET_ACCOUNT_POLLING_CADENCE,
	USER_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE,
	USER_NOT_INVOLVED_MARKET_ACCOUNT_POLLING_CADENCE,
} from '../../constants';
import { UserAccountCache } from '../../stores/UserAccountCache';

/**
 * Comprehensive subscription and market operations manager for the Drift protocol.
 *
 * This class handles all aspects of subscription management including:
 * - User account subscriptions and event listeners
 * - Market account and oracle polling optimization
 * - DLOB server polling configuration
 * - Authority (wallet) management with full resubscription
 * - Market categorization based on user involvement
 *
 * By combining subscription and market operations, this provides a unified
 * interface for all subscription-related optimizations.
 */
export class SubscriptionManager {
	/**
	 * Creates a new SubscriptionManager instance.
	 *
	 * @param driftClient - The DriftClient instance for managing subscriptions
	 * @param accountLoader - Handles bulk account loading and polling frequency management
	 * @param pollingDlob - Manages DLOB server polling for market data
	 * @param userAccountCache - Cache for user account data updates
	 * @param tradableMarkets - Array of markets that are available for trading
	 * @param selectedTradeMarket - The market that is currently being traded
	 */
	constructor(
		private driftClient: DriftClient,
		private accountLoader: CustomizedCadenceBulkAccountLoader,
		private pollingDlob: PollingDlob,
		private userAccountCache: UserAccountCache,
		private tradableMarkets: MarketId[],
		private selectedTradeMarket: MarketId | null
	) {}

	/**
	 * Updates the tradable markets list.
	 *
	 * @param tradableMarkets - The new tradable markets list
	 */
	updateTradableMarkets(tradableMarkets: MarketId[]): void {
		this.tradableMarkets = tradableMarkets;
	}

	/**
	 * Subscribes to updates for all user accounts under the current authority.
	 *
	 * This method sets up event listeners for user account updates and ensures
	 * that market subscriptions are properly configured based on user positions.
	 * When a user's account data changes, it automatically triggers subscription
	 * updates to maintain optimal polling frequencies.
	 */
	subscribeToAllUsersUpdates(): void {
		const users = this.driftClient.getUsers();

		this.handleSubscriptionUpdatesOnUserUpdates(users);

		users.forEach((user) => {
			user.eventEmitter.on('update', () => {
				this.handleSubscriptionUpdatesOnUserUpdates(users);
				this.userAccountCache.updateUserAccount(user);
			});
		});
	}

	/**
	 * Categorizes markets based on user involvement (active positions).
	 *
	 * Markets are classified as "user-involved" if any of the provided users
	 * have active positions (perp or spot) in those markets. This categorization
	 * is used to optimize polling frequencies - user-involved markets are polled
	 * more frequently to ensure accurate close to real-time data for user positions.
	 */
	categorizeMarketsByUserInvolvement(users: User[]): {
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
			);

		const userInvolvedMarketKeys = userInvolvedMarkets.map(
			(market) => market.key
		);
		const userNotInvolvedMarkets = this.tradableMarkets.filter(
			(market) => !userInvolvedMarketKeys.includes(market.key)
		);

		return { userInvolvedMarkets, userNotInvolvedMarkets };
	}

	/**
	 * Updates the polling cadence for a market account and its associated oracle account.
	 *
	 * This method optimizes data fetching by adjusting how frequently market and oracle
	 * accounts are polled from the RPC. Higher cadences (lower numbers) mean more frequent polling.
	 */
	updateMarketAccountCadence(market: MarketId, newCadence: number): void {
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

	/**
	 * Updates account loader polling cadences for multiple markets based on their categorization.
	 *
	 * This method applies different polling frequencies based on market importance:
	 * - Selected trade market: Highest frequency (most important for active trading)
	 * - User-involved markets: Medium frequency (user has positions)
	 * - User-not-involved markets: Lowest frequency (background monitoring)
	 */
	private updateAccountLoaderCadenceForMarkets(
		userInvolvedMarkets: MarketId[],
		userNotInvolvedMarkets: MarketId[],
		selectedTradeMarket?: MarketId
	): void {
		if (selectedTradeMarket) {
			this.updateMarketAccountCadence(
				selectedTradeMarket,
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

	/**
	 * Updates DLOB (Decentralized Limit Order Book) polling intervals for market data.
	 *
	 * This method configures how frequently the DLOB server is polled for market data
	 * including mark prices, oracle prices, and orderbook data. Different markets are
	 * assigned to different polling intervals based on their importance.
	 */
	private updatePollingDlobIntervals(
		userInvolvedMarkets: MarketKey[],
		userNotInvolvedMarkets: MarketKey[],
		selectedTradeMarket?: MarketId
	): void {
		if (selectedTradeMarket) {
			this.pollingDlob.addMarketToInterval(
				PollingCategory.SELECTED_MARKET,
				selectedTradeMarket.key
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
	 * Handles comprehensive subscription updates when user account data changes.
	 *
	 * This is the main orchestration method that ensures optimal polling frequencies
	 * are maintained when user positions change. It automatically:
	 *
	 * 1. Categorizes markets based on current user involvement
	 * 2. Updates account loader cadences for market and oracle accounts
	 * 3. Updates DLOB polling intervals for price data
	 *
	 * The method ensures that markets with user positions get higher priority polling
	 * to maintain accurate real-time data for position management.
	 */
	handleSubscriptionUpdatesOnUserUpdates(users: User[]): void {
		const { userInvolvedMarkets, userNotInvolvedMarkets } =
			this.categorizeMarketsByUserInvolvement(users);

		// Filter out selected trade market from the other categories
		const filteredUserInvolvedMarkets = userInvolvedMarkets.filter(
			(market) => market.key !== this.selectedTradeMarket?.key
		);
		const filteredUserNotInvolvedMarkets = userNotInvolvedMarkets.filter(
			(market) => market.key !== this.selectedTradeMarket?.key
		);

		// Update market account cadences
		this.updateAccountLoaderCadenceForMarkets(
			filteredUserInvolvedMarkets,
			filteredUserNotInvolvedMarkets,
			this.selectedTradeMarket
		);

		// Handle polling dlob polling intervals
		this.updatePollingDlobIntervals(
			filteredUserInvolvedMarkets.map((market) => market.key),
			filteredUserNotInvolvedMarkets.map((market) => market.key),
			this.selectedTradeMarket
		);
	}

	/**
	 * Subscribes to markets that users are involved in but aren't in the default tradable markets list.
	 *
	 * This method ensures that if users have positions in markets that weren't initially
	 * included in the tradable markets list, those markets are still properly subscribed to.
	 * This is important for maintaining accurate account data even for edge cases.
	 */
	async subscribeToNonWhitelistedButUserInvolvedMarkets(
		users: User[]
	): Promise<void> {
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

		const { userInvolvedMarkets } =
			this.categorizeMarketsByUserInvolvement(users);

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

	/**
	 * Updates the selected trade market and optimizes all subscription polling accordingly.
	 *
	 * This method handles:
	 * 1. Removing the previous market from high-frequency polling
	 * 2. Adding the new market to high-frequency polling
	 * 3. Updating market account cadences for optimal performance
	 * 4. Categorizing the previous market based on user involvement
	 * 5. Assigning appropriate polling intervals to the previous market
	 *
	 * @param newSelectedTradeMarket - The new market to prioritize for trading
	 */
	updateSelectedTradeMarket(newSelectedTradeMarket: MarketId): void {
		const previousSelectedTradeMarket = this.selectedTradeMarket;

		if (previousSelectedTradeMarket) {
			this.pollingDlob.removeMarketFromInterval(
				PollingCategory.SELECTED_MARKET,
				previousSelectedTradeMarket.key
			);
		}

		// Update the selected trade market
		this.selectedTradeMarket = newSelectedTradeMarket;

		this.pollingDlob.addMarketToInterval(
			PollingCategory.SELECTED_MARKET,
			newSelectedTradeMarket.key
		);
		this.updateMarketAccountCadence(
			newSelectedTradeMarket,
			SELECTED_MARKET_ACCOUNT_POLLING_CADENCE
		);

		// Handle the previous selected market if it exists
		if (previousSelectedTradeMarket) {
			// Determine if user is involved in the previous market
			let isUserInvolvedInPreviousSelectedTradeMarket = false;
			const allUsers = this.userAccountCache.allUsers;
			for (const user of allUsers) {
				const { activePerpPositions, activeSpotPositions } =
					user.userClient.getActivePositions();
				if (
					activePerpPositions.includes(
						previousSelectedTradeMarket.marketIndex
					) ||
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
				newSelectedTradeMarket.key
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
	}

	/**
	 * Updates the authority (wallet) for the drift client and reestablishes subscriptions.
	 *
	 * This method handles the complete process of switching to a new wallet:
	 * 1. Checks if the wallet is actually different
	 * 2. Unsubscribes from current user accounts
	 * 3. Resets the user account cache
	 * 4. Updates the DriftClient with the new wallet
	 * 5. Resubscribes to markets based on new user positions
	 * 6. Switches to the specified subaccount if provided
	 * 7. Reestablishes user account subscriptions
	 */
	async updateAuthority(
		wallet: IWallet,
		activeSubAccountId?: number
	): Promise<void> {
		if (this.driftClient.wallet.publicKey.equals(wallet.publicKey)) {
			return;
		}

		await Promise.all(this.driftClient.unsubscribeUsers());
		this.userAccountCache.reset();

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
}
