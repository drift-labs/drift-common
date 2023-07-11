import { useEffect } from 'react';
import { useCommonDriftStore } from '../stores/useCommonDriftStore';
import { useDriftActions } from './useDriftActions';

const useInitializeConnection = () => {
	const [Env, currentRpc] = useCommonDriftStore((s) => [s.env, s.currentRpc]);
	const actions = useDriftActions();

	const initConnection = async () => {
		const rpcToUse = Env.rpcOverride
			? {
					label: 'RPC Override',
					value: Env.rpcOverride,
					allowAdditionalConnection: false,
			  }
			: currentRpc;

		if (Env.isDev) {
			console.log(`using driftEnv ${Env.driftEnv}`);
			console.log(`using rpc ${currentRpc?.value}`);
		}

		if (!rpcToUse) {
			return;
		}

		actions.updateConnection({
			newRpc: rpcToUse,
			newDriftEnv: Env.driftEnv,
		});
	};

	useEffect(() => {
		initConnection();
	}, [currentRpc, Env.driftEnv, Env.rpcOverride]);
};

export default useInitializeConnection;
