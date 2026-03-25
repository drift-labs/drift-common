export const allEnvDlog = (
	key: string,
	message: any,
	...optionalParams: any[]
) => {
	console.debug(`🔧::${key}::\n${message}`, ...optionalParams);
};
