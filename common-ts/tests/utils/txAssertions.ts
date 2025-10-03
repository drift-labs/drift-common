import { expect } from 'chai';
import {
	ComputeBudgetProgram,
	VersionedTransaction,
	PublicKey,
} from '@solana/web3.js';

export function assertComputeBudgetThenProgram(
	transaction: VersionedTransaction,
	programId: PublicKey,
	computeBudgetInstructionCount: number = 2
): void {
	transaction.message.compiledInstructions.forEach((ix, index) => {
		const ixProgramId =
			transaction.message.staticAccountKeys[ix.programIdIndex];
		if (index < computeBudgetInstructionCount) {
			expect(ixProgramId.toString()).to.equal(
				ComputeBudgetProgram.programId.toString()
			);
		} else {
			expect(ixProgramId.toString()).to.equal(programId.toString());
		}
	});
}
