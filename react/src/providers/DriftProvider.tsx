import React, { PropsWithChildren, useEffect } from 'react';
import useIdlePollingRateSwitcher from '../hooks/useIdlePollingRateSwitcher';
import useInitializeConnection from '../hooks/useInitializeConnection';
import { useSolBalance } from '../hooks/useSolBalance';
import { useEmulation } from '../hooks/useEmulation';
import { useGeoBlocking } from '../hooks/useGeoBlocking';
import { useCommonDriftStore } from '../stores';
import DriftWalletProvider from './DriftWalletProvider';
import { DRIFT_WALLET_PROVIDERS } from '../constants/wallets';

interface AppSetupProps {
	children: React.ReactNode;
	disable?: {
		idlePollingRateSwitcher?: boolean;
		emulation?: boolean;
	};
	geoBlocking?: {
		callback?: () => void;
	};
	autoconnectionDelay?: number;
	disableAutoconnect?: boolean;
}

const DriftProviderInner = (props: PropsWithChildren<any>) => {
	const get = useCommonDriftStore((s) => s.get);

	useEffect(() => {
		// @ts-ignore
		window.drift_dev = { getStore: get };
	}, []);

	!props.disable?.idlePollingRateSwitcher && useIdlePollingRateSwitcher();
	!props.disable?.emulation && useEmulation();

	useInitializeConnection();
	useSolBalance();
	useGeoBlocking(props?.geoBlocking?.callback);

	// not sure why this doesn't work in drift provider, but works in app setup
	// useSyncWalletToStore(props?.syncWalletToStore?.clearDataFromStore);
	return <>{props.children}</>;
};

const DriftProvider = (props: AppSetupProps) => {
	return (
		<>
			<DriftWalletProvider
				wallets={DRIFT_WALLET_PROVIDERS}
				disableAutoconnect={props.disableAutoconnect}
				autoconnectionDelay={props.autoconnectionDelay}
			>
				{/* Need to put this _INSIDE_ the wallet provider, otherwise, every loop where a hook inside wallet provider was keeping the wallet state in sync, the outer DriftProvider was running causing an infinite loop */}
				<DriftProviderInner>{props.children}</DriftProviderInner>
			</DriftWalletProvider>
		</>
	);
};

export { DriftProvider };
