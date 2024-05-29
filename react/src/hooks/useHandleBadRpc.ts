import { useCurrentRpc } from '@drift-labs/react';
import { EnvironmentConstants, getResponseTime } from '@drift/common';
import { useEffect } from 'react';
import useIsMainnet from './useIsMainnet';

const invalidRpcsRef: { current: string[] } = { current: [] };

export const useHandleBadRpc = (changeRpcCallback?: () => void) => {
	const [currentRpc, setCurrentRpc] = useCurrentRpc();

	const isMainnet = useIsMainnet();

	const rpcEndpoints = isMainnet
		? EnvironmentConstants.rpcs.mainnet
		: EnvironmentConstants.rpcs.dev;

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (!currentRpc) return;

			getResponseTime(currentRpc.value).then((responseTime) => {
				if (responseTime < 1) {
					invalidRpcsRef.current.push(currentRpc.value);

					const otherRpcs = rpcEndpoints.filter(
						(rpc) => !invalidRpcsRef.current.includes(rpc.value)
					);

					if (otherRpcs[0]) {
						setCurrentRpc(otherRpcs[0]);
						changeRpcCallback?.();
					}

					return;
				}
			});
		}, 3000); // we set a timeout because the saved RPC from the local storage may not be set in state yet

		return () => clearTimeout(timeout);
	}, [currentRpc, setCurrentRpc]);
};
