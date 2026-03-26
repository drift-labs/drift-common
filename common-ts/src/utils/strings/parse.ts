export const isValidBase58 = (str: string) =>
	/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str);

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
