import {
	DriftClient,
	PerpMarketAccount,
	SpotMarketAccount,
} from '@drift-labs/sdk';

export class CentralServerDriftMarkets {
	constructor(private readonly driftClient: DriftClient) {}

	async getPerpMarketAccount(
		marketIndex: number
	): Promise<PerpMarketAccount | undefined> {
		return this.driftClient.getPerpMarketAccount(marketIndex);
	}

	async getSpotMarketAccount(
		marketIndex: number
	): Promise<SpotMarketAccount | undefined> {
		return this.driftClient.getSpotMarketAccount(marketIndex);
	}
}
