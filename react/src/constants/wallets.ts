import {
	BackpackWalletAdapter,
	BraveWalletAdapter,
	CloverWalletAdapter,
	Coin98WalletAdapter,
	CoinbaseWalletAdapter,
	GlowWalletAdapter,
	MathWalletAdapter,
	PhantomWalletAdapter,
	SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

/**
 * A list of wallets to display in the wallet connection list.
 *
 * On SAGA the mobile wallet adapter will be added to the list automatically.
 *
 * The Wallet Provider should also be smart enough to add any other detected wallets to the list too.
 */
export const DRIFT_WALLET_PROVIDERS = [
	new PhantomWalletAdapter(),
	new BackpackWalletAdapter(),
	new SolflareWalletAdapter(),
	new GlowWalletAdapter(),
	new BraveWalletAdapter(),
	new CoinbaseWalletAdapter(),
	new MathWalletAdapter(),
	new Coin98WalletAdapter(),
	new CloverWalletAdapter(),
];
