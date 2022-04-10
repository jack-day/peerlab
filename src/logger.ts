import express from 'express';
import { ParseError } from 'body-parser';
import config from './config';

export class Logger {
    /** Log Levels with codes */
    static levels: Record<string, number> = {
        error: 0,
        warn: 1,
        info: 2,
        none: 3,
    };

    /** Current Log Level */
    logLevel: string;
    /** Current Log Code */
    logCode: number;

    constructor(logLevel: string) {
        this.logLevel = Logger.levelExists(logLevel) ? logLevel : 'error';
        this.logCode = Logger.levels[logLevel];
    }

    // Helpers
    // --------------------------------------------
    static levelExists(logLevel: string): boolean {
        return Logger.levels.hasOwnProperty(logLevel);
    }


    // Logging
    // --------------------------------------------
    /**
     * Create an Error with a stack trace for a message
     * @param msg Message to be logged
     * @param depth Depth from original call - Number or levels to be truncated from the beginning of the stack trace
     * @returns Error with stack trace
     */
    trace(msg: string, depth = 1): Error {
        const err = new Error(msg);
        if (err.stack) {
            const split = err.stack.split('\n');
            split.splice(1, depth);
            err.stack = split.join('\n');
        }
        return err;
    }

    /**
     * Format and log a message
     * @param logLevel Log level
     * @param msg Message or Error to be logged
     */
    log(logLevel: string, msg: string | Error): void {
        if (Logger.levelExists(logLevel)) {
            const logCode: number = Logger.levels[logLevel];
            const timestamp = new Date().toLocaleString('en-GB');

            // Only log if above or at current log level
            if (logCode >= this.logCode) {
                if (logCode < 2) {
                    // Add a stack trace if the message is not an Error
                    const err = msg instanceof Error ? msg : this.trace(msg, 2);
                    console.error(`[${timestamp}][${logLevel}]`, err);
                } else {
                    // Only output the message
                    if (msg instanceof Error) msg = msg.message;
                    console.log(`[${timestamp}][${logLevel}] ${msg}`);
                }
            }
        } else {
            this.log('error', `Invalid Log Level: ${logLevel}, defaulting to 'error'`);
            this.log('error', msg);
        }
    }

    error(msg: string | Error): void {
        this.log('error', msg);
    }

    warn(msg: string | Error): void {
        this.log('warn', msg);
    }

    info(msg: string | Error): void {
        this.log('info', msg);
    }


    // Express
    // --------------------------------------------
    /** Error handler to use logger for express errors */
    errorHandler(): (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => void {
        /* eslint-disable-next-line */
        const logger: Logger = this;

        /* eslint-disable-next-line */
        return (err: Error | ParseError, req, res, next): void => {
            logger.error(err);

            if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
                // Error message for recieved JSON that fails parsing
                res.status(400).json({ message: err.message });
            } else {
                res.sendStatus(500);
            }
        };
    }
}

const logger = new Logger(config.logLevel);
export default logger;
