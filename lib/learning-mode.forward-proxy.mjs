import { Server } from './server.service'
import { config } from './config'

/**
 * Forward proxy to capture requests for learning mode.
 *
 * @extends {Server}
 */
class LearningModeForwardProxyServer extends Server {
  /**
   * Creates an instance of LearningModeForwardProxyServer.
   *
   * @param {number} [port=config.getProperty('learning-mode.forward-proxy.port')] The port on which the server should run.
   * @param {string} [bindAddress=config.getProperty('learning-mode.forward-proxy.bind-address')] The address to which the server should bind.
   * @memberof LearningModeForwardProxyServer
   */
  constructor (port = config.getProperty('learning-mode.forward-proxy.port'), bindAddress = config.getProperty('learning-mode.forward-proxy.bind-address'), project = config.getProperty('project')) {
    super(port, bindAddress, 'learning-mode.forward-proxy')
    this.project = project
  }

  async _setup () {
    throw new Error('Unimplemented')
  }
}

export {
  LearningModeForwardProxyServer
}
