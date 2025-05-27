import {
	createLogger,
	transports,
	format,
	Logger as WinstonLogger,
} from 'winston';
import SlackWebhookTransport from 'winston-slack-webhook-transport';
import TransportStream from 'winston-transport';

const bypassAlert = process.env.RUNNING_LOCAL === 'true';

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
					text: `[${timestamp}] ${level.toUpperCase()}: ${message}`,
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
			return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
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
	console.debug(`🔧::${key}::\n${message}`, ...optionalParams);
};
