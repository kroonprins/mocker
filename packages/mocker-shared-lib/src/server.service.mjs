import express from 'express'
import 'express-async-errors'
import { FunctionalValidationError } from './error-types'
import { config } from './config'
import { Logger } from './logging'

/**
 * Enum of server statuses
 */
const ServerStatus = Object.freeze({
  CONSTRUCTED: 'constructed',
  STARTING: 'starting',
  STARTED: 'started',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  RESTARTING: 'restarting'
})

/**
 * Types of Learning mode servers
 */
const LearningModeServerTypes = Object.freeze({
  REVERSE_PROXY: 'reverse-proxy',
  FORWARD_PROXY: 'forward-proxy'
})

/**
 * Base class for all the different servers.
 */
class Server {
  /**
   * Creates an instance of Server. This is an abstract class so not to be instanciated directly.
   *
   * @param {number} port Port on which the server should listen.
   * @param {any} bindAddress Address to which the server should bind.
   * @param {string} loggerId Id to use for the logger.
   * @param {any} bindAddress Address to which the server should bind.
   * @memberof Server
   */
  constructor (port, bindAddress, loggerId) {
    if (new.target === Server) {
      throw new TypeError('Instance of type Server can\'t be create directly')
    }
    this.port = port
    this.bindAddress = bindAddress
    this.loggerId = loggerId
    this.logger = config.getClassInstance(Logger, { id: loggerId })
    this.status = ServerStatus.CONSTRUCTED
    this.app = express()
    this.server = null
  }

  /**
   * Start the server.
   *
   * @returns A promise that resolves when the server has started and ready to accept requests.
   * @memberof Server
   */
  async start () {
    this.logger.debug('Starting %s on port %s binding on %s', this.loggerId, this.port, this.bindAddress)
    this.status = ServerStatus.STARTING
    this.app.disable('x-powered-by')

    await this._setup()

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.bindAddress, () => {
        this.logger.info('%s started on port %d and binding to %s', this.loggerId, this.port, this.bindAddress)
        this.status = ServerStatus.STARTED
        resolve()
      }).on('error', error => {
        this.logger.error(error, 'Failed to start %s', this.loggerId)
        reject(new FunctionalValidationError(
          `Failed to start server ${this.loggerId}`,
          'server start failed',
          {
            port: this.port,
            bindAddress: this.bindAddress,
            errorCode: error.code
          }
        ))
      })
    })
  }

  async _setup () {
    throw new Error('To implement in implementation class')
  }

  /**
   * Stop the server.
   *
   * @returns A promise that resolves when the server has stopped.
   * @memberof Server
   */
  stop () {
    this.logger.info('Stopping %s', this.loggerId)
    this.status = ServerStatus.STOPPING
    return new Promise((resolve, reject) => {
      this.server.close(() => {
        this.logger.info('Stopped %s', this.loggerId)
        this.status = ServerStatus.STOPPED
        resolve()
      })
    })
  }

  /**
   * Restart the server.
   *
   * @returns A promise that resolves when the server has started and ready to accept requests.
   * @memberof Server
   */
  async restart () {
    this.status = ServerStatus.RESTARTING
    await this.stop()
    this.app = express()
    return this.start()
  }

  /**
   * Get the status of the server.
   *
   * @returns {ServerStatus} The status of the server.
   * @memberof Server
   */
  status () {
    return this.status
  }

  /**
   * The location where the server can be found (protocol://domain:port)
   *
   * @returns the location
   * @memberof Server
   */
  location () {
    // TODO: necessary to make it work inside docker container
    const bindAddress = this.bindAddress.replace('0.0.0.0', 'localhost')
    return `http://${bindAddress}:${this.port}`
  }
}

export {
  Server,
  ServerStatus,
  LearningModeServerTypes
}
