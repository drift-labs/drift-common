import { EnvironmentConstants, RpcEndpoint } from '@drift/common';
import { singletonHook } from 'react-singleton-hook';
import { useCommonDriftStore } from '../stores';
import { useSyncLocalStorage } from './useSyncLocalStorage';

export const MAINNET_RPCS = EnvironmentConstants.rpcs.mainnet;
export const DEVNET_RPCS = EnvironmentConstants.rpcs.dev;

const DEFAULT_MAINNET_RPC =
	MAINNET_RPCS[Math.floor(Math.random() * MAINNET_RPCS.length)];

const _useCurrentRpc = () => {
	const Env = useCommonDriftStore((s) => s.env);

	const rpcToUse =
		Env.driftEnv === 'mainnet-beta' ? DEFAULT_MAINNET_RPC : DEVNET_RPCS[0];

	const [savedRpc, setSavedRpc] = useSyncLocalStorage<RpcEndpoint>(
		'currentRpc',
		rpcToUse
	);

	// if saved rpc was removed, revert to default
	const rpcList = Env.driftEnv === 'mainnet-beta' ? MAINNET_RPCS : DEVNET_RPCS;
	if (
		!rpcList
			.map((rpc) => rpc?.value)
			.filter((val) => !!val)
			.includes(savedRpc?.value)
	) {
		return [DEFAULT_MAINNET_RPC, setSavedRpc] as [
			RpcEndpoint,
			(savedRpc: RpcEndpoint) => void
		];
	}

	const dedupedRpc =
		savedRpc.value === DEFAULT_MAINNET_RPC.value
			? DEFAULT_MAINNET_RPC
			: savedRpc;

	return [dedupedRpc, setSavedRpc] as [
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
