import { OrderActionExplanation } from '@drift-labs/sdk';
import { expect } from 'chai';
import { ENUM_UTILS } from '../../src/utils';

describe('Enum Utils', () => {
	describe('ENUM_UTILS are consistent', () => {
		it('should be consistent when converting between strings and objects', () => {
			const actionExplanation =
				OrderActionExplanation.ORDER_FILLED_WITH_AMM_JIT;
			const stringedActionExplanation = ENUM_UTILS.toStr(actionExplanation);
			const backToObjActionExplanation = ENUM_UTILS.toObj(
				stringedActionExplanation
			);
			expect(ENUM_UTILS.match(actionExplanation, backToObjActionExplanation)).to
				.be.true;
		});
	});
});
