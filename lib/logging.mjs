import pino from 'pino'

import { config } from './config'

const pinoLogger = pino()
pinoLogger.level = config.startupLogLevel

// level of abstraction so that other logging library can be swapped in by only updating this file
const logger = {
  fatal: (...args) => pinoLogger.fatal(...args),
  error: (...args) => pinoLogger.error(...args),
  warn: (...args) => pinoLogger.warn(...args),
  info: (...args) => pinoLogger.info(...args),
  debug: (...args) => pinoLogger.debug(...args),
  trace: (...args) => pinoLogger.trace(...args),
  setLevel: (level) => {
    pinoLogger.level = level
  },
  getLevel: () => pinoLogger.level
}

export {
  logger
}
