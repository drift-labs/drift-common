import { DriftClient, OracleSource } from '@drift-labs/sdk';
import { TransactionInstruction } from '@solana/web3.js';
import { expect } from 'chai';
import sinon from 'sinon';
import { getPythPullUpdateIxs } from '../../src/drift/base/actions/markets/oracleCrank/pythPullCrank';
import {
	OracleCrankDataFetcher,
	OracleMarketConfig,
} from '../../src/drift/base/actions/markets/oracleCrank/types';

describe('getPythPullUpdateIxs', () => {
	let driftClient: sinon.SinonStubbedInstance<DriftClient>;
	let fetcher: sinon.SinonStub;

	beforeEach(() => {
		driftClient = sinon.createStubInstance(DriftClient);
		fetcher = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should return empty array when no pyth pull markets', async () => {
		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_LAZER,
				pythLazerId: 1,
			} as unknown as OracleMarketConfig,
		];

		const result = await getPythPullUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher
		);

		expect(result).to.deep.equal([]);
		expect(fetcher.called).to.be.false;
	});

	it('should call fetcher with correct deduped feed IDs', async () => {
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
				oracleSource: OracleSource.PYTH_PULL,
				pythFeedId: 'feed-a',
			} as unknown as OracleMarketConfig,
		];

		fetcher.resolves({ success: true, data: 'vaa-data' });

		const mockIxs = [{} as TransactionInstruction];
		driftClient.getPostPythPullOracleUpdateAtomicIxs.resolves(mockIxs);

		const result = await getPythPullUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher,
			10
		);

		expect(fetcher.calledOnce).to.be.true;
		expect(fetcher.firstCall.args[0]).to.equal('pythPull');
		expect(fetcher.firstCall.args[1]).to.deep.equal(['feed-a', 'feed-b']);
		expect(result).to.deep.equal(mockIxs);
	});

	it('should return empty array on fetch failure', async () => {
		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_PULL,
				pythFeedId: 'feed-a',
			} as unknown as OracleMarketConfig,
		];

		fetcher.resolves({ success: false });

		const result = await getPythPullUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher
		);

		expect(result).to.deep.equal([]);
		expect(driftClient.getPostPythPullOracleUpdateAtomicIxs.called).to.be.false;
	});

	it('should pass correct args to getPostPythPullOracleUpdateAtomicIxs', async () => {
		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_PULL,
				pythFeedId: 'feed-a',
			} as unknown as OracleMarketConfig,
		];

		fetcher.resolves({ success: true, data: 'vaa-data' });
		driftClient.getPostPythPullOracleUpdateAtomicIxs.resolves([]);

		await getPythPullUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher
		);

		expect(driftClient.getPostPythPullOracleUpdateAtomicIxs.calledOnce).to.be
			.true;
		const [data, ids] =
			driftClient.getPostPythPullOracleUpdateAtomicIxs.firstCall.args;
		expect(data).to.equal('vaa-data');
		expect(ids).to.deep.equal(['feed-a']);
	});

	it('should return empty array on SDK error', async () => {
		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_PULL,
				pythFeedId: 'feed-a',
			} as unknown as OracleMarketConfig,
		];

		fetcher.resolves({ success: true, data: 'vaa-data' });
		driftClient.getPostPythPullOracleUpdateAtomicIxs.rejects(
			new Error('SDK error')
		);

		const result = await getPythPullUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher
		);

		expect(result).to.deep.equal([]);
	});
});
