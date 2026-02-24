import { DriftClient, OracleSource } from '@drift-labs/sdk';
import { TransactionInstruction } from '@solana/web3.js';
import { expect } from 'chai';
import sinon from 'sinon';
import { getPythLazerUpdateIxs } from '../../src/drift/base/actions/markets/oracleCrank/pythLazerCrank';
import {
	OracleCrankDataFetcher,
	OracleMarketConfig,
} from '../../src/drift/base/actions/markets/oracleCrank/types';
import { DEFAULT_PRECEDING_IXS_COUNT } from '../../src/drift/base/actions/markets/oracleCrank/constants';

describe('getPythLazerUpdateIxs', () => {
	let driftClient: sinon.SinonStubbedInstance<DriftClient>;
	let fetcher: sinon.SinonStub;

	beforeEach(() => {
		driftClient = sinon.createStubInstance(DriftClient);
		fetcher = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should return empty array when no pyth lazer markets', async () => {
		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_PULL,
				pythFeedId: 'feed-a',
			} as unknown as OracleMarketConfig,
		];

		const result = await getPythLazerUpdateIxs(
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
				oracleSource: OracleSource.PYTH_LAZER,
				pythLazerId: 1,
			} as unknown as OracleMarketConfig,
			{
				oracleSource: OracleSource.PYTH_LAZER_1K,
				pythLazerId: 2,
			} as unknown as OracleMarketConfig,
			{
				oracleSource: OracleSource.PYTH_LAZER,
				pythLazerId: 1,
			} as unknown as OracleMarketConfig,
		];

		fetcher.resolves({ success: true, data: 'hex-data' });

		const mockIxs = [{} as TransactionInstruction];
		driftClient.getPostPythLazerOracleUpdateIxs.resolves(mockIxs);

		const result = await getPythLazerUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher,
			10
		);

		expect(fetcher.calledOnce).to.be.true;
		expect(fetcher.firstCall.args[0]).to.equal('pythLazer');
		expect(fetcher.firstCall.args[1]).to.deep.equal([1, 2]);
		expect(result).to.deep.equal(mockIxs);
	});

	it('should return empty array on fetch failure', async () => {
		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_LAZER,
				pythLazerId: 1,
			} as unknown as OracleMarketConfig,
		];

		fetcher.resolves({ success: false });

		const result = await getPythLazerUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher
		);

		expect(result).to.deep.equal([]);
		expect(driftClient.getPostPythLazerOracleUpdateIxs.called).to.be.false;
	});

	it('should pass result.data directly and correct precedingIxsCount + 1', async () => {
		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_LAZER,
				pythLazerId: 1,
			} as unknown as OracleMarketConfig,
		];

		fetcher.resolves({ success: true, data: 'hex-data' });
		driftClient.getPostPythLazerOracleUpdateIxs.resolves([]);

		const precedingIxsCount = 5;
		await getPythLazerUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher,
			undefined,
			precedingIxsCount
		);

		expect(driftClient.getPostPythLazerOracleUpdateIxs.calledOnce).to.be.true;
		const [ids, data, precedingIxs, overrideIndex] =
			driftClient.getPostPythLazerOracleUpdateIxs.firstCall.args;
		expect(ids).to.deep.equal([1]);
		expect(data).to.equal('hex-data');
		expect(precedingIxs).to.be.undefined;
		expect(overrideIndex).to.equal(precedingIxsCount + 1);
	});

	it('should use DEFAULT_PRECEDING_IXS_COUNT when not specified', async () => {
		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_LAZER,
				pythLazerId: 1,
			} as unknown as OracleMarketConfig,
		];

		fetcher.resolves({ success: true, data: 'hex-data' });
		driftClient.getPostPythLazerOracleUpdateIxs.resolves([]);

		await getPythLazerUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher
		);

		const [, , , overrideIndex] =
			driftClient.getPostPythLazerOracleUpdateIxs.firstCall.args;
		expect(overrideIndex).to.equal(DEFAULT_PRECEDING_IXS_COUNT + 1);
	});

	it('should return empty array on SDK error', async () => {
		const configs: OracleMarketConfig[] = [
			{
				oracleSource: OracleSource.PYTH_LAZER,
				pythLazerId: 1,
			} as unknown as OracleMarketConfig,
		];

		fetcher.resolves({ success: true, data: 'hex-data' });
		driftClient.getPostPythLazerOracleUpdateIxs.rejects(new Error('SDK error'));

		const result = await getPythLazerUpdateIxs(
			configs,
			driftClient as unknown as DriftClient,
			fetcher as OracleCrankDataFetcher
		);

		expect(result).to.deep.equal([]);
	});
});
