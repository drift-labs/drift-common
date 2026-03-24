import {
	COMMON_UI_UTILS,
	abbreviateAddress,
} from '../../src/common-ui-utils/commonUiUtils';
import { abbreviateAccountName } from '../../src/utils/strings';
import { expect } from 'chai';
describe('trimTrailingZeros', () => {
	it('trims trailing zeros after decimal', () => {
		expect(COMMON_UI_UTILS.trimTrailingZeros('1.0000')).to.equal('1.0'); // default is leave 1 zero
		expect(COMMON_UI_UTILS.trimTrailingZeros('1.0000', 0)).to.equal('1');
		expect(COMMON_UI_UTILS.trimTrailingZeros('1.1000', 0)).to.equal('1.1');
		expect(COMMON_UI_UTILS.trimTrailingZeros('1.1200', 0)).to.equal('1.12');
		expect(COMMON_UI_UTILS.trimTrailingZeros('1.0010', 0)).to.equal('1.001');
	});

	it('handles numbers without trailing zeros', () => {
		expect(COMMON_UI_UTILS.trimTrailingZeros('1', 0)).to.equal('1');
		expect(COMMON_UI_UTILS.trimTrailingZeros('1.1', 0)).to.equal('1.1');
		expect(COMMON_UI_UTILS.trimTrailingZeros('1.123', 0)).to.equal('1.123');
	});

	it('handles zero', () => {
		expect(COMMON_UI_UTILS.trimTrailingZeros('0', 0)).to.equal('0');
		expect(COMMON_UI_UTILS.trimTrailingZeros('0.0', 0)).to.equal('0');
		expect(COMMON_UI_UTILS.trimTrailingZeros('0.000', 0)).to.equal('0');
	});
});

describe('abbreviateAddress', () => {
	it('returns start and end slices with unicode ellipsis', () => {
		const addr = 'ABCDEFGH1234567890';
		expect(abbreviateAddress(addr, 4)).to.equal('ABCD\u20267890');
	});
});

describe('abbreviateAccountName', () => {
	it('truncates with trailing ellipsis', () => {
		expect(abbreviateAccountName('DriftUserAccount', 8)).to.equal(
			'DriftUse...'
		);
	});

	it('supports middle ellipsis mode', () => {
		expect(
			abbreviateAccountName('DriftUserAccount', 8, {
				ellipsisMiddle: true,
			})
		).to.equal('Drif...ount');
	});

	it('returns name unchanged when shorter than size', () => {
		expect(abbreviateAccountName('Short', 8)).to.equal('Short');
	});
});
