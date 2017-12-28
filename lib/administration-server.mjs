import express from 'express'
// import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser'
import { Server } from './server.service'
import { config } from './config'
import errorHandler from './express-error-handling-middleware.json'

/**
 * Server exposing service endpoints to execute administrative tasks.
 */
class AdministrationServer extends Server {
  /**
   * Creates an instance of AdministrationServer.
   *
   * @param {string} [port=config.getProperty('administration-server.port')] The port on which the server should run.
   * @param {string} [bindAddress=config.getProperty('administration-server.bind-address')] The address to which the server should bind.
   * @memberof AdministrationServer
   */
  constructor (port = config.getProperty('administration-server.port'), bindAddress = config.getProperty('administration-server.bind-address')) {
    super(port, bindAddress, 'administration-server')
  }

  async _setup () {
    const router = express.Router()
    // this.app.use(cookieParser());
    this.app.use(bodyParser.json())

    router.put('/loglevel', async (req, res) => {
      const newLevel = req.body.level
      const currentLevel = this.logger.getLevel()
      this.logger.warn({
        newLevel: newLevel,
        currentLevel: currentLevel
      }, 'Updating log level')
      this.logger.setLevel(newLevel, true)

      const maxAge = req.body.maxAge
      if (maxAge) {
        this.logger.warn('Log level will be reverted after %d ms', maxAge)
        setTimeout(() => {
          this.logger.warn({
            newLevel: newLevel,
            currentLevel: currentLevel
          }, 'Reverting log level')
          this.logger.setLevel(currentLevel, true)
        }, maxAge)
      }
      res.status(200)
      res.send()
    })

    this.app.use('/administration', router)

    this.app.use(errorHandler({
      logger: this.logger
    }))
  }
}

export {
  AdministrationServer
}
