import chai from 'chai'
import chaiExclude from 'chai-exclude'
import portastic from 'portastic'
import axios from 'axios'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'
import { AdministrationServer } from './../../lib/administration-server'

const expect = chai.expect
chai.use(chaiExclude)

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)

    const testLogger = config.getClassInstance(Logger, { id: 'test-logger' })

    const availablePort = (await portastic.find({
      min: 50000,
      max: 60000,
      retrieve: 1
    }))[0]

    const administrationServer = new AdministrationServer(availablePort, 'localhost')

    try {
      await administrationServer.start()

      const initialLogLevel = testLogger.getLevel()
      expect(initialLogLevel).to.be.equal('info')

      const responseUpdateLoglevel = await axios.put(`http://localhost:${availablePort}/administration/loglevel`, {
        level: 'debug'
      })
      expect(responseUpdateLoglevel.status).to.be.equal(200)
      expect(testLogger.getLevel()).to.equal('debug')
      testLogger.setLevel(initialLogLevel, true)

      const responseUpdateLoglevelWithMaxAge = await axios.put(`http://localhost:${availablePort}/administration/loglevel`, {
        level: 'debug',
        maxAge: 1000
      })
      expect(responseUpdateLoglevelWithMaxAge.status).to.be.equal(200)
      expect(testLogger.getLevel()).to.equal('debug')
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(testLogger.getLevel()).to.equal(initialLogLevel)

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
          supportedLevels: [ 'error', 'warn', 'info', 'debug', 'trace' ]
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
