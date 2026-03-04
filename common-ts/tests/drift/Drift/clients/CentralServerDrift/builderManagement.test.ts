import { expect } from 'chai';
import { PublicKey } from '@drift-labs/sdk';
import { VersionedTransaction } from '@solana/web3.js';
import {
	centralServerDrift,
	driftClient,
	setupTestContext,
	teardownTestContext,
} from './context';
import { assertComputeBudgetThenProgram } from '../../../../utils/txAssertions';
import { getTestWallet } from '../../../../utils/wallet';

describe('CentralServerDrift - Builder Management Transactions', function () {
	this.timeout(25_000);

	let testWalletAuthority: PublicKey;

	before(async () => {
		await setupTestContext();
		const testWallet = await getTestWallet();
		testWalletAuthority = testWallet.publicKey;
	});

	after(async () => {
		await teardownTestContext();
	});

	beforeEach(async () => {
		await new Promise((resolve) => setTimeout(resolve, 15_000));
	});

	describe('getCreateRevenueShareEscrowTxn', () => {
		it('should create transaction to initialize revenue share escrow', async () => {
			const txn = await centralServerDrift.getCreateRevenueShareEscrowTxn(
				testWalletAuthority,
				{
					txParams: {
						computeUnits: 1_000_000,
						computeUnitsPrice: 1_000,
					},
				}
			);

			expect(txn).to.exist;

			assertComputeBudgetThenProgram(
				txn as VersionedTransaction,
				driftClient.program.programId,
				2
			);
		});

		it('should create transaction with custom numOrders', async () => {
			const txn = await centralServerDrift.getCreateRevenueShareEscrowTxn(
				testWalletAuthority,
				{
					numOrders: 32,
					txParams: {
						computeUnits: 1_000_000,
						computeUnitsPrice: 1_000,
					},
				}
			);

			expect(txn).to.exist;

			assertComputeBudgetThenProgram(
				txn as VersionedTransaction,
				driftClient.program.programId,
				2
			);
		});

		it('should create transaction with bundled builder approval', async () => {
			const mockBuilderAuthority = PublicKey.unique();

			const txn = await centralServerDrift.getCreateRevenueShareEscrowTxn(
				testWalletAuthority,
				{
					builder: {
						builderAuthority: mockBuilderAuthority,
						maxFeeTenthBps: 50,
					},
					txParams: {
						computeUnits: 1_000_000,
						computeUnitsPrice: 1_000,
					},
				}
			);

			expect(txn).to.exist;

			// Should have compute budget ixs + escrow init ix + builder approve ix
			const versionedTxn = txn as VersionedTransaction;
			expect(
				versionedTxn.message.compiledInstructions.length
			).to.be.greaterThanOrEqual(4);
		});
	});

	describe('getCreateRevenueShareAccountTxn', () => {
		it('should create transaction to initialize revenue share account', async () => {
			const txn = await centralServerDrift.getCreateRevenueShareAccountTxn(
				testWalletAuthority,
				{
					txParams: {
						computeUnits: 1_000_000,
						computeUnitsPrice: 1_000,
					},
				}
			);

			expect(txn).to.exist;

			assertComputeBudgetThenProgram(
				txn as VersionedTransaction,
				driftClient.program.programId,
				2
			);
		});
	});

	describe('getConfigureApprovedBuilderTxn', () => {
		it('should create transaction to approve a builder', async () => {
			const mockBuilderAuthority = PublicKey.unique();

			const txn = await centralServerDrift.getConfigureApprovedBuilderTxn(
				testWalletAuthority,
				mockBuilderAuthority,
				50, // 5 bps
				{
					txParams: {
						computeUnits: 1_000_000,
						computeUnitsPrice: 1_000,
					},
				}
			);

			expect(txn).to.exist;

			assertComputeBudgetThenProgram(
				txn as VersionedTransaction,
				driftClient.program.programId,
				2
			);
		});

		it('should create transaction to revoke a builder (maxFeeTenthBps = 0)', async () => {
			const mockBuilderAuthority = PublicKey.unique();

			const txn = await centralServerDrift.getConfigureApprovedBuilderTxn(
				testWalletAuthority,
				mockBuilderAuthority,
				0, // revoke
				{
					txParams: {
						computeUnits: 1_000_000,
						computeUnitsPrice: 1_000,
					},
				}
			);

			expect(txn).to.exist;

			assertComputeBudgetThenProgram(
				txn as VersionedTransaction,
				driftClient.program.programId,
				2
			);
		});
	});
});
