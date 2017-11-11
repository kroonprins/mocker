import express from 'express'
// import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser'
import 'express-async-errors'
import { Logger } from './logging'
import { config } from './config'
import errorHandler from './express-error-handling-middleware.json'

class AdministrationServer {
  constructor (port = config.getProperty('administration-server.port'), bindAddress = config.getProperty('administration-server.bind-address')) {
    this.port = port
    this.bindAddress = bindAddress
    this.logger = config.getClassInstance(Logger, { id: 'administration-server' })
    this.server = null
  }

  start () {
    this.logger.debug('Starting administration server on port %s binding on %s', this.port, this.bindAddress)

    const app = express()
    const router = express.Router()
    // app.use(cookieParser());
    app.use(bodyParser.json())
    app.disable('x-powered-by')

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

    app.use('/administration', router)

    app.use(errorHandler({
      logger: this.logger
    }))

    return new Promise((resolve, reject) => {
      this.server = app.listen(this.port, this.bindAddress, () => {
        this.logger.info('Administration server started on port %d and binding to %s', this.port, this.bindAddress)
        resolve()
      })
    })
  }
  stop () {
    this.logger.debug('Request to stop the administration server')
    if (this.server != null) {
      this.logger.info('Stopping the administration server')
      return new Promise((resolve, reject) => {
        this.server.close(() => {
          this.logger.info('Stopped the administration server')
          resolve()
        })
      })
    }
  }
}

export {
  AdministrationServer
}
