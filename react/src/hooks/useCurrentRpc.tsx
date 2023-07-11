import { EnvironmentConstants, RpcEndpoint } from '@drift/common';
import { useLocalStorage } from '@solana/wallet-adapter-react';
import { singletonHook } from 'react-singleton-hook';
import { useCommonDriftStore } from '../stores';

export const MAINNET_RPCS = EnvironmentConstants.rpcs.mainnet;
export const DEVNET_RPCS = EnvironmentConstants.rpcs.dev;

const DEFAULT_MAINNET_RPC =
	MAINNET_RPCS.find((rpc) => rpc.label.toLowerCase().match('helius')) ||
	MAINNET_RPCS[0];

const _useCurrentRpc = () => {
	const Env = useCommonDriftStore((s) => s.env);

	const rpcToUse =
		Env.driftEnv === 'mainnet-beta' ? DEFAULT_MAINNET_RPC : DEVNET_RPCS[0];

	const [savedRpc, setSavedRpc] = useLocalStorage<RpcEndpoint>(
		'currentRpc',
		rpcToUse
	);

	return [savedRpc, setSavedRpc] as [
		RpcEndpoint,
		(savedRpc: RpcEndpoint) => void
	];
};

export const useCurrentRpc = singletonHook(
	[DEFAULT_MAINNET_RPC, () => {}] as [
		RpcEndpoint,
		(savedRpc: RpcEndpoint) => void
	],
	_useCurrentRpc
);
