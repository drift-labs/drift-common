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
				value: 'https://detailed-sharleen-fast-devnet.helius-rpc.com/',
				wsValue: 'wss://detailed-sharleen-fast-devnet.helius-rpc.com/',
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
				label: 'Helius 1',
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
		mainnet: 'https://dlob.drift.trade',
		staging: 'https://staging.dlob.drift.trade',
	},
	dlobServerWsUrl: {
		dev: 'wss://master.dlob.drift.trade/ws',
		mainnet: 'wss://dlob.drift.trade/ws',
		staging: 'wss://staging.dlob.drift.trade/ws',
	},
	eventsServerUrl: {
		mainnet: 'wss://events.drift.trade/ws',
		staging: 'wss://events.drift.trade/ws',
	},
};
