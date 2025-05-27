import { CircularBuffer } from '../../src/utils/CircularBuffers';
import { expect } from 'chai';

describe('CircularBuffer', () => {
	let buffer: CircularBuffer<number>;

	beforeEach(() => {
		buffer = new CircularBuffer<number>(3);
	});

	it('should_create_an_empty_buffer', () => {
		expect(buffer.toArray()).to.deep.equal([]);
	});

	it('should_add_elements_to_the_buffer', () => {
		buffer.add(1);
		buffer.add(2);
		expect(buffer.toArray()).to.deep.equal([1, 2]);
	});

	it('should_maintain_circular_structure', () => {
		buffer.add(1);
		buffer.add(2);
		buffer.add(3);
		expect(buffer.toArray()).to.deep.equal([1, 2, 3]);
		expect(buffer.add(4)).to.equal(1);
		expect(buffer.toArray()).to.deep.equal([2, 3, 4]);
	});

	it('should_return_null_when_buffer_is_not_full', () => {
		expect(buffer.add(1)).to.be.null;
		expect(buffer.add(2)).to.be.null;
		expect(buffer.toArray()).to.deep.equal([1, 2]);
	});

	it('should_return_the_removed_element_when_buffer_is_full', () => {
		buffer.add(1);
		buffer.add(2);
		buffer.add(3);
		expect(buffer.add(4)).to.equal(1);
		expect(buffer.toArray()).to.deep.equal([2, 3, 4]);
	});

	it('should_handle_adding_elements_to_a_full_buffer', () => {
		buffer.add(1);
		buffer.add(2);
		buffer.add(3);
		buffer.add(4);
		buffer.add(5);
		expect(buffer.toArray()).to.deep.equal([3, 4, 5]);
	});

	it('should_handle_a_buffer_with_capacity_1', () => {
		const singleBuffer = new CircularBuffer<number>(1);
		expect(singleBuffer.add(1)).to.be.null;
		expect(singleBuffer.add(2)).to.equal(1);
		expect(singleBuffer.toArray()).to.deep.equal([2]);
	});

	it('should_handle_adding_different_data_types', () => {
		const stringBuffer = new CircularBuffer<string>(2);
		stringBuffer.add('a');
		stringBuffer.add('b');
		expect(stringBuffer.add('c')).to.equal('a');
		expect(stringBuffer.toArray()).to.deep.equal(['b', 'c']);
	});
});
