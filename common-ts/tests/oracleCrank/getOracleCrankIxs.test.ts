import { DriftClient, OracleSource } from '@drift-labs/sdk';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import sinon from 'sinon';
import { getOracleCrankIxs } from '../../src/drift/base/actions/markets/oracleCrank/getOracleCrankIxs';
import { OracleMarketConfig } from '../../src/drift/base/actions/markets/oracleCrank/types';

describe('getOracleCrankIxs', () => {
	let driftClient: sinon.SinonStubbedInstance<DriftClient>;
	let fetcher: sinon.SinonStub;

	beforeEach(() => {
		driftClient = sinon.createStubInstance(DriftClient);
		fetcher = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should return empty array for empty marketConfigs', async () => {
		const result = await getOracleCrankIxs({
			marketConfigs: [],
			driftClient: driftClient as unknown as DriftClient,
			fetchCrankData: fetcher,
		});

		expect(result).to.deep.equal([]);
		expect(fetcher.called).to.be.false;
	});

	it('should fetch both pyth pull and lazer in parallel and combine results', async () => {
		const pullIx = {
			programId: PublicKey.default,
			keys: [],
			data: Buffer.from('pull'),
		} as TransactionInstruction;
		const lazerIx = {
			programId: PublicKey.default,
			keys: [],
			data: Buffer.from('lazer'),
		} as TransactionInstruction;

		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_PULL,
				pythFeedId: 'feed-a',
			} as unknown as OracleMarketConfig,
			{
				oracleSource: OracleSource.PYTH_LAZER,
				pythLazerId: 1,
			} as unknown as OracleMarketConfig,
		];

		fetcher
			.withArgs('pythPull', sinon.match.any)
			.resolves({ success: true, data: 'vaa-data' });
		fetcher
			.withArgs('pythLazer', sinon.match.any)
			.resolves({ success: true, data: 'hex-data' });

		driftClient.getPostPythPullOracleUpdateAtomicIxs.resolves([pullIx]);
		driftClient.getPostPythLazerOracleUpdateIxs.resolves([lazerIx]);

		const result = await getOracleCrankIxs({
			marketConfigs: configs,
			driftClient: driftClient as unknown as DriftClient,
			fetchCrankData: fetcher,
		});

		expect(result).to.have.length(2);
		expect(result[0]).to.equal(pullIx);
		expect(result[1]).to.equal(lazerIx);
	});

	it('should return results in correct order (pull first, lazer second)', async () => {
		const pullIx1 = {
			programId: PublicKey.default,
			keys: [],
			data: Buffer.from('pull1'),
		} as TransactionInstruction;
		const pullIx2 = {
			programId: PublicKey.default,
			keys: [],
			data: Buffer.from('pull2'),
		} as TransactionInstruction;
		const lazerIx1 = {
			programId: PublicKey.default,
			keys: [],
			data: Buffer.from('lazer1'),
		} as TransactionInstruction;

		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_PULL,
				pythFeedId: 'feed-a',
			} as unknown as OracleMarketConfig,
			{
				oracleSource: OracleSource.PYTH_1K_PULL,
				pythFeedId: 'feed-b',
			} as unknown as OracleMarketConfig,
			{
				oracleSource: OracleSource.PYTH_LAZER,
				pythLazerId: 1,
			} as unknown as OracleMarketConfig,
		];

		fetcher
			.withArgs('pythPull', sinon.match.any)
			.resolves({ success: true, data: 'vaa-data' });
		fetcher
			.withArgs('pythLazer', sinon.match.any)
			.resolves({ success: true, data: 'hex-data' });

		driftClient.getPostPythPullOracleUpdateAtomicIxs.resolves([
			pullIx1,
			pullIx2,
		]);
		driftClient.getPostPythLazerOracleUpdateIxs.resolves([lazerIx1]);

		const result = await getOracleCrankIxs({
			marketConfigs: configs,
			driftClient: driftClient as unknown as DriftClient,
			fetchCrankData: fetcher,
		});

		expect(result).to.deep.equal([pullIx1, pullIx2, lazerIx1]);
	});
});
