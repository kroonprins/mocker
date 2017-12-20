import express from 'express'
import Enum from 'es6-enum'
import { config } from './config'
import { Logger } from './logging'

/**
 * Enum of server statuses
 */
const ServerStatus = Enum(
  'CONSTRUCTED',
  'STARTING',
  'STARTED',
  'STOPPING',
  'STOPPED'
)

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
  start () {
    this.logger.debug('Starting %s on port %s binding on %s', this.loggerId, this.port, this.bindAddress)
    this.status = ServerStatus.STARTING
    this.app.disable('x-powered-by')

    this._setup()

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.bindAddress, () => {
        this.logger.info('%s started on port %d and binding to %s', this.loggerId, this.port, this.bindAddress)
        this.status = ServerStatus.STARTED
        resolve()
      })
    })
  }

  _setup () {
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
  constructor (serverStore = config.getInstance(ServerStore)) {
    this.serverStore = serverStore
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
    // TODO validate input
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
}

export {
  Server,
  ServerStatus,
  ServerService,
  ServerStore,
  InMemoryServerStore
}
