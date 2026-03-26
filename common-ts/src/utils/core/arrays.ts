export const chunks = <T>(array: readonly T[], size: number): T[][] => {
	return new Array(Math.ceil(array.length / size))
		.fill(null)
		.map((_, index) => index * size)
		.map((begin) => array.slice(begin, begin + size));
};

export const glueArray = <T>(size: number, elements: T[]): T[][] => {
	const gluedElements: T[][] = [];

	elements.forEach((element, index) => {
		const gluedIndex = Math.floor(index / size);
		if (gluedElements[gluedIndex]) {
			gluedElements[gluedIndex].push(element);
		} else {
			gluedElements[gluedIndex] = [element];
		}
	});

	return gluedElements;
};
