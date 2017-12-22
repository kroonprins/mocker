import express from 'express'
import path from 'path'
import { Server } from './server.service'
import { config } from './config'

/**
 * Server serving the UI statics
 */
class UiServer extends Server {
  /**
   * Creates an instance of UiServer.
   * @param {string} [port=config.getProperty('ui-server.port')] The port on which the server should run.
   * @param {string} [bindAddress=config.getProperty('ui-server.bind-address')] The address to which the server should bind.
   * @param {string} [staticsLocation=config.getProperty('ui-server.statics-location')] Directory containing the statics to serve by the server.
   * @memberof UiServer
   */
  constructor (port = config.getProperty('ui-server.port'), bindAddress = config.getProperty('ui-server.bind-address'), staticsLocation = config.getProperty('ui-server.statics-location')) {
    super(port, bindAddress, 'ui-server')
    this.staticsLocation = staticsLocation
  }

  async _setup () {
    this.app.use(express.static(this.staticsLocation))
    this.app.get('*', (req, res) => {
      res.sendFile(path.resolve(`${this.staticsLocation}/index.html`))
    })
  }
}

export {
  UiServer
}
