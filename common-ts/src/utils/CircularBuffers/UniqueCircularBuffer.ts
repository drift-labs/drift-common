import { CircularBuffer } from './CircularBuffer';

class Node<T> {
	constructor(
		public value: T,
		public next: Node<T> | null = null
	) {}
}

/**
 * A circular buffer that only allows unique elements based on a key generator function.
 * When adding an element, if its generated key already exists in the buffer, the element
 * is not added and the add operation returns false. When the buffer is full and a new
 * unique element is added, the oldest element is removed to make space.
 */
export class UniqueCircularBuffer<T> extends CircularBuffer<T> {
	private uniqueKeys: Set<string> = new Set();

	constructor(
		capacity: number,
		private uniquenessKeyGenerator: (value: T) => string
	) {
		super(capacity);
	}

	/**
	 * Try add an element to the buffer. Returns true if the element was added, false if it was already in the buffer.
	 * @param value
	 * @returns
	 */
	// @ts-expect-error :: we're reimplementing add from CircularBuffer but with a different interface. This is fine.
	add(value: T): boolean {
		const key = this.uniquenessKeyGenerator(value);

		if (this.uniqueKeys.has(key)) {
			return false;
		}

		const newNode = new Node(value);

		if (this.size === 0) {
			// If the buffer is empty, set the head and tail to the new node
			this.tail = newNode;
			this.head = this.tail;
			newNode.next = newNode;
		} else {
			// Point the new node to the head
			newNode.next = this.head;
			// Point the current tail to the new node
			this.tail.next = newNode;
			// Update the tail to the new node
			this.tail = newNode;
		}

		this.size++;
		this.uniqueKeys.add(key);

		if (this.size > this.capacity) {
			// If the buffer is full, remove the head
			const nodeToRemove = this.head;
			// Update the head to the element after the head
			this.head = this.head.next;
			// Point the tail to the new head
			this.tail.next = this.head;
			this.size--;

			const removedKey = this.uniquenessKeyGenerator(nodeToRemove.value);
			this.uniqueKeys.delete(removedKey);
		}

		return true;
	}

	toArray(): T[] {
		if (!this.head) return [];
		const result: T[] = [];
		let current = this.head;
		do {
			result.push(current.value);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			current = current.next!;
		} while (current !== this.head);
		return result;
	}
}
