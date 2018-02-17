import { TechnicalValidationError } from './error-types'
import { LearningModeServerTypes } from './server.service'
import { TemplatingService } from './templating-service'
import { Logger } from './logging'
import { config } from './config'

/**
 * Service for retrieve various configuration items.
 */
class ConfigService {
  constructor (templatingService = config.getInstance(TemplatingService)) {
    this.templatingService = templatingService
    this.logger = config.getClassInstance(Logger, { id: 'config.service' })
    this.MAPPING_SYNC = {
      'learning-mode-server-types': () => {
        return Object.values(LearningModeServerTypes)
      },
      'templating-types': () => {
        return this.templatingService.listEngines()
      },
      'http-methods': () => {
        return [
          'GET',
          'HEAD',
          'POST',
          'PUT',
          'DELETE',
          'CONNECT',
          'OPTIONS',
          'TRACE',
          'PATCH'
        ]
      },
      'log-levels': () => {
        return Logger.getSupportedLogLevels()
      },
      'latency-types': () => {
        return [ 'fixed', 'random' ]
      },
      'config-items': () => {
        return [ ...new Set(Object.keys(this.MAPPING_SYNC), Object.keys(this.MAPPING_ASYNC)) ]
      }
    }
    this.MAPPING_ASYNC = {
      ...this.MAPPING_SYNC // sync can be used in async
    }
  }

  /**
   * Retrieve a configuration item.
   *
   * @param {string} item Identifier for the item.
   * @returns the value of the item.
   * @memberof ConfigService
   */
  async get (item) {
    if (!(item in this.MAPPING_ASYNC)) {
      throw new TechnicalValidationError('Unknown config item', 'unknown config item', {
        item: item
      })
    }
    return this.MAPPING_ASYNC[item]()
  }

  /**
   * Retrieve a configuration item.
   *
   * @param {string} item Identifier for the item.
   * @returns the value of the item.
   * @memberof ConfigService
   */
  getSync (item) {
    if (!(item in this.MAPPING_SYNC)) {
      throw new TechnicalValidationError('Unknown config item', 'unknown config item', {
        item: item
      })
    }
    return this.MAPPING_SYNC[item]()
  }
}

export {
  ConfigService
}
