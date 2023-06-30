import React, { PropsWithChildren } from 'react';

import { DriftStoreState, useDriftStore } from '../stores/useDriftStore';
import { ActionsProvider } from '../hooks/useDriftActions';

import useInitializeConnection from '../hooks/useInitializeConnection';
// import useIdlePollingRateSwitcher from '../hooks/useIdlePollingRateSwitcher';
// import useSolBalance from '../hooks/useSolBalance';
// import useEventsRecords from '../hooks/useEventRecords';
// import useSyncMSolMetrics from '../hooks/useSyncMSolMetrics';
// import useSyncWalletToStore from '../hooks/useSyncWalletToStore';
// import useCurrentUserData from '../hooks/useCurrentUserData';
// import useSpotMarketData from '../hooks/useSpotMarketData';
// import useEmulation from '../hooks/useEmulation';
// import { useShowTermsModal } from '../hooks/useLastAcknowledgedTerms';
// import useGeoblocking from '../hooks/useGeoblocking';
// import useInitPostHogUser from '../hooks/useInitPosthogUser';
// import { useWalletAutoConnect } from '../hooks/useWalletAutoConnect';

const AppSetup = (props: PropsWithChildren) => {
	const env = useDriftStore((s: DriftStoreState) => s.env);

	useInitializeConnection();
	// useIdlePollingRateSwitcher();
	// useSyncWalletToStore();
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

	console.log('hello from drift-common');
	console.log(env);

	return <>{props.children}</>;
};

const DriftProvider = (props: PropsWithChildren) => {
	// AppSetup needs to go inside of ActionsProvider to make sure actions are defined within those hooks
	// We can move or rename it if we want
	return (
		<ActionsProvider>
			<AppSetup>{props.children}</AppSetup>
		</ActionsProvider>
	);
};

export { DriftProvider };
