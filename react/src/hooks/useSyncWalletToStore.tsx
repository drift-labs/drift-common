import { WalletContextState } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import { BASE_PRECISION_EXP, BigNum } from '@drift-labs/sdk';
import { useDriftStore } from '../stores';
import useCommonDriftActions from './useCommonDriftActions';

/**
 * Keeps the authority and connected state of `WalletContext` from `@solana/wallet-adapter-react` updated in the app store when the wallet connects, disconnects, or changes.
 *
 * Also sets SOL balance in the store to 0 on disconnect.
 */
const useSyncWalletToStore = (walletContext: WalletContextState) => {
	const actions = useCommonDriftActions();
	const set = useDriftStore((s) => s.set);

	const handleWalletDisconnect = actions.handleWalletDisconnect;

	useEffect(() => {
		walletContext?.wallet?.adapter?.on('connect', () => {
			const authority = walletContext?.wallet?.adapter?.publicKey;

			set((s) => {
				s.currentSolBalance = {
					value: new BigNum(0, BASE_PRECISION_EXP),
					loaded: false,
				};
				s.authority = authority;
				s.authorityString = authority?.toString() || '';
				s.currentlyConnectedWalletContext = walletContext;
			});

			if (authority && walletContext.wallet?.adapter) {
				actions.handleWalletConnect(authority, walletContext.wallet?.adapter);
			}
		});

		walletContext?.wallet?.adapter?.on('disconnect', () => {
			set((s) => {
				s.currentSolBalance = {
					value: new BigNum(0, BASE_PRECISION_EXP),
					loaded: false,
				};
				s.authority = undefined;
				s.authorityString = '';
				// s.currentlyConnectedWalletContext = null;
			});

			handleWalletDisconnect();
		});

		return () => {
			console.log('adapter changed, firing off');
			walletContext?.wallet?.adapter.off('connect');
			walletContext?.wallet?.adapter.off('disconnect');
		};
	}, [walletContext?.wallet?.adapter]);

	// useEffect(() => {
	// 	set((s) => {
	// 		s.authority = walletContext?.wallet?.adapter?.publicKey;
	// 		s.authorityString =
	// 			walletContext?.wallet?.adapter?.publicKey?.toString() || '';
	// 	});
	// }, [walletContext?.wallet?.adapter?.publicKey]);
};

export default useSyncWalletToStore;
