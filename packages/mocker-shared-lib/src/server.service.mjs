import express from 'express'
import 'express-async-errors'
import portastic from 'portastic'
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
  RESTARTING: 'restarting',
  ERROR: 'error'
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
    this.port = await this._useRandomPortIfNoPortGiven()
    this.logger.debug('Starting %s on port %s binding on %s', this.loggerId, this.port, this.bindAddress)
    this.status = ServerStatus.STARTING
    this.app.disable('x-powered-by')

    try {
      await this._setup()
    } catch (e) {
      this.status = ServerStatus.ERROR
      throw e
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.bindAddress, () => {
        this.logger.info('%s started on port %d and binding to %s', this.loggerId, this.port, this.bindAddress)
        this.status = ServerStatus.STARTED
        resolve()
      }).on('error', error => {
        this.status = ServerStatus.ERROR
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
    if (this.status === ServerStatus.STARTED || this.status === ServerStatus.STARTING || this.status === ServerStatus.RESTARTING) {
      this.logger.info('Stopping %s', this.loggerId)
      this.status = ServerStatus.STOPPING
      return new Promise((resolve, reject) => {
        this.server.close(() => {
          this.logger.info('Stopped %s', this.loggerId)
          this.status = ServerStatus.STOPPED
          resolve()
        })
      })
    } else {
      this.logger.warn('Trying to stop a server that is not in the right status: %s', this.status)
    }
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

  async _useRandomPortIfNoPortGiven () {
    if (this.port === 0) {
      // randomize minimum port to avoid that the same port is chosen when 2 servers request a port around the
      // same time and there is some time before they actually start using the port
      const minimumPort = Math.floor((Math.random() * 50000) + 8000)
      this.port = (await portastic.find({
        min: minimumPort,
        max: minimumPort + 10,
        retrieve: 1
      }))[0]
    }
    return this.port
  }
}

export {
  Server,
  ServerStatus,
  LearningModeServerTypes
}
