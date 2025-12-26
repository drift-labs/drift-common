/**
 * A list of wallets to display in the wallet connection list.
 *
 * On SAGA the mobile wallet adapter will be added to the list automatically.
 *
 * The Wallet Provider should also be smart enough to add any other detected wallets to the list too.
 */
export const DRIFT_WALLET_PROVIDERS = async () => {
	const [
		{ PhantomWalletAdapter },
		{ SolflareWalletAdapter },
		{ CoinbaseWalletAdapter },
		{ MathWalletAdapter },
		{ Coin98WalletAdapter },
		{ CloverWalletAdapter },
	] = await Promise.all([
		// wallet adapters are dynamically imported to prevent mobile from importing it statically, where it is not supported
		import('@solana/wallet-adapter-wallets').then((m) => ({
			PhantomWalletAdapter: m.PhantomWalletAdapter,
		})),
		import('@solana/wallet-adapter-wallets').then((m) => ({
			SolflareWalletAdapter: m.SolflareWalletAdapter,
		})),
		import('@solana/wallet-adapter-wallets').then((m) => ({
			CoinbaseWalletAdapter: m.CoinbaseWalletAdapter,
		})),
		import('@solana/wallet-adapter-wallets').then((m) => ({
			MathWalletAdapter: m.MathWalletAdapter,
		})),
		import('@solana/wallet-adapter-wallets').then((m) => ({
			Coin98WalletAdapter: m.Coin98WalletAdapter,
		})),
		import('@solana/wallet-adapter-wallets').then((m) => ({
			CloverWalletAdapter: m.CloverWalletAdapter,
		})),
	]);

	return [
		new PhantomWalletAdapter(),
		new SolflareWalletAdapter(),
		new CoinbaseWalletAdapter(),
		new MathWalletAdapter(),
		new Coin98WalletAdapter(),
		new CloverWalletAdapter(),
	];
};
