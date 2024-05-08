import React, { useEffect } from 'react';
import useIdlePollingRateSwitcher from '../hooks/useIdlePollingRateSwitcher';
import useInitializeConnection from '../hooks/useInitializeConnection';
import { useSolBalance } from '../hooks/useSolBalance';
import { useEmulation } from '../hooks/useEmulation';
import { useGeoBlocking } from '../hooks/useGeoBlocking';
import { useCommonDriftStore } from '../stores';
import DriftWalletProvider from './DriftWalletProvider';
import { DriftClientConfig } from '@drift-labs/sdk';
import { Breakpoints, useSyncScreenSize } from '../stores/useScreenSizeStore';
import { WalletAdapter } from '@solana/wallet-adapter-base';

export interface AppSetupProps {
	priorityFeePollingMultiplier: number;
}

type DriftAppHooksProps = {
	children: React.ReactNode;
	disable?: {
		idlePollingRateSwitcher?: boolean;
		emulation?: boolean;
		geoblocking?: boolean;
		initConnection?: boolean;
	};
	geoBlocking?: {
		callback?: () => void;
	};

	// instead of making this optional and setting a default, we force the user to provide the breakpoints,
	// although they can still import DEFAULT_BREAKPOINTS. this ensures that the user is aware of
	// the breakpoints they are using
	breakpoints: Breakpoints;
	additionalDriftClientConfig?: Partial<DriftClientConfig>;
};

export type DriftProviderProps = {
	disableAutoconnect?: boolean;
	autoconnectionDelay?: number;
	wallets?: WalletAdapter[];
} & DriftAppHooksProps;

const DriftProviderInner = (props: DriftAppHooksProps) => {
	const get = useCommonDriftStore((s) => s.get);

	useEffect(() => {
		// @ts-ignore
		window.drift_dev = { getStore: get };
	}, []);

	!props.disable?.idlePollingRateSwitcher && useIdlePollingRateSwitcher();
	!props.disable?.emulation && useEmulation();
	!props.disable?.geoblocking && useGeoBlocking(props?.geoBlocking?.callback);

	useInitializeConnection(
		!props.disable?.initConnection,
		props?.additionalDriftClientConfig
	);
	useSolBalance();
	useSyncScreenSize(props.breakpoints);

	// not sure why this doesn't work in drift provider, but works in app setup
	// useSyncWalletToStore(props?.syncWalletToStore?.clearDataFromStore);
	return <>{props.children}</>;
};

const DriftProvider = (
	props: DriftProviderProps & { children: React.ReactNode }
) => {
	return (
		<>
			<DriftWalletProvider
				wallets={props.wallets}
				disableAutoconnect={props.disableAutoconnect}
				autoconnectionDelay={props.autoconnectionDelay}
			>
				{/* Need to put this _INSIDE_ the wallet provider, otherwise, every loop where a hook inside wallet provider was keeping the wallet state in sync, the outer DriftProvider was running causing an infinite loop */}
				<DriftProviderInner
					disable={props.disable}
					geoBlocking={props.geoBlocking}
					breakpoints={props.breakpoints}
					additionalDriftClientConfig={props.additionalDriftClientConfig}
				>
					{props.children}
				</DriftProviderInner>
			</DriftWalletProvider>
		</>
	);
};

export { DriftProvider };
