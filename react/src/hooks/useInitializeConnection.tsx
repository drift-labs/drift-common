import { useEffect } from 'react';
// import useSavedSettings from './useSavedSettings';
import { useDriftStore } from '../stores/useDriftStore';
import { useDriftActions } from './useDriftActions';
import { EnvironmentConstants } from '@drift/common';

const useInitializeConnection = () => {
	// todo get this to work:
	const Env = useDriftStore((s) => s.env);
	const actions = useDriftActions();
	// const [savedSettings] = useSavedSettings();

	// TODO probably get actual saved settings working, for now just select first one to test if this works at all
	const savedSettings = {
		rpc: EnvironmentConstants.rpcs.mainnet[0],
	};

	const initConnection = async () => {
		const rpcToUse = Env.rpcOverride
			? {
					label: 'RPC Override',
					value: Env.rpcOverride,
					allowAdditionalConnection: false,
			  }
			: savedSettings.rpc;

		if (Env.isDev) {
			console.log(`using driftEnv ${Env.driftEnv}`);
			console.log(`using rpc ${rpcToUse.value}`);
		}

		actions.updateConnection({
			newRpc: rpcToUse,
			newDriftEnv: Env.driftEnv,
		});
	};

	useEffect(() => {
		initConnection();
	}, [savedSettings]);
};

export default useInitializeConnection;
