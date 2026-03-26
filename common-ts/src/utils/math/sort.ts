import { BN } from '@drift-labs/sdk';

/**
 * Helper utility to get a sort score for "tiered" parameters.
 *
 * Example: Want to sort students by Grade, but fall back to using Age if they are equal. This method will accept an array for each student of [grade, age] and return the appropriate sort score for each.
 *
 * @param aScores
 * @param bScores
 * @returns
 */
export const getTieredSortScore = (aScores: number[], bScores: number[]) => {
	const maxIndex = Math.max(aScores.length, bScores.length);

	for (let i = 0; i < maxIndex; i++) {
		const aScore = aScores[i] ?? Number.MIN_SAFE_INTEGER;
		const bScore = bScores[i] ?? Number.MIN_SAFE_INTEGER;

		if (aScore !== bScore) return aScore - bScore;
	}

	return 0;
};

export const sortRecordsByTs = <T extends { ts: BN }[]>(
	records: T | undefined,
	direction: 'asc' | 'desc' = 'desc'
) => {
	if (!records || !records?.length) return [];

	return direction === 'desc'
		? [...records].sort((a, b) => b.ts.toNumber() - a.ts.toNumber())
		: [...records].sort((a, b) => a.ts.toNumber() - b.ts.toNumber());
};
