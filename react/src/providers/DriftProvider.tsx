import React, { Context, useContext, useEffect } from 'react';
import useInitializeConnection from '../hooks/useInitializeConnection';
// import useIdlePollingRateSwitcher from '../hooks/useIdlePollingRateSwitcher';
// import useSolBalance from '../hooks/useSolBalance';
// import useEventsRecords from '../hooks/useEventRecords';
// import useSyncMSolMetrics from '../hooks/useSyncMSolMetrics';
// import useSyncWalletToStore from '../hooks/useSyncWalletToStore';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { useCommonDriftStore } from '../stores';
// import useCurrentUserData from '../hooks/useCurrentUserData';
// import useSpotMarketData from '../hooks/useSpotMarketData';
// import useEmulation from '../hooks/useEmulation';
// import { useShowTermsModal } from '../hooks/useLastAcknowledgedTerms';
// import useGeoblocking from '../hooks/useGeoblocking';
// import useInitPostHogUser from '../hooks/useInitPosthogUser';
// import { useWalletAutoConnect } from '../hooks/useWalletAutoConnect';

interface AppSetupProps {
	children: React.ReactNode;
	walletContext: Context<WalletContextState | null>;
}

const DriftProvider = (props: AppSetupProps) => {
	const get = useCommonDriftStore((s) => s.get);
	const set = useCommonDriftStore((s) => s.set);
	const walletContextState = useContext(props.walletContext);

	useEffect(() => {
		set((s) => {
			s.currentlyConnectedWalletContext = walletContextState;
		});
	}, [walletContextState]);

	useEffect(() => {
		// @ts-ignore
		window.drift_dev = { getStore: get };
	}, []);

	useInitializeConnection();
	// useIdlePollingRateSwitcher();
	// useSyncWalletToStore(props.walletContext);
	// useSolBalance();
	// useSyncMSolMetrics();
	// useCurrentUserData();
	// useSpotMarketData();
	// useShowTermsModal();
	// useGeoblocking();
	// useEmulation();
	// useInitPostHogUser();
	// useWalletAutoConnect();
	// useEventsRecords();

	return <>{props.children}</>;
};

export { DriftProvider };
