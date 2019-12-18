import serializr from 'serializr'
import { ClassValidationService } from '@kroonprins/mocker-shared-lib/class-validation.service.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'

const serialize = serializr.serialize

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
  ServerService,
  ServerStore,
  InMemoryServerStore
}
