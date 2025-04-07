import { CircularBuffer } from '../../src/utils/CircularBuffers';

describe('CircularBuffer', () => {
	let buffer: CircularBuffer<number>;

	beforeEach(() => {
		buffer = new CircularBuffer<number>(3);
	});

	test('should_create_an_empty_buffer', () => {
		expect(buffer.toArray()).toEqual([]);
	});

	test('should_add_elements_to_the_buffer', () => {
		buffer.add(1);
		buffer.add(2);
		expect(buffer.toArray()).toEqual([1, 2]);
	});

	test('should_maintain_circular_structure', () => {
		buffer.add(1);
		buffer.add(2);
		buffer.add(3);
		expect(buffer.toArray()).toEqual([1, 2, 3]);
		expect(buffer.add(4)).toBe(1);
		expect(buffer.toArray()).toEqual([2, 3, 4]);
	});

	test('should_return_null_when_buffer_is_not_full', () => {
		expect(buffer.add(1)).toBeNull();
		expect(buffer.add(2)).toBeNull();
		expect(buffer.toArray()).toEqual([1, 2]);
	});

	test('should_return_the_removed_element_when_buffer_is_full', () => {
		buffer.add(1);
		buffer.add(2);
		buffer.add(3);
		expect(buffer.add(4)).toBe(1);
		expect(buffer.toArray()).toEqual([2, 3, 4]);
	});

	test('should_handle_adding_elements_to_a_full_buffer', () => {
		buffer.add(1);
		buffer.add(2);
		buffer.add(3);
		buffer.add(4);
		buffer.add(5);
		expect(buffer.toArray()).toEqual([3, 4, 5]);
	});

	test('should_handle_a_buffer_with_capacity_1', () => {
		const singleBuffer = new CircularBuffer<number>(1);
		expect(singleBuffer.add(1)).toBeNull();
		expect(singleBuffer.add(2)).toBe(1);
		expect(singleBuffer.toArray()).toEqual([2]);
	});

	test('should_handle_adding_different_data_types', () => {
		const stringBuffer = new CircularBuffer<string>(2);
		stringBuffer.add('a');
		stringBuffer.add('b');
		expect(stringBuffer.add('c')).toBe('a');
		expect(stringBuffer.toArray()).toEqual(['b', 'c']);
	});
});
