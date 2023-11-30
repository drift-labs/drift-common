export interface RpcEndpoint {
	label: string;
	value: string;
	wsValue?: string;
	allowAdditionalConnection: boolean;
}

export const EnvironmentConstants = {
	rpcs: {
		dev: [
			{
				label: 'Helius',
				value:
					'https://rpc-devnet.helius.xyz/?api-key=ff40c844-e15b-49d0-9d62-8534705aa48b',
				wsValue:
					'wss://rpc-devnet.helius.xyz/?api-key=ff40c844-e15b-49d0-9d62-8534705aa48b',
				allowAdditionalConnection: true,
			},
			{
				label: 'RPC Pool',
				value: 'https://drift-drift-a827.devnet.rpcpool.com',
				wsValue: 'wss://drift-drift-a827.devnet.rpcpool.com/whirligig',
				allowAdditionalConnection: false,
			},
		] as RpcEndpoint[],
		mainnet: [
			{
				label: 'Triton RPC Pool 1',
				value: 'https://drift-drift-951a.mainnet.rpcpool.com',
				wsValue: 'wss://drift-drift-951a.mainnet.rpcpool.com/whirligig',
				allowAdditionalConnection: true,
			},
			{
				label: 'Triton RPC Pool 2',
				value: 'https://drift-cranking.rpcpool.com/',
				wsValue: 'wss://drift-cranking.rpcpool.com/whirligig',
				allowAdditionalConnection: false,
			},
			{
				label: 'Helius 1',
				value: 'https://rpc-proxy.drift-labs.workers.dev/',
				wsValue: 'wss://rpc-proxy.drift-labs.workers.dev/',
				allowAdditionalConnection: true,
			},
			{
				label: 'Helius 2',
				value: 'https://cold-hanni-fast-mainnet.helius-rpc.com/',
				wsValue: 'wss://cold-hanni-fast-mainnet.helius-rpc.com/',
				allowAdditionalConnection: true,
			},
		] as RpcEndpoint[],
	},
	historyServerUrl: {
		dev: 'https://master.api.drift.trade',
		mainnet: 'https://mainnet-beta.api.drift.trade',
		staging: 'https://staging.api.drift.trade',
	},
	dlobServerHttpUrl: {
		dev: 'https://master.dlob.drift.trade',
		mainnet: 'https://mainnet-beta.api.drift.trade/dlob',
		staging: 'https://staging.dlob.drift.trade',
	},
	dlobServerWsUrl: {
		dev: 'wss://master.dlob.drift.trade/ws',
		mainnet: 'wss://dlob.drift.trade/ws',
		staging: 'wss://staging.dlob.drift.trade/ws',
	},
};
