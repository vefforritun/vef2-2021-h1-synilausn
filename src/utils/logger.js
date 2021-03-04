import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const { LOG_LEVEL: logLevel } = process.env;

const dev = process.env.NODE_ENV === 'development';

const { createLogger, format, transports } = winston;

export const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.File({ filename: 'app.log' }),
    new transports.File({ filename: 'debug.log', level: 'debug' }),
    new transports.Console({
      format: format.combine(
        format.prettyPrint({ depth: 2, colorize: false }),
        format.colorize({ all: true }),
      ),
      level: logLevel || (dev ? 'debug' : 'warning'),
    }),
  ],
});
