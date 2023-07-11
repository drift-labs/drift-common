import { WalletContextState } from '@solana/wallet-adapter-react';
import { Context, useContext, useEffect } from 'react';
import { BASE_PRECISION_EXP, BigNum } from '@drift-labs/sdk';
import { useCommonDriftStore } from '../stores';
import { useCommonDriftActions } from './useCommonDriftActions';

/**
 * Keeps the authority and connected state of `WalletContext` from `@solana/wallet-adapter-react` updated in the app store when the wallet connects, disconnects, or changes.
 *
 * Also sets SOL balance in the store to 0 on disconnect.
 */
const useSyncWalletToStore = (walletContext: Context<WalletContextState>) => {
	const walletContextState = useContext(walletContext);
	const actions = useCommonDriftActions();
	const set = useCommonDriftStore((s) => s.set);
	const currentConnectedWalletContext = useCommonDriftStore(
		(s) => s.currentlyConnectedWalletContext
	);

	useEffect(() => {
		set((s) => {
			s.currentlyConnectedWalletContext = walletContextState;
		});
	}, [walletContext]);

	useEffect(() => {
		currentConnectedWalletContext?.wallet?.adapter?.on('connect', () => {
			const authority =
				currentConnectedWalletContext?.wallet?.adapter?.publicKey;

			set((s) => {
				s.currentSolBalance = {
					value: new BigNum(0, BASE_PRECISION_EXP),
					loaded: false,
				};
				s.authority = authority;
				s.authorityString = authority?.toString() || '';
			});

			if (authority && currentConnectedWalletContext.wallet?.adapter) {
				actions.handleWalletConnect(
					authority,
					currentConnectedWalletContext.wallet?.adapter
				);
			}
		});

		currentConnectedWalletContext?.wallet?.adapter?.on('disconnect', () => {
			set((s) => {
				s.currentSolBalance = {
					value: new BigNum(0, BASE_PRECISION_EXP),
					loaded: false,
				};
				s.authority = undefined;
				s.authorityString = '';
			});

			actions.handleWalletDisconnect();
		});

		return () => {
			console.log('adapter changed, firing off');
			currentConnectedWalletContext?.wallet?.adapter.off('connect');
			currentConnectedWalletContext?.wallet?.adapter.off('disconnect');
		};
	}, [currentConnectedWalletContext?.wallet?.adapter]);

	// useEffect(() => {
	// 	set((s) => {
	// 		s.authority = walletContext?.wallet?.adapter?.publicKey;
	// 		s.authorityString =
	// 			walletContext?.wallet?.adapter?.publicKey?.toString() || '';
	// 	});
	// }, [walletContext?.wallet?.adapter?.publicKey]);
};

export default useSyncWalletToStore;
