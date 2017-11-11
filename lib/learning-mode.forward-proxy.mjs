import { Logger } from './logging'
import { config } from './config'

class LearningModeForwardProxyServer {
  constructor (port = config.getProperty('learning-mode.forward-proxy.port'), bindAddress = config.getProperty('learning-mode.forward-proxy.bind-address'), targetHost = config.getProperty('learning-mode.forward-proxy.target-host'), project = config.getProperty('project')) {
    this.port = port
    this.bindAddress = bindAddress
    this.targetHost = targetHost
    this.project = project
    this.logger = config.getClassInstance(Logger, { id: 'learning-mode.forward-proxy' })
  }

  start () {
    this.logger.debug("Starting learning mode reverse proxy server on port %s binding to %s for target host '%s'", this.port, this.bindAddress, this.targetHost)
    throw new Error('Unimplemented')
  }
  stop () {
    this.logger.debug('Request to stop the learning mode reverse proxy server')
    throw new Error('Unimplemented')
  }
}

export {
  LearningModeForwardProxyServer
}
