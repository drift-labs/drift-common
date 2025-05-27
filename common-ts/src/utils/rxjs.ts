import { Subject, Observable } from 'rxjs';
import { filter, share } from 'rxjs/operators';
import { UniqueCircularBuffer } from './CircularBuffers/UniqueCircularBuffer';

/**
 * Deduplicated subject, using UniqueCircularBuffer to dedupe the input subject.
 *
 * The windowSize defines the amount of unique elements to keep in memory for the sake of deduplicating. Any incoming duplicate objects will NOT be added to the buffer so won't take up space.
 * @param inputSubject
 * @param windowSize maximum size of recent unique objects which will be stored to use for deduplication
 * @param uniquenessKeyGenerator function that generates a unique key for an object
 * @returns
 */
export function dedupeSubject<T>(
	inputSubject: Subject<T>,
	windowSize: number,
	uniquenessKeyGenerator: (a: T) => string
): Observable<T> {
	const buffer = new UniqueCircularBuffer<T>(
		windowSize,
		uniquenessKeyGenerator
	);

	const dedupedObservable = inputSubject.pipe(
		filter((value) => {
			const added = buffer.add(value);

			return added;
		}),
		share()
	);

	return dedupedObservable;
}
