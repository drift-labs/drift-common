import {
	CustomizedCadenceBulkAccountLoader,
	DelistedMarketSetting,
	DRIFT_PROGRAM_ID,
	DriftClient,
	DriftClientConfig,
	DriftEnv,
	PublicKey,
	WhileValidTxSender,
} from '@drift-labs/sdk';
import { Connection } from '@solana/web3.js';
import { COMMON_UI_UTILS } from 'src/common-ui-utils/commonUiUtils';
import {
	DEFAULT_ACCOUNT_LOADER_COMMITMENT,
	DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS,
	DEFAULT_TX_SENDER_CONFIRMATION_STRATEGY,
	DEFAULT_TX_SENDER_RETRY_INTERVAL,
} from '../constants';
import { MarketId } from 'src/types';

/**
 * A Drift client that is used to subscribe to all accounts for a given authority.
 *
 * This is useful for applications that want to subscribe to all user accounts for a given authority,
 * such as a UI to trade on Drift or a wallet application that allows trading on Drift.
 */
export class AuthorityDrift {
	private driftClient: DriftClient;

	/**
	 * @param solanaRpcEndpoint - The Solana RPC endpoint to use for reading RPC data.
	 * @param driftEnv - The drift environment to use for the drift client.
	 * @param authority - The authority (wallet) whose user accounts to subscribe to.
	 * @param onUserAccountUpdate - The function to call when a user account is updated.
	 * @param activeTradeMarket - The active trade market to use for the drift client. This is used to subscribe to the market account, oracle data and mark price more frequently compared to the other markets.
	 * @param additionalDriftClientConfig - Additional DriftClient config to use for the DriftClient.
	 */
	constructor(config: {
		solanaRpcEndpoint: string;
		driftEnv: DriftEnv;
		authority?: PublicKey;
		onUserAccountUpdate?: (userPubKey: PublicKey) => void;
		activeTradeMarket?: MarketId;
		additionalDriftClientConfig?: Partial<Omit<DriftClientConfig, 'env'>>;
	}) {
		const driftEnv = config.driftEnv;

		const connection = new Connection(config.solanaRpcEndpoint);
		const driftProgramID = new PublicKey(DRIFT_PROGRAM_ID);
		const accountLoader = new CustomizedCadenceBulkAccountLoader(
			connection,
			DEFAULT_ACCOUNT_LOADER_COMMITMENT,
			DEFAULT_ACCOUNT_LOADER_POLLING_FREQUENCY_MS
		);

		const wallet = COMMON_UI_UTILS.createPlaceholderIWallet(config.authority);
		const skipInitialUsersLoad = !config.authority;

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
	}

	public async subscribe() {
		const driftClientSubscribePromise = this.driftClient.subscribe();

		// subscribe to orderbook - includes updated oracle data
		// - subscribe to main market using websocket
		// - subscribe to other markets using polling

		await Promise.all([driftClientSubscribePromise]);
	}
}
