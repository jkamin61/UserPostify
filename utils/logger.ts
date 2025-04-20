import process from 'process';
import winston from 'winston';
import path from 'path';

interface customLevels {
    levels: {
        error: number;
        warn: number;
        info: number;
        debug: number;
    };
    colors: {
        error: string;
        warn: string;
        info: string;
        debug: string;
    };
}

const customLevels: customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
    },
};

winston.addColors(customLevels.colors);

const logger = winston.createLogger({
    levels: customLevels.levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
        }),
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log'),
        }),
    ],
});

logger.exceptions.handle(
    new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
    })
);

process.on('unhandledRejection', (reason, promise): void => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default logger;
