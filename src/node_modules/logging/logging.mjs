import * as fs from 'fs/promises';
import { createLogger, format, transports } from 'winston';

await fs.mkdir('logs', { recursive: true });

export const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss',
		}),
		format.errors({ stack: true }),
		format.splat(),
		format.json()
	),
	defaultMeta: { service: 'arxlive-spotlight-annotator' },
	transports: [

		//
		// - Write to all logs with level `info` and below to `quick-start-combined.log`.
		// - Write all logs error (and below) to `quick-start-error.log`.
		//
		new transports.File({
			filename: 'logs/error.log',
			level: 'error',
		}),
		new transports.File({ filename: 'logs/all.log' }),
	],
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
// eslint-disable-next-line no-process-env
if (process.env.NODE_ENV !== 'production') {
	logger.add(
		new transports.Console({
			format: format.combine(format.colorize(), format.simple()),
		})
	);
}
