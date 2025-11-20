import {
	createLogger,
	transports,
	format,
	Logger as WinstonLogger,
} from 'winston';
import SlackWebhookTransport from 'winston-slack-webhook-transport';
import TransportStream from 'winston-transport';

const bypassAlert = process.env.RUNNING_LOCAL === 'true';

// Cache for log message templates to reduce string concatenation overhead
const logTemplateCache = new Map<string, string>();
const MAX_TEMPLATE_CACHE_SIZE = 100;

// Optimized log formatter that caches common template patterns
function formatLogMessage(
	timestamp: string,
	level: string,
	message: string
): string {
	const upperLevel = level.toUpperCase();
	const templateKey = `${upperLevel}_template`;

	if (logTemplateCache.has(templateKey)) {
		const template = logTemplateCache.get(templateKey)!;
		return template
			.replace('{{timestamp}}', timestamp)
			.replace('{{message}}', message);
	}

	const template = '[{{timestamp}}] ' + upperLevel + ': {{message}}';

	if (logTemplateCache.size < MAX_TEMPLATE_CACHE_SIZE) {
		logTemplateCache.set(templateKey, template);
	}

	return template
		.replace('{{timestamp}}', timestamp)
		.replace('{{message}}', message);
}

const loggerTransports: TransportStream[] = [
	new transports.Console({
		level: 'info',
	}),
];

if (!bypassAlert) {
	loggerTransports.push(
		new SlackWebhookTransport({
			webhookUrl: process.env.WEBHOOK_URL,
			level: 'alert',
			formatter: ({ timestamp, level, message }) => {
				return {
					text: formatLogMessage(timestamp, level, message),
				};
			},
		})
	);
}

export const logger = createLogger({
	levels: {
		emerg: 0,
		alert: 1,
		crit: 2,
		error: 3,
		warning: 4,
		notice: 5,
		info: 6,
		debug: 7,
	},
	level: 'info',
	transports: loggerTransports,
	format: format.combine(
		format.timestamp(),
		format.printf(({ timestamp, level, message }) => {
			return formatLogMessage(
				String(timestamp),
				String(level),
				String(message)
			);
		})
	),
});

export const setLogLevel = (logLevel: string) => {
	logger.level = logLevel;
};

//@ts-ignore
logger.alert = (message: string) => logger.log('alert', message);

export type Logger = WinstonLogger;

export const allEnvDlog = (
	key: string,
	message: any,
	...optionalParams: any[]
) => {
	// Cache debug message format to reduce string concatenation
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
