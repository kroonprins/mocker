import express from 'express'
// import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser'
import cors from 'cors'
import { Server } from './server.service.mjs'
import { config } from './config.mjs'
import { Logger } from './logging.mjs'
import errorHandler from './express-error-handling-middleware.json.mjs'

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
    this.router = express.Router()
    // this.app.use(cookieParser());
    this.app.use(bodyParser.json())
    this.app.use(cors())

    this.router.get('/loglevel', async (req, res) => {
      res.status(200)
      res.send(Logger.getCreatedLoggers())
    })

    this.router.put('/loglevel/:id', async (req, res) => {
      const loggerId = req.params.id
      const newLevel = req.body.level
      const currentLevel = Logger.getLogger(loggerId).getLevel()
      this.logger.warn({
        newLevel: newLevel,
        currentLevel: currentLevel
      }, 'Updating log level for logger with id %s', loggerId)
      Logger.updateLogLevel(newLevel, loggerId)

      const maxAge = req.body.maxAge
      if (maxAge) {
        this.logger.warn('Log level will be reverted after %d ms for logger with id %s', maxAge, loggerId)
        setTimeout(() => {
          this.logger.warn({
            newLevel: newLevel,
            currentLevel: currentLevel
          }, 'Reverting log level for logger with id %s', loggerId)
          Logger.updateLogLevel(currentLevel, loggerId)
        }, maxAge)
      }
      res.status(200)
      res.send()
    })

    this.router.put('/loglevel', async (req, res) => {
      const newLevel = req.body.level
      const currentLevel = Logger.getGlobalLogLevel()
      this.logger.warn({
        newLevel: newLevel,
        currentLevel: currentLevel
      }, 'Updating log level')
      Logger.updateGlobalLogLevel(newLevel)

      const maxAge = req.body.maxAge
      if (maxAge) {
        this.logger.warn('Log level will be reverted after %d ms', maxAge)
        setTimeout(() => {
          this.logger.warn({
            newLevel: newLevel,
            currentLevel: currentLevel
          }, 'Reverting log level')
          Logger.updateGlobalLogLevel(currentLevel)
        }, maxAge)
      }
      res.status(200)
      res.send()
    })

    this.app.use('/administration', this.router)

    this.app.use(errorHandler({
      logger: this.logger
    }))
  }
}

export {
  AdministrationServer
}
