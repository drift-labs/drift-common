import { COMMON_UI_UTILS } from '../../src/common-ui-utils/commonUiUtils';
import { expect } from 'chai';
describe('trimTrailingZeros', () => {
	it('trims trailing zeros after decimal', () => {
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
