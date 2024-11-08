export const getStyleValue = (value: string) => {
	if (!isWindowDefined()) throw 'trying to getStyleValue when unmounted';

	return window.getComputedStyle(document.body).getPropertyValue(value);
};

const isWindowDefined = () => typeof window !== 'undefined';
