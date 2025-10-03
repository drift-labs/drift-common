import { PublicKey, Connection } from '@solana/web3.js';
import { DriftEnv, DriftClient, Wallet, WalletV2 } from '@drift-labs/sdk';
import { CentralServerDrift } from '../../../../../src/drift/Drift/clients/CentralServerDrift';
import { EnvironmentConstants } from '../../../../../src/EnvironmentConstants';
import { getDevWallet, getTestWallet } from '../../../../utils/wallet';
import { VersionedTransaction } from '@solana/web3.js';

export const defaultDevnetRpc: string = EnvironmentConstants.rpcs.dev[1].value;

export const defaultConnection: Connection = new Connection(
	defaultDevnetRpc,
	'confirmed'
);

export const invalidMockUserAccountPublicKey: PublicKey = new PublicKey(
	'11111111111111111111111111111114'
);

const config = {
	solanaRpcEndpoint: defaultDevnetRpc,
	driftEnv: 'devnet' as DriftEnv,
	supportedPerpMarkets: [0, 1, 2],
	supportedSpotMarkets: [0, 1, 2],
};

export const centralServerDrift: CentralServerDrift = new CentralServerDrift(
	config
);

export const driftClient: DriftClient = (centralServerDrift as any)
	.driftClient as DriftClient;

let isSubscribed = false;
let originalConsoleWarn: typeof console.warn;

export async function setupTestContext(): Promise<{
	testWallet: WalletV2;
	devWallet: WalletV2;
}> {
	if (isSubscribed) {
		const testWallet = await getTestWallet();
		const devWallet = getDevWallet().devWallet;
		return {
			testWallet,
			devWallet,
		};
	}

	originalConsoleWarn = console.warn;
	console.warn = () => {};
	await centralServerDrift.subscribe();
	const testWallet = await getTestWallet();
	isSubscribed = true;

	return {
		testWallet,
		devWallet: getDevWallet().devWallet,
	};
}

export async function teardownTestContext(): Promise<void> {
	if (!isSubscribed) return;
	await centralServerDrift.unsubscribe();
	console.warn = originalConsoleWarn;
	isSubscribed = false;
}

export async function signAndSendTransaction(
	txn: VersionedTransaction,
	wallet: Wallet
): Promise<string> {
	const signedTxn = await wallet.signVersionedTransaction(txn);
	const txSig = await defaultConnection.sendTransaction(signedTxn);
	const latestBlockhash = await defaultConnection.getLatestBlockhash();
	await defaultConnection.confirmTransaction({
		signature: txSig,
		blockhash: latestBlockhash.blockhash,
		lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
	});
	return txSig;
}
