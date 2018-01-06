import express from 'express'
import 'express-async-errors'
import { FunctionalValidationError } from './error-types'
import { serialize } from './mjs_workaround/serializr-es6-module-loader'
import { ClassValidationService } from './class-validation.service'
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
  STOPPED: 'stopped'
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
   * Get the status of the server.
   *
   * @returns {ServerStatus} The status of the server.
   * @memberof Server
   */
  status () {
    return this.status
  }
}

/**
 * Store for keeping track of created servers.
 */
class ServerStore {
  /**
   * Add a server to the store.
   *
   * @param {string} id unique id. Generated if not given.
   * @param {Server} server the server to store.
   * @returns {string} unique id for the server.
   * @memberof ServerStore
   */
  async storeServer (id, server) {
    throw Error('To implement in implementation class')
  }

  /**
   * Remove a server from the store.
   *
   * @param {string} serverId the unique id of the server.
   * @memberof ServerStore
   */
  async removeStoredServer (serverId) {
    throw Error('To implement in implementation class')
  }

  /**
   * Retrieve a server from the store.
   *
   * @param {string} serverId the unique id of the server.
   * @returns {Server} the retrieved server.
   * @memberof ServerStore
   */
  async getStoredServer (serverId) {
    throw Error('To implement in implementation class')
  }
}

/**
 * {@link ServerStore} implementation that stores the created servers in memory.
 *
 * @extends {ServerStore}
 */
class InMemoryServerStore extends ServerStore {
  constructor () {
    super()
    this.serverStore = {}
    this.idCounter = 0
  }

  async storeServer (id, server) {
    const serverId = id || this.idCounter++
    this.serverStore[serverId] = server
    return serverId
  }
  async removeStoredServer (serverId) {
    delete this.serverStore[serverId]
  }
  async getStoredServer (serverId) {
    return this.serverStore[serverId]
  }
}

/**
 * Service for starting and stopping servers and keeping track of them.
 */
class ServerService {
  /**
   * Creates an instance of ServerService.
   * @param {any} [serverStore=config.getInstance(ServerStore)] A {@link ServerStore} to keep track of the servers
   * @memberof ServerService
   */
  constructor (serverStore = config.getInstance(ServerStore), classValidator = config.getInstance(ClassValidationService)) {
    this.serverStore = serverStore
    this.classValidator = classValidator
  }

  /**
   * Start a new server and store it with the given id. If a server is already started for the given id then it will be stopped and started anew with the given arguments.
   *
   * @param {string} id The unique id for the server. Generated if not specified.
   * @param {Server} ServerType Class type of the server to create and start.
   * @param {number} port Port on which to run the server
   * @param {string} bindAddress  Bind address for the server
   * @param {any} args Extra constructor arguments needed by the constructor of the given ServerType
   * @returns the id of the server.
   * @memberof ServerService
   */
  async startNewServer (id, ServerType, port, bindAddress, ...args) {
    await this.stopServer(id)
    const newServer = new ServerType(port, bindAddress, ...args)
    await newServer.start()
    return this.serverStore.storeServer(id, newServer)
  }

  /**
   * Retrieve a started server by its id.
   *
   * @param {any} serverId the id of the server.
   * @memberof ServerService
   */
  async retrieveServer (serverId) {
    return this.serverStore.getStoredServer(serverId)
  }

  /**
   * Stop a started server.
   *
   * @param {any} serverId the id of the server.
   * @memberof ServerService
   */
  async stopServer (serverId) {
    if (serverId) {
      const server = await this.serverStore.getStoredServer(serverId)
      if (server) {
        await server.stop()
      }
      await this.serverStore.removeStoredServer(serverId)
    }
  }

  /**
   * Restart a started server.
   *
   * @param {any} serverId the id of the server.
   * @memberof ServerService
   */
  async restartServer (serverId) {
    const server = await this.serverStore.getStoredServer(serverId)
    await server.stop()
    await server.start()
  }

  /**
   * Enrich a list of projects with information about stored servers.
   *
   * @param {string[]} projects Array of project names to enrich.
   * @param {string[]} serverTypes Array of server types to enrich with.
   * @param {function} idCalculation Function taking in the project name and the server type, returning the server id for which the server was stored.
   * @returns Array of projects enriched with server information for the different types.
   * @example <caption>Each element in the returned array is of the form</caption>
   *  {
   *    name: <project name>,
   *    <server type>: { // if no server of the type has been stored for the project then this is an empty object
   *      port: <server port>,
   *      bindAddress: <bind address of the server>,
   *      status: <server status>
   *    }
   *  }
   * @memberof ServerService
   */
  async enrichProjectList (projects, serverTypes, idCalculation) {
    return Promise.all(projects.map(async project => {
      const retrievedServerPromises = []
      for (let serverType of serverTypes) {
        retrievedServerPromises.push(this.retrieveServer(idCalculation(project, serverType.type)))
      }
      const retrievedServers = await Promise.all(retrievedServerPromises)
      const result = {
        name: project
      }
      for (let i = 0; i < serverTypes.length; i++) {
        const retrievedServer = retrievedServers[i]
        let serverInfo
        if (retrievedServer) {
          serverInfo = serialize(serverTypes[i].serializationModel, retrievedServer)
        } else {
          serverInfo = {}
        }
        result[serverTypes[i].type] = serverInfo
      }
      return result
    }))
  }

  /**
   * Validate server object.
   *
   * @param {any} ServerType Type of the server to validate against.
   * @param {any} server Server instance
   * @memberof ServerService
   */
  async validateServer (ServerType, server) {
    return this.classValidator.validate(ServerType, server)
  }
}

export {
  Server,
  ServerStatus,
  ServerService,
  ServerStore,
  InMemoryServerStore,
  LearningModeServerTypes
}
