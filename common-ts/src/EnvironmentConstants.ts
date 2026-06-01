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
				value: 'https://detailed-sharleen-fast-devnet.helius-rpc.com',
				wsValue: 'wss://detailed-sharleen-fast-devnet.helius-rpc.com',
				allowAdditionalConnection: true,
			},
			{
				label: 'RPC Pool',
				value:
					'https://drift-drift-a827.devnet.rpcpool.com/3639271b-6f0e-47c6-a643-1aaa0e498f58',
				wsValue:
					'wss://drift-drift-a827.devnet.rpcpool.com/3639271b-6f0e-47c6-a643-1aaa0e498f58/whirligig',
				allowAdditionalConnection: false,
			},
		] as RpcEndpoint[],
		mainnet: [
			{
				label: 'Triton RPC Pool 1',
				value: 'https://drift-drift_ma-39b5.mainnet.rpcpool.com/',
				wsValue: 'wss://drift-drift_ma-39b5.mainnet.rpcpool.com/whirligig',
				allowAdditionalConnection: true,
			},
			{
				label: 'Helius 1',
				value: 'https://margo-swuxg2-fast-mainnet.helius-rpc.com/',
				wsValue: 'wss://margo-swuxg2-fast-mainnet.helius-rpc.com/',
				allowAdditionalConnection: true,
			},
		] as RpcEndpoint[],
	},
	historyServerUrl: {
		dev: 'https://master.api.drift.trade',
		mainnet: 'https://mainnet-beta.api.drift.trade',
		staging: 'https://staging.api.drift.trade',
	},
	dataServerUrl: {
		dev: 'https://data-master.api.velocity.exchange',
		staging: 'https://data-staging.api.velocity.exchange',
		mainnet: 'https://data.api.velocity.exchange',
	},
	dlobServerHttpUrl: {
		dev: 'https://master.dlob.velocity.exchange',
		staging: 'https://staging.dlob.velocity.exchange',
		mainnet: 'https://dlob.velocity.exchange',
	},
	dlobServerWsUrl: {
		dev: 'wss://master.dlob.velocity.exchange/ws',
		staging: 'wss://staging.dlob.velocity.exchange/ws',
		mainnet: 'wss://dlob.velocity.exchange/ws',
	},
	eventsServerUrl: {
		staging: 'wss://events.velocity.exchange/ws',
		mainnet: 'wss://events.velocity.exchange/ws',
	},
	swiftServerUrl: {
		staging: 'https://master.swift.velocity.exchange',
		mainnet: 'https://swift.velocity.exchange',
	},
};
