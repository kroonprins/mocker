import express from 'express'
import path from 'path'
import { Server } from '@kroonprins/mocker-shared-lib/server.service'
import { ApiServer } from './api-server.mjs'
import { AdministrationServer } from '@kroonprins/mocker-shared-lib/administration-server.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config'

/**
 * Server serving the UI statics. Also exposes an endpoint "/config" so that the UI can retrieve some basic configuration like e.g. the location of the API server.
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
    this.app.get('/config', (req, res) => {
      res.status(200)
      res.send({
        apiServerLocation: this._getServerLocation(ApiServer),
        administrationServerLocation: this._getServerLocation(AdministrationServer)
      })
    })
    this.app.get('*', (req, res) => {
      res.sendFile(path.resolve(`${this.staticsLocation}/index.html`))
    })
  }

  _getServerLocation (ServerType) {
    const server = config.getInstance(ServerType)
    return server.location()
  }
}

export {
  UiServer
}
