import { useContext } from 'react';
import { useCommonDriftStore } from '../stores';
import { DriftWalletContext } from '../providers';

export const useWalletContext = () => {
	const walletContextState = useCommonDriftStore(
		(s) => s.currentlyConnectedWalletContext
	);

	return walletContextState;
};

export const useWallet = () => {
	const driftWalletContext = useContext(DriftWalletContext);

	return driftWalletContext;
};
