import { config } from './config'

/**
 * Base class for all the different servers.
 */
class Server { // TODO move more of the repeated logic in this base class
  /**
   * Start the server.
   *
   * @returns A promise that resolves when the server has started and ready to accept requests.
   * @memberof Server
   */
  start () {
    throw Error('To implement in implementation class')
  }

  /**
   * Stop the server.
   *
   * @returns A promise that resolves when the server has stopped.
   * @memberof Server
   */
  stop () {
    throw Error('To implement in implementation class')
  }

  // TODO something to get the status
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
   * Start a new server and store it with the given id.
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
    const newServer = new ServerType(port, bindAddress, ...args)
    const serverId = await this.serverStore.storeServer(id, newServer)
    await newServer.start()
    return serverId
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
    const server = await this.serverStore.getStoredServer(serverId)
    await server.stop()
    await this.serverStore.removeStoredServer(serverId)
  }
}

export {
  Server,
  ServerService,
  ServerStore,
  InMemoryServerStore
}
