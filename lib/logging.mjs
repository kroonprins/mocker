import pino from 'pino';

import { config } from './config';

const pino_logger = pino();
pino_logger.level = config.startupLogLevel;

// level of abstraction so that other logging library can be swapped in by only updating this file
const logger = {
    fatal: (...args) => pino_logger.fatal(...args),
    error: (...args) => pino_logger.error(...args),
    warn: (...args) => pino_logger.warn(...args),
    info: (...args) => pino_logger.info(...args),
    debug: (...args) => pino_logger.debug(...args),
    trace: (...args) => pino_logger.trace(...args),
    setLevel: (level) => pino_logger.level = level,
    getLevel: () => pino_logger.level,
}

export {
    logger
}