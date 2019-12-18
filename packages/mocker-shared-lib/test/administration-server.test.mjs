import chai from 'chai'
import chaiExclude from 'chai-exclude'
import portastic from 'portastic'
import axios from 'axios'
import { Logger, PinoLogger } from '../src/logging.mjs'
import { config } from '../src/config.mjs'
import { AdministrationServer } from '../src/administration-server.mjs'

const expect = chai.expect
chai.use(chaiExclude)

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)

    Logger.reset()

    const testLogger = config.getClassInstance(Logger, { id: 'test-logger' })
    expect(testLogger.getLevel()).to.be.equal('info')

    const availablePort = (await portastic.find({
      min: 50000,
      max: 60000,
      retrieve: 1
    }))[0]

    const administrationServer = new AdministrationServer(availablePort, 'localhost')

    try {
      await administrationServer.start()

      Logger.updateGlobalLogLevel('info')
      const initialLogLevel = Logger.getLogger('test-logger').getLevel()
      expect(initialLogLevel).to.be.equal('info')

      const responseUpdateLoglevel = await axios.put(`http://localhost:${availablePort}/administration/loglevel`, {
        level: 'debug'
      })
      expect(responseUpdateLoglevel.status).to.be.equal(200)
      expect(testLogger.getLevel()).to.equal('debug')
      expect(Logger.getLogger('test-logger').getLevel()).to.equal('debug')

      const retrieveUpdatedLoglevel = await axios.get(`http://localhost:${availablePort}/administration/loglevel`)
      expect(retrieveUpdatedLoglevel.status).to.be.equal(200)
      expect(retrieveUpdatedLoglevel.data).to.deep.equal({
        parent: { },
        children:
          [
            { id: 'test-logger', level: 'debug' },
            { id: 'administration-server', level: 'debug' }
          ]
      })

      Logger.updateGlobalLogLevel(initialLogLevel)

      const responseUpdateLoglevelWithMaxAge = await axios.put(`http://localhost:${availablePort}/administration/loglevel`, {
        level: 'debug',
        maxAge: 1000
      })
      expect(responseUpdateLoglevelWithMaxAge.status).to.be.equal(200)
      expect(testLogger.getLevel()).to.equal('debug')
      expect(Logger.getLogger('test-logger').getLevel()).to.equal('debug')
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(testLogger.getLevel()).to.equal(initialLogLevel)
      expect(Logger.getLogger('test-logger').getLevel()).to.equal(initialLogLevel)

      // Test incorrect level
      const responseUpdateWithIncorrectLoglevel = await axios.put(`http://localhost:${availablePort}/administration/loglevel`, {
        level: 'nope'
      })
      expect(responseUpdateWithIncorrectLoglevel.status).to.be.equal(200)
      expect(responseUpdateWithIncorrectLoglevel.data).excluding('uuid').to.deep.equal({
        error: true,
        msg: 'The given level nope is not valid. It should be one of [error,warn,info,debug,trace]',
        code: 'invalid log level',
        data: {
          level: 'nope',
          supportedLevels: ['error', 'warn', 'info', 'debug', 'trace']
        }
      })

      const responseUpdateLoglevelForId = await axios.put(`http://localhost:${availablePort}/administration/loglevel/test-logger`, {
        level: 'debug'
      })
      expect(responseUpdateLoglevelForId.status).to.be.equal(200)
      expect(testLogger.getLevel()).to.equal('debug')
      expect(Logger.getLogger('test-logger').getLevel()).to.equal('debug')
      expect(Logger.getLogger('administration-server').getLevel()).to.equal('info')

      const retrieveUpdatedLoglevelForId = await axios.get(`http://localhost:${availablePort}/administration/loglevel`)
      expect(retrieveUpdatedLoglevelForId.status).to.be.equal(200)
      expect(retrieveUpdatedLoglevelForId.data).to.deep.equal({
        parent: { },
        children:
          [
            { id: 'test-logger', level: 'debug' },
            { id: 'administration-server', level: 'info' }
          ]
      })

      Logger.updateGlobalLogLevel(initialLogLevel)

      const responseUpdateLoglevelForIdWithMaxAge = await axios.put(`http://localhost:${availablePort}/administration/loglevel/test-logger`, {
        level: 'debug',
        maxAge: 1000
      })
      expect(responseUpdateLoglevelForIdWithMaxAge.status).to.be.equal(200)
      expect(testLogger.getLevel()).to.equal('debug')
      expect(Logger.getLogger('test-logger').getLevel()).to.equal('debug')
      expect(Logger.getLogger('administration-server').getLevel()).to.equal('info')
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(testLogger.getLevel()).to.equal(initialLogLevel)
      expect(Logger.getLogger('test-logger').getLevel()).to.equal(initialLogLevel)
      expect(Logger.getLogger('administration-server').getLevel()).to.equal('info')

      const responseUpdateLogForUnknownId = await axios.put(`http://localhost:${availablePort}/administration/loglevel/nope`, {
        level: 'trace'
      })
      expect(responseUpdateLogForUnknownId.status).to.be.equal(200)
      expect(responseUpdateLogForUnknownId.data).excluding('uuid').to.deep.equal({
        error: true,
        msg: 'The requested logger with id nope does not exist.',
        code: 'invalid log id',
        data: {
          id: 'nope',
          knownIds: ['test-logger', 'administration-server']
        }
      })
    } finally {
      await administrationServer.stop()
    }
  } finally {
    config.reset()
  }
}

export {
  test
}
