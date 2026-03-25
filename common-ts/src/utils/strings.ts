import { BN, BigNum } from '@drift-labs/sdk';

export const isValidBase58 = (str: string) =>
	/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str);

export function abbreviateAccountName(
	name: string,
	size = 8,
	opts?: {
		ellipsisMiddle?: boolean;
	}
) {
	if (name.length <= size) return name;

	if (opts?.ellipsisMiddle) {
		const length = name.length;
		const sizeMid = Math.floor(size / 2);

		return name.slice(0, sizeMid) + '...' + name.slice(length - sizeMid);
	}

	return name.slice(0, size) + '...';
}

export function splitByCapitalLetters(word: string) {
	return word.replace(/([A-Z])/g, ' $1').trim();
}

export function lowerCaseNonFirstWords(sentence: string): string {
	const words = sentence.split(' ');
	for (let i = 1; i < words.length; i++) {
		words[i] = words[i].toLowerCase();
	}
	return words.join(' ');
}

export const disallowNegativeStringInput = (str: string): string => {
	if (str && str.charAt(0) === '-') {
		return '0';
	}
	return str;
};

/**
 * LastOrder status types from https://github.com/drift-labs/infrastructure-v3/blob/8ab1888eaaaed96228406b562d4a399729d042d7/packages/common/src/types/index.ts#L221
 */
const LAST_ORDER_STATUS_LABELS = {
	open: 'Open',
	filled: 'Filled',
	partial_fill: 'Partially Filled',
	cancelled: 'Canceled',
	partial_fill_cancelled: 'Partially Filled & Canceled',
	expired: 'Expired',
	trigger: 'Triggered',
} as const;
export type LastOrderStatus = keyof typeof LAST_ORDER_STATUS_LABELS;
export type LastOrderStatusLabel =
	(typeof LAST_ORDER_STATUS_LABELS)[LastOrderStatus];

export function lastOrderStatusToNormalEng(
	status: string
): LastOrderStatusLabel | string {
	return LAST_ORDER_STATUS_LABELS[status as LastOrderStatus] ?? status;
}

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
