import express from 'express'
import path from 'path'
import { Server } from './server.service'
import { Logger } from './logging'
import { config } from './config'

/**
 * Server serving the UI statics
 */
class UiServer extends Server {
  /**
   * Creates an instance of UiServer.
   *
   * @param {string} [port=config.getProperty('ui-server.port')] The port on which the server should run.
   * @param {string} [bindAddress=config.getProperty('ui-server.bind-address')] The address to which the server should bind.
   * @memberof ApiServer
   */
  constructor (port = config.getProperty('ui-server.port'), bindAddress = config.getProperty('ui-server.bind-address'), staticsLocation = config.getProperty('ui-server.statics-location')) {
    super()
    this.port = port
    this.bindAddress = bindAddress
    this.staticsLocation = staticsLocation
    this.logger = config.getClassInstance(Logger, { id: 'ui-server' })
    this.server = null
  }

  /**
   * Start the server.
   *
   * @returns A promise that will resolve when the server is ready to receive requests.
   * @memberof ApiServer
   */
  start () {
    this.logger.debug('Starting UI server on port %s binding on %s serving statics in %s', this.port, this.bindAddress, this.staticsLocation)

    const app = express()
    app.use(express.static(this.staticsLocation))
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(`${this.staticsLocation}/index.html`))
    })

    return new Promise((resolve, reject) => {
      this.server = app.listen(this.port, this.bindAddress, () => {
        this.logger.info('UI server started on port %d and binding to %s serving statics in %s', this.port, this.bindAddress, this.staticsLocation)
        resolve()
      })
    })
  }

  /**
   * Stop the server.
   *
   * @returns A promise that will resolve when the server has completely shut down.
   * @memberof UiServer
   */
  stop () {
    this.logger.debug('Request to stop the UI server')
    if (this.server != null) {
      this.logger.info('Stopping the UI server')
      return new Promise((resolve, reject) => {
        this.server.close(() => {
          this.logger.info('Stopped the UI server')
          resolve()
        })
      })
    }
  }
}

export {
  UiServer
}
