import pino from 'pino'
import { config } from './config'
import { FunctionalValidationError } from './error-types.mjs'

/**
 * Base type for loggers.
 *
 * @class Logger
 */
class Logger {}

const SUPPORTED_LEVELS = new Set([ 'error', 'warn', 'info', 'debug', 'trace' ])
const PINO_BASE_LOGGER = pino()
const ALL_LOGGERS = [ PINO_BASE_LOGGER ]

/**
 * A logger using {@link https://github.com/pinojs/pino|pino}.
 *
 * @extends {Logger}
 */
class PinoLogger extends Logger {
  /**
   * Creates an instance of a PinoLogger.
   *
   * @param {any} opts Options to use for the logger:<br><ul><li>'id' creates a child logger that will include the given id in every log line</li><li>'level' sets the level of the logger. If not given then the default logging defined by property 'logging.level.startup' is used</li></ul>
   * @memberof PinoLogger
   * @throws {FunctionalValidationError} if opts contains a 'level' field that is not a valid level.
   */
  constructor (opts) {
    super()
    if (opts && opts.id) {
      this.logger = PINO_BASE_LOGGER.child({
        id: opts.id
      })
    } else {
      this.logger = pino()
    }
    ALL_LOGGERS.push(this.logger)

    if (opts && opts['level']) {
      const level = opts['level']
      this._checkValidLevel(level)
      this.logger.level = level
    } else {
      this.logger.level = config.getProperty('logging.level.startup')
    }
  }

  /**
   * Write fatal logging.
   *
   * @param {any} args
   * @memberof PinoLogger
   */
  fatal (...args) {
    this.logger.fatal(...args)
  }

  /**
   * Write error logging.
   *
   * @param {any} args
   * @memberof PinoLogger
   */
  error (...args) {
    this.logger.error(...args)
  }

  /**
   * Write warning logging.
   *
   * @param {any} args
   * @memberof PinoLogger
   */
  warn (...args) {
    this.logger.warn(...args)
  }

  /**
   * Write info logging.
   *
   * @param {any} args
   * @memberof PinoLogger
   */
  info (...args) {
    this.logger.info(...args)
  }

  /**
   * Write debug logging.
   *
   * @param {any} args
   * @memberof PinoLogger
   */
  debug (...args) {
    this.logger.debug(...args)
  }

  /**
   * Write trace logging.
   *
   * @param {any} args
   * @memberof PinoLogger
   */
  trace (...args) {
    this.logger.trace(...args)
  }

  /**
   * Update the level of this logger or of all created loggers.
   *
   * @param {string} level New level to set. One of 'error', 'warn', 'info', 'debug', or 'trace'.
   * @param {boolean} [global=false] If false, then only the level of this logger is updated, else the level for all created loggers is updated.
   * @memberof PinoLogger
   * @throws {FunctionalValidationError} if the given level is not valid.
   */
  setLevel (level, global = false) {
    this.logger.debug('Requested to updat logger level to %s. Requested to update the level for all loggers: %s', level, global)
    this._checkValidLevel(level)
    if (global) {
      for (let logger of ALL_LOGGERS) {
        logger.level = level
      }
    } else {
      this.logger.level = level
    }
  }

  /**
   * Retrieve the current level of the logger.
   *
   * @returns  the current level of the logger.
   * @memberof PinoLogger
   */
  getLevel () {
    return this.logger.level
  }

  // Check the validity of level.
  _checkValidLevel (level) {
    if (!SUPPORTED_LEVELS.has(level)) {
      throw new FunctionalValidationError(
        `The given level ${level} is not valid. It should be one of [${[...SUPPORTED_LEVELS]}]`,
        'invalid log level',
        {
          level: level,
          supportedLevels: [...SUPPORTED_LEVELS]
        }
      )
    }
  }
}

export {
  Logger, PinoLogger
}
