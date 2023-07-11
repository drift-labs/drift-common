import { useCommonDriftStore } from '../stores';

export const useWalletContext = () => {
	const walletContextState = useCommonDriftStore(
		(s) => s.currentlyConnectedWalletContext
	);

	return walletContextState;
};
