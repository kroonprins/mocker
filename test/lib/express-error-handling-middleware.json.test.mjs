import chai from 'chai'
import chaiExclude from 'chai-exclude'
import portastic from 'portastic'
import axios from 'axios'
import express from 'express'
import 'express-async-errors'
import { PinoLogger } from './../../lib/logging'
import errorHandler from './../../lib/express-error-handling-middleware.json'
import { FunctionalValidationError, TechnicalValidationError, TechnicalError } from './../../lib/error-types.mjs'

const expect = chai.expect
chai.use(chaiExclude)

class ErrorTestServer {
  constructor (port) {
    this.port = port
    this.server = null
    this.logger = new PinoLogger({ level: 'debug' })
  }

  start () {
    this.logger.debug('Starting error test server on port %s', this.port)

    const app = express()

    app.get('/functional-validation-error', async (req, res) => {
      throw new FunctionalValidationError('functional validation error message')
    })
    app.get('/technical-validation-error', async (req, res) => {
      throw new TechnicalValidationError('technical validation error message')
    })
    app.get('/technical-error', async (req, res) => {
      throw new TechnicalError('technical error message')
    })
    app.get('/unexpected-error', async (req, res) => {
      throw new Error('unexpected error message')
    })

    app.use(errorHandler({
      logger: this.logger
    }))

    return new Promise((resolve, reject) => {
      this.server = app.listen(this.port, () => {
        this.logger.info('Error test server started on port %d', this.port)
        resolve()
      })
    })
  }
  stop () {
    this.logger.debug('Request to stop the error test server')
    if (this.server != null) {
      this.logger.info('Stopping the error test server')
      return new Promise((resolve, reject) => {
        this.server.close(() => {
          this.logger.info('Stopped the error test server')
          resolve()
        })
      })
    }
  }
}

// could split this up so that not all test run synchronously
const test = async () => {
  // TODO maybe put some kind of spy on the ErrorTestServer logger to test that it is called

  const availablePorts = (await portastic.find({
    min: 20000,
    max: 30000,
    retrieve: 1
  }))
  const errorTestServerPort = availablePorts[0]

  const errorTestServer = new ErrorTestServer(errorTestServerPort)

  try {
    await errorTestServer.start()

    // Test functional validation error
    const functionalErrorResponse = await axios.get(`http://localhost:${errorTestServerPort}/functional-validation-error`)
    expect(functionalErrorResponse.status).to.be.equal(200)
    expect(functionalErrorResponse.data).excluding('uuid').to.deep.equal({
      error: true,
      msg: 'functional validation error message'
    })
    expect(functionalErrorResponse.data.uuid.length).is.not.equal(0)

    // Test technical validation error
    let exceptionThrownForTechnicalValidationError = false
    try {
      await axios.get(`http://localhost:${errorTestServerPort}/technical-validation-error`)
    } catch (e) {
      expect(e.response.status).to.be.equal(400)
      expect(e.response.data).excluding('uuid').to.deep.equal({
        msg: 'technical validation error message'
      })
      expect(e.response.data.uuid.length).is.not.equal(0)
      exceptionThrownForTechnicalValidationError = true
    }
    expect(exceptionThrownForTechnicalValidationError).to.be.equal(true)

    // Test technical error
    let exceptionThrownForTechnicalError = false
    try {
      await axios.get(`http://localhost:${errorTestServerPort}/technical-error`)
    } catch (e) {
      expect(e.response.status).to.be.equal(500)
      expect(e.response.data).excluding('uuid').to.deep.equal({
        msg: 'technical error message'
      })
      expect(e.response.data.uuid.length).is.not.equal(0)
      exceptionThrownForTechnicalError = true
    }
    expect(exceptionThrownForTechnicalError).to.be.equal(true)

    // Test technical validation error
    let exceptionThrownForUnexpectedError = false
    try {
      await axios.get(`http://localhost:${errorTestServerPort}/unexpected-error`)
    } catch (e) {
      expect(e.response.status).to.be.equal(500)
      expect(e.response.data).excluding('uuid').to.deep.equal({
        msg: 'An unexpected error occurred'
      })
      expect(e.response.data.uuid.length).is.not.equal(0)
      exceptionThrownForUnexpectedError = true
    }
    expect(exceptionThrownForUnexpectedError).to.be.equal(true)
  } finally {
    errorTestServer.stop()
  }
}

export {
  test
}
