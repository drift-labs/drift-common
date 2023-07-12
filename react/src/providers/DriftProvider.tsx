import React, { Context, useContext, useEffect } from 'react';
import useInitializeConnection from '../hooks/useInitializeConnection';
import useIdlePollingRateSwitcher from '../hooks/useIdlePollingRateSwitcher';
import { useSolBalance } from '../hooks/useSolBalance';
import { useSyncWalletToStore } from '../hooks/useSyncWalletToStore';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { useCommonDriftStore } from '../stores';
import { useGeoBlocking } from '../hooks/useGeoBlocking';
import { useInitPostHogUser } from '../hooks/useInitPosthogUser';
import { useEmulation } from '../hooks/useEmulation';

interface AppSetupProps {
	children: React.ReactNode;
	walletContext: Context<WalletContextState | null>;
	disable?: {
		idlePollingRateSwitcher?: boolean;
		emulation?: boolean;
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
	useGeoBlocking(props.props?.geoBlocking?.callback);
	useInitPostHogUser();
	!props.disable?.emulation && useEmulation();

	return <>{props.children}</>;
};

export { DriftProvider };
