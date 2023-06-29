import React, { PropsWithChildren } from 'react';

// import useIdlePollingRateSwitcher from '../hooks/useIdlePollingRateSwitcher';
// import useInitializeConnection from '../hooks/useInitializeConnection';
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

	return <>{props.children}</>;
};

export { DriftProvider };
