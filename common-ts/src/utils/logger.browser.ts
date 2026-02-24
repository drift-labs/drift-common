// Browser-safe logger stub. Replaces the Node-only winston logger when bundled
// for browser / React Native environments via the package.json "browser" field.

const logTemplateCache = new Map<string, string>();
const MAX_TEMPLATE_CACHE_SIZE = 100;

export interface Logger {
	level: string;
	log: (level: string, message: string) => void;
	info: (message: string) => void;
	warn: (message: string) => void;
	error: (message: string) => void;
	debug: (message: string) => void;
	alert: (message: string) => void;
}

export const logger: Logger = {
	level: 'info',
	log: (level: string, message: string) => {
		console.log(`[${level.toUpperCase()}] ${message}`);
	},
	info: (message: string) => console.info(message),
	warn: (message: string) => console.warn(message),
	error: (message: string) => console.error(message),
	debug: (message: string) => console.debug(message),
	alert: (message: string) => console.warn(`[ALERT] ${message}`),
};

export const setLogLevel = (logLevel: string) => {
	logger.level = logLevel;
};

export const allEnvDlog = (
	key: string,
	message: any,
	...optionalParams: any[]
) => {
	const debugKey = `debug_${key}`;
	let cachedFormat = logTemplateCache.get(debugKey);

	if (!cachedFormat) {
		cachedFormat = `🔧::${key}::\n{{message}}`;
		if (logTemplateCache.size < MAX_TEMPLATE_CACHE_SIZE) {
			logTemplateCache.set(debugKey, cachedFormat);
		}
	}

	const formattedMessage = cachedFormat.replace('{{message}}', String(message));
	console.debug(formattedMessage, ...optionalParams);
};
