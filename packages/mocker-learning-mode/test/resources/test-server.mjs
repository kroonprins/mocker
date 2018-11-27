import express from 'express'
import cookieParser from 'cookie-parser'
import 'express-async-errors'

import { PinoLogger } from '@kroonprins/mocker-shared-lib/logging'

class TestServer {
  constructor (port) {
    this.port = port
    this.server = null
    this.logger = new PinoLogger({ level: 'debug' })
  }

  start () {
    this.logger.debug('Starting test server on port %s', this.port)

    const app = express()
    app.use(cookieParser())

    app.get('/test1', async (req, res) => {
      res.cookie('koek', 'njamnjam', { httpOnly: true, secure: true })
      res.header('x-test', 'a')
      res.send('test1')
    })

    app.post('/test2', async (req, res) => {
      res.send('test2')
    })

    return new Promise((resolve, reject) => {
      this.server = app.listen(this.port, () => {
        this.logger.info('Test server started on port %d', this.port)
        resolve()
      })
    })
  }
  stop () {
    this.logger.debug('Request to stop the test server')
    if (this.server != null) {
      this.logger.info('Stopping the test server')
      return new Promise((resolve, reject) => {
        this.server.close(() => {
          this.logger.info('Stopped the test server')
          resolve()
        })
      })
    }
  }
}

export {
  TestServer
}
