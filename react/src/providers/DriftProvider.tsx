import React, { PropsWithChildren } from 'react';

// import useInitializeConnection from '../hooks/useInitializeConnection';
// import useIdlePollingRateSwitcher from '../hooks/useIdlePollingRateSwitcher';
import { DriftStoreState, useDriftStore } from '../stores/useDriftStore';

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

const DriftProvider = (props: PropsWithChildren) => {
	const env = useDriftStore((s: DriftStoreState) => s.env);

	// useInitializeConnection();
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

export { DriftProvider };
