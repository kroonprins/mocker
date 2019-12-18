import pino from 'pino'
import { config } from './config.mjs'
import { FunctionalValidationError } from './error-types.mjs'

const SUPPORTED_LEVELS = [ 'error', 'warn', 'info', 'debug', 'trace' ]
const SUPPORTED_LEVELS_SET = new Set(SUPPORTED_LEVELS)

const BASE_LOGGER_ID = '#base#'
let CREATED_LOGGERS = {}

/**
 * Base type for loggers.
 *
 * @class Logger
 */
class Logger {
  /**
   * Creates an instance of a Logger.
   *
   * @param {any} opts Options to use for the logger:<br><ul><li>'id' creates a child logger that will include the given id in every log line</li><li>'level' sets the level of the logger. If not given then the default logging defined by property 'logging.level.startup' is used</li></ul>
   * @memberof Logger
   * @throws {FunctionalValidationError} if opts contains a 'level' field that is not a valid level.
   */
  constructor (opts) {
    if (new.target === Logger) {
      throw new TypeError('Instance of type Logger can\'t be create directly. This is an abstract base class.')
    }

    this.id = this._createLoggerId(opts)
    this._logger = this._createLogger(opts)
    this._level = this._createLevel(opts)

    CREATED_LOGGERS[this.id] = this
  }

  _createLoggerId (opts) {
    if (opts && opts['id']) {
      return opts['id']
    } else {
      return BASE_LOGGER_ID
    }
  }

  _createLogger (opts) {
    throw new Error('To implement in implementation class')
  }

  _createLevel (opts) {
    let level
    if (opts && opts['level']) {
      level = opts['level']
    } else {
      level = config.getProperty('logging.level.startup')
    }
    Logger._checkValidLevel(level)
    return level
  }

  /**
   * Write fatal logging.
   *
   * @param {any} args
   * @memberof Logger
   */
  fatal (...args) {
    this._logger.fatal(...args)
  }

  /**
   * Write error logging.
   *
   * @param {any} args
   * @memberof Logger
   */
  error (...args) {
    this._logger.error(...args)
  }

  /**
   * Write warning logging.
   *
   * @param {any} args
   * @memberof Logger
   */
  warn (...args) {
    this._logger.warn(...args)
  }

  /**
   * Write info logging.
   *
   * @param {any} args
   * @memberof Logger
   */
  info (...args) {
    this._logger.info(...args)
  }

  /**
   * Write debug logging.
   *
   * @param {any} args
   * @memberof Logger
   */
  debug (...args) {
    this._logger.debug(...args)
  }

  /**
   * Write trace logging.
   *
   * @param {any} args
   * @memberof Logger
   */
  trace (...args) {
    this._logger.trace(...args)
  }

  /**
   * Retrieve the current level of the logger.
   *
   * @returns  the current level of the logger.
   * @memberof Logger
   */
  getLevel () {
    return CREATED_LOGGERS[this.id]._level
  }

  /**
   * Update the level of this logger.
   *
   * @param {string} level New level to set. One of 'error', 'warn', 'info', 'debug', or 'trace'.
   * @memberof Logger
   * @throws {FunctionalValidationError} if the given level is not valid.
   */
  setLevel (level) {
    Logger._checkValidLevel(level)
    CREATED_LOGGERS[this.id]._level = level
  }

  // Check the validity of level.
  static _checkValidLevel (level) {
    if (!SUPPORTED_LEVELS_SET.has(level)) {
      throw new FunctionalValidationError(
        `The given level ${level} is not valid. It should be one of [${SUPPORTED_LEVELS}]`,
        'invalid log level',
        {
          level: level,
          supportedLevels: SUPPORTED_LEVELS
        }
      )
    }
  }

  /**
   * Return a list of the supported log levels
   *
   * @static
   * @returns list of known log levels as strings
   * @memberof Logger
   */
  static getSupportedLogLevels () {
    return SUPPORTED_LEVELS
  }

  /**
   * Get the logger for given id. If no id is provided then the base logger is returned (if it exists).
   *
   * @static
   * @param {any} [id=BASE_LOGGER_ID]
   * @returns The found logger.
   * @throws {FunctionalValidationError} if no logger is found.
   * @memberof Logger
   */
  static getLogger (id = BASE_LOGGER_ID) {
    if (!(id in CREATED_LOGGERS)) {
      throw new FunctionalValidationError(
        `The requested logger with id ${id} does not exist.`,
        'invalid log id',
        {
          id: id,
          knownIds: Object.keys(CREATED_LOGGERS)
        }
      )
    }
    return CREATED_LOGGERS[id]
  }

  /**
   * Returns a summary of all created loggers and their current level.
   *
   * @static
   * @returns summary.
   * @example
   * { parent: { level: <base logger level> }, children: [{ id: <child id>, level: <child level> }, {}, ... ]}
   * @memberof Logger
   */
  static getCreatedLoggers () {
    const result = {
      parent: {},
      children: []
    }
    for (let logger of Object.values(CREATED_LOGGERS)) {
      if (logger.id === BASE_LOGGER_ID) {
        result.parent = {
          level: logger._level
        }
      } else {
        result.children.push({
          id: logger.id,
          level: logger._level
        })
      }
    }
    return result
  }

  /**
   * Update log level for logger with given id (or the base logger if no id is given)
   *
   * @static
   * @param {any} level Level to update to.
   * @param {any} [id=BASE_LOGGER_ID] id of the logger to update.
   * @throws {FunctionalValidationError} if no logger is found for the id or if the given level is not valid.
   * @memberof Logger
   */
  static updateLogLevel (level, id = BASE_LOGGER_ID) {
    Logger.getLogger(id).setLevel(level)
  }

  /**
   * Update log levels of all loggers to given level.
   *
   * @static
   * @param {any} level Level to update to.
   * @throws {FunctionalValidationError} if the given level is not valid.
   * @memberof Logger
   */
  static updateGlobalLogLevel (level) {
    Logger._checkValidLevel(level)
    for (let logger of Object.values(CREATED_LOGGERS)) {
      logger.setLevel(level)
    }
  }

  /**
   * Determine the current global log level. If the base logger exists it is the level of this logger.
   * Otherwise it is the level of the first found child logger.
   * If no loggers have been created yet then the default startup log level.
   *
   * @static
   * @returns The calculated global log level.
   * @memberof Logger
   */
  static getGlobalLogLevel () {
    if (BASE_LOGGER_ID in CREATED_LOGGERS) {
      return CREATED_LOGGERS[BASE_LOGGER_ID]._level
    }
    if (Object.keys(CREATED_LOGGERS).length > 0) {
      return CREATED_LOGGERS[Object.keys(CREATED_LOGGERS)[0]]._level
    }
    return config.getProperty('logging.level.startup')
  }

  /**
   * Remove all created loggers.
   *
   * @static
   * @memberof Logger
   */
  static reset () {
    // no really removing the loggers, just let them be gc'd if no reference exist anymore.
    CREATED_LOGGERS = {}
  }
}

const PINO_BASE_LOGGER = pino()

/**
 * A logger using {@link https://github.com/pinojs/pino|pino}.
 *
 * @extends {Logger}
 */
class PinoLogger extends Logger {
  constructor (opts) {
    super(opts)
    this._logger.level = this._level
  }

  _createLogger (opts) {
    if (this.id) {
      return PINO_BASE_LOGGER.child({
        id: this.id
      })
    } else {
      return PINO_BASE_LOGGER
    }
  }

  setLevel (level) {
    super.setLevel(level)
    this._logger.level = level
  }
}

export {
  Logger, PinoLogger
}
