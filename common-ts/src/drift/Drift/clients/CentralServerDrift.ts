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
	PerpMarketConfig,
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

	public async getDepositTxn(
		userAccountPublicKey: PublicKey,
		amount: BN,
		spotMarketIndex: number
	): Promise<VersionedTransaction | Transaction> {
		const user = new User({
			driftClient: this.driftClient,
			userAccountPublicKey,
		});

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

		const spotMarketConfig = this.spotMarketConfigs.find(
			(market) => market.marketIndex === spotMarketIndex
		);

		if (!spotMarketConfig) {
			throw new Error(
				`Spot market config not found for index ${spotMarketIndex}`
			);
		}

		// Temporarily replace the driftClient's wallet with the user's authority
		// to ensure the transaction is built with the correct signer
		// This is gross to have to do but even when building transactions from the ix, the driftClient
		// adds the wallet.publicKey to the ix.. we need to decide if we want to do a larger refactor in DriftClient
		// or use a workaround like this
		const originalWallet = this.driftClient.wallet;
		const userWallet = {
			publicKey: authority,
			signTransaction: () =>
				Promise.reject('This is a placeholder - do not sign with this wallet'),
			signAllTransactions: () =>
				Promise.reject('This is a placeholder - do not sign with this wallet'),
		};
		this.driftClient.wallet = userWallet;

		try {
			const depositTxn = await createDepositTxn({
				driftClient: this.driftClient,
				user,
				amount: BigNum.from(amount, spotMarketConfig.precisionExp),
				spotMarketConfig,
			});

			// cleanup
			await user.unsubscribe();
			this.driftClient.users.clear();

			return depositTxn;
		} finally {
			// Always restore the original wallet
			this.driftClient.wallet = originalWallet;
		}
	}

	public async sendSignedTransaction(tx: VersionedTransaction | Transaction) {
		return this.driftClient.sendTransaction(tx, undefined, undefined, true);
	}
}
