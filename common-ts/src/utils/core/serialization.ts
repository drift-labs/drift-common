import { BN, PublicKey } from '@drift-labs/sdk';

const getStringifiableObjectEntry = (value: any): [any, string] => {
	// If BN
	// if (value instanceof BN) { /* This method would be much safer but don't think it's possible to ensure that instances of classes match when they're in different npm packages */
	if (Object.keys(value).sort().join(',') === 'length,negative,red,words') {
		return [value.toString(), '_bgnm_'];
	}

	// If PublicKey
	// if (value instanceof PublicKey) { { /* This method would be much safer but don't think it's possible to ensure that instances of classes match when they're in different npm packages */
	if (Object.keys(value).sort().join(',') === '_bn') {
		return [value.toString(), '_pbky_'];
	}

	if (typeof value === 'object') {
		return [encodeStringifiableObject(value), ''];
	}

	return [value, ''];
};

/**
 * Converts an objects with potential Pubkeys and BNs in it into a form that can be JSON stringified. When pubkeys get converted a _pbky_ suffix will be added to their key, and _bgnm_ for BNs.
 *
 * e.g.
 * input : {
 * QuoteAmount: BN
 * }
 *
 * output: {
 * _bgnm_QuoteAmount: string
 * }
 * @param value
 * @returns
 */
export const encodeStringifiableObject = (value: any) => {
	if (typeof value !== 'object') return value;

	if (Array.isArray(value)) {
		return value.map((entry) => encodeStringifiableObject(entry));
	}

	const buildJsonObject = {};

	if (!value) return value;

	Object.entries(value).forEach(([key, val]) => {
		const [convertedVal, keyTag] = getStringifiableObjectEntry(val);
		buildJsonObject[`${keyTag}${key}`] = convertedVal;
	});

	return buildJsonObject;
};

/**
 * Converts a parsed object with potential Pubkeys and BNs in it (in string form) to their proper form. Pubkey values must have a key starting in _pbky_ and BN values must have a key starting in _bnnm_
 *
 * * e.g.
 * input : {
 * _bgnm_QuoteAmount: string
 * }
 *
 * output: {
 * QuoteAmount: BN
 * }
 * @param value
 * @returns
 */
export const decodeStringifiableObject = (value: any) => {
	if (typeof value !== 'object') return value;

	if (Array.isArray(value)) {
		return value.map((entry) => decodeStringifiableObject(entry));
	}

	const buildJsonObject = {};

	Object.entries(value)
		.filter((val) => val != undefined && val != null)
		.forEach(([key, val]) => {
			if (key.match(/^_pbky_/)) {
				buildJsonObject[key.replace('_pbky_', '')] = new PublicKey(val);
				return;
			}

			if (key.match(/^_bgnm_/)) {
				buildJsonObject[key.replace('_bgnm_', '')] = new BN(val as string);
				return;
			}

			if (typeof val === 'object' && val != undefined && val != null) {
				buildJsonObject[key] = decodeStringifiableObject(val);
				return;
			}

			buildJsonObject[key] = val;
		});

	return buildJsonObject;
};
