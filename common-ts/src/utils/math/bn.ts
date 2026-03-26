import { BN } from '@drift-labs/sdk';

export const bnMin = (numbers: BN[]): BN => {
	let min = numbers[0];
	for (let i = 1; i < numbers.length; i++) {
		if (numbers[i].lt(min)) {
			min = numbers[i];
		}
	}
	return min;
};

export const bnMax = (numbers: BN[]): BN => {
	let max = numbers[0];
	for (let i = 1; i < numbers.length; i++) {
		if (numbers[i].gt(max)) {
			max = numbers[i];
		}
	}
	return max;
};

export const bnMedian = (numbers: BN[]): BN => {
	const sortedNumbers = numbers.sort((a, b) => a.cmp(b));
	const middleIndex = Math.floor(sortedNumbers.length / 2);
	if (sortedNumbers.length % 2 === 0) {
		return sortedNumbers[middleIndex - 1]
			.add(sortedNumbers[middleIndex])
			.div(new BN(2));
	} else {
		return sortedNumbers[middleIndex];
	}
};

export const bnMean = (numbers: BN[]): BN => {
	let sum = new BN(0);
	for (let i = 0; i < numbers.length; i++) {
		sum = sum.add(numbers[i]);
	}
	return sum.div(new BN(numbers.length));
};

export const sortBnAsc = (bnA: BN, bnB: BN) => {
	if (bnA.gt(bnB)) return 1;
	if (bnA.eq(bnB)) return 0;
	if (bnA.lt(bnB)) return -1;

	return 0;
};

export const sortBnDesc = (bnA: BN, bnB: BN) => sortBnAsc(bnB, bnA);
