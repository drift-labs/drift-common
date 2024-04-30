import { EnvironmentConstants, RpcEndpoint } from '@drift/common';
import { useLocalStorage } from '@solana/wallet-adapter-react';
import { singletonHook } from 'react-singleton-hook';
import { useCommonDriftStore } from '../stores';

export const MAINNET_RPCS = EnvironmentConstants.rpcs.mainnet;
export const DEVNET_RPCS = EnvironmentConstants.rpcs.dev;

const DEFAULT_MAINNET_RPC =
	MAINNET_RPCS[Math.floor(Math.random() * MAINNET_RPCS.length)];

const _useCurrentRpc = () => {
	const Env = useCommonDriftStore((s) => s.env);

	const rpcToUse =
		Env.driftEnv === 'mainnet-beta' ? DEFAULT_MAINNET_RPC : DEVNET_RPCS[0];

	// Turning this off for now because nothing loads on SSS when you switch rpc, press save, then reload
	const [savedRpc, setSavedRpc] = useLocalStorage<RpcEndpoint>(
		'currentRpc',
		rpcToUse
	);

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
