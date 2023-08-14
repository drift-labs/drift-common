import { useEffect } from 'react';
import { useCommonDriftStore } from '../stores/useCommonDriftStore';
import { useCommonDriftActions } from './useCommonDriftActions';
import { useCurrentRpc } from './useCurrentRpc';
import { DriftClientConfig } from '@drift-labs/sdk';

const useInitializeConnection = (
	additionalDriftClientConfig: Partial<DriftClientConfig> = {}
) => {
	const Env = useCommonDriftStore((s) => s.env);
	const actions = useCommonDriftActions();
	const [currentRpc] = useCurrentRpc();

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
			console.log(`using rpc ${currentRpc.value}`);
		}

		if (!rpcToUse) {
			return;
		}

		actions.updateConnection({
			newRpc: rpcToUse,
			newDriftEnv: Env.driftEnv,
			additionalDriftClientConfig,
		});
	};

	useEffect(() => {
		initConnection();
	}, [currentRpc, Env.driftEnv, Env.rpcOverride]);
};

export default useInitializeConnection;
