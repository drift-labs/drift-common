export const matchEnum = (enum1: any, enum2) => {
	return JSON.stringify(enum1) === JSON.stringify(enum2);
};

function enumToObj(enumStr: string) {
	if (!enumStr) return undefined;

	return {
		[enumStr ?? '']: {},
	};
}

function enumToStr(enumStr: Record<string, any>) {
	return Object.keys(enumStr ?? {})?.[0];
}

export const ENUM_UTILS = {
	match: matchEnum,
	toObj: enumToObj,
	toStr: enumToStr,
};
