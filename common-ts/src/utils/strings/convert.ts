import { BN, BigNum } from '@drift-labs/sdk';

/**
 * Recursively converts various types into printable strings.
 */
export function toPrintableObject(
	obj: unknown,
	/** Used to guard against circular refs during recursion. */
	seen: WeakSet<object> = new WeakSet()
): unknown {
	if (obj == null) {
		return null;
	}

	if (obj instanceof BigNum || BN.isBN(obj) || typeof obj === 'bigint') {
		return obj.toString();
	}

	if (obj instanceof Date) {
		const time = obj.getTime();

		if (Number.isNaN(time)) {
			return 'Invalid Date';
		}

		return obj.toISOString();
	}

	if (typeof obj === 'object') {
		if (seen.has(obj)) {
			return '[Circular]';
		}

		seen.add(obj);

		if (Array.isArray(obj)) {
			return obj.map((value) => toPrintableObject(value, seen));
		}

		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [
				key,
				toPrintableObject(value, seen),
			])
		);
	}

	return obj;
}

export function convertStringValuesToNumbers<T>(obj: T): T {
	if (typeof obj === 'string' && !isNaN(Number(obj))) {
		return Number(obj) as T;
	}

	if (Array.isArray(obj)) {
		return obj.map(convertStringValuesToNumbers) as T;
	}

	if (obj !== null && typeof obj === 'object') {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [
				key,
				convertStringValuesToNumbers(value),
			])
		) as T;
	}

	return obj;
}

/**
 * Returns an array of an object's string values (deep).
 */
export function extractStringValuesFromObject(value: object): string[] {
	if (typeof value === 'string') {
		return [value];
	}

	if (Array.isArray(value)) {
		return value.flatMap(extractStringValuesFromObject);
	}

	if (value && typeof value === 'object') {
		return Object.values(value).flatMap(extractStringValuesFromObject);
	}

	return [];
}
