export interface RpcEndpoint {
	label: string;
	value: string;
	allowAdditionalConnection: boolean;
}

export const EnvironmentConstants = {
	rpcs: {
		dev: [
			{
				label: 'Helius',
				value:
					'https://rpc-devnet.helius.xyz/?api-key=ff40c844-e15b-49d0-9d62-8534705aa48b',
				allowAdditionalConnection: true,
			},
			{
				label: 'Solana',
				value: 'https://api.devnet.solana.com',
				allowAdditionalConnection: false,
			},
			{
				label: 'RPC Pool',
				value: 'https://drift-drift-a827.devnet.rpcpool.com',
				allowAdditionalConnection: false,
			},
			{
				label: 'Ankr',
				value: 'https://rpc.ankr.com/solana_devnet',
				allowAdditionalConnection: false,
			},
		] as RpcEndpoint[],
		mainnet: [
			{
				label: 'Triton RPC Pool 1',
				value: 'https://drift.rpcpool.com',
				allowAdditionalConnection: true,
			},
			{
				label: 'Triton RPC Pool 2',
				value: 'https://drift-cranking.rpcpool.com/',
				allowAdditionalConnection: false,
			},
			{
				label: 'Helius',
				value: 'https://rpc-proxy.drift-labs.workers.dev/',
				allowAdditionalConnection: true,
			},
		] as RpcEndpoint[],
	},
	historyServerUrl: {
		dev: 'https://master.api.drift.trade',
		mainnet: 'https://mainnet-beta.api.drift.trade',
		staging: 'https://staging.api.drift.trade',
	},
	dlobServerUrl: {
		dev: 'https://master.dlob.drift.trade',
		mainnet: 'https://mainnet-beta.api.drift.trade/dlob',
	},
};
