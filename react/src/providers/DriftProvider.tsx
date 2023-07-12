import React, { Context, useContext, useEffect } from 'react';
import useInitializeConnection from '../hooks/useInitializeConnection';
import useIdlePollingRateSwitcher from '../hooks/useIdlePollingRateSwitcher';
import { useSolBalance } from '../hooks/useSolBalance';
import { useSyncWalletToStore } from '../hooks/useSyncWalletToStore';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { useCommonDriftStore } from '../stores';
import { useGeoBlocking } from '../hooks/useGeoBlocking';
// import useSpotMarketData from '../hooks/useSpotMarketData';
// import useEmulation from '../hooks/useEmulation';
// import useInitPostHogUser from '../hooks/useInitPosthogUser';
// import { useWalletAutoConnect } from '../hooks/useWalletAutoConnect';

interface AppSetupProps {
	children: React.ReactNode;
	walletContext: Context<WalletContextState | null>;
	disable?: {
		idlePollingRateSwitcher?: boolean;
	};
	props?: {
		geoBlocking?: {
			callback?: () => void;
		};
	};
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
	!props.disable?.idlePollingRateSwitcher && useIdlePollingRateSwitcher();
	useSyncWalletToStore();
	useSolBalance();
	// useSpotMarketData();
	useGeoBlocking(props.props?.geoBlocking?.callback);
	// useEmulation();
	// useInitPostHogUser();
	// useWalletAutoConnect();
	// useEventsRecords();

	return <>{props.children}</>;
};

export { DriftProvider };
