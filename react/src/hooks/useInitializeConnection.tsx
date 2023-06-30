// import { useEffect } from 'react';

// import { useAppActions } from '@/hooks/useAppActions';
// import useSavedSettings from './useSavedSettings';
// import { useDriftStore } from '../stores/useDriftStore';

// const useInitializeConnection = () => {
// 	// todo get this to work:
// 	const Env = useDriftStore((s) => s.env);
// 	const actions = useAppActions();
// 	const [savedSettings] = useSavedSettings();

// 	const initConnection = async () => {
// 		const rpcToUse = Env.rpcOverride
// 			? {
// 					label: 'RPC Override',
// 					value: Env.rpcOverride,
// 					allowAdditionalConnection: false,
// 			  }
// 			: savedSettings.rpc;

// 		console.log(rpcToUse);

// 		if (Env.isDev) {
// 			console.log(`using driftEnv ${Env.driftEnv}`);
// 			console.log(`using rpc ${rpcToUse.value}`);
// 		}

// 		actions.updateConnection({
// 			newRpc: rpcToUse,
// 			newDriftEnv: Env.driftEnv,
// 		});
// 	};

// 	useEffect(() => {
// 		initConnection();
// 	}, [savedSettings]);
// };

// export default useInitializeConnection;
