import pino from 'pino'
import { config } from './config'

class Logger {}

const PINO_BASE_LOGGER = pino()
const ALL_LOGGERS = [ PINO_BASE_LOGGER ]

class PinoLogger extends Logger {
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
    this.logger.level = (opts && opts['level']) ? opts['level'] : config.getProperty('logging.level.startup')
  }
  fatal (...args) {
    this.logger.fatal(...args)
  }
  error (...args) {
    this.logger.error(...args)
  }
  warn (...args) {
    this.logger.warn(...args)
  }
  info (...args) {
    this.logger.info(...args)
  }
  debug (...args) {
    this.logger.debug(...args)
  }
  trace (...args) {
    this.logger.trace(...args)
  }
  setLevel (level, global = false) {
    if (global) {
      for (let logger of ALL_LOGGERS) {
        logger.level = level
      }
    } else {
      this.logger.level = level
    }
  }
  getLevel () {
    return this.logger.level
  }
}

export {
  Logger, PinoLogger
}
