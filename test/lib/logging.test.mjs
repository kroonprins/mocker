import chai from 'chai'
import { config } from './../../lib/config'
import { Logger, PinoLogger } from './../../lib/logging'
import { FunctionalValidationError } from './../../lib/error-types'

const expect = chai.expect

const test = () => {
  try {
    config
      .registerProperty('logging.level.startup', 'warn')
      .registerType(Logger, PinoLogger)

    // create parent logger with default level
    const baseLogger = config.getClassInstance(Logger)
    expect(baseLogger.getLevel()).to.equal('warn')

    // create parent logger with given level
    const baseLoggerWithLevel = config.getClassInstance(Logger, { level: 'error' })
    expect(baseLoggerWithLevel.getLevel()).to.equal('error')
    expect(baseLogger.getLevel()).to.equal('error')

    // create parent logger with incorrect level
    expect(() => config.getClassInstance(Logger, { level: 'nope' })).to.throw(FunctionalValidationError)

    // create child logger with default level
    const childLogger = config.getClassInstance(Logger, { id: 'child' })
    expect(childLogger.getLevel()).to.equal('warn')

    // create same child logger with given level
    const childLoggerWithLevel = config.getClassInstance(Logger, { id: 'child', level: 'debug' })
    expect(childLoggerWithLevel.getLevel()).to.equal('debug')
    expect(childLogger.getLevel()).to.equal('debug')

    // create another child logger with other id
    const childLoggerWithOtherId = config.getClassInstance(Logger, { id: 'another.child', level: 'warn' })
    expect(childLoggerWithOtherId.getLevel()).to.equal('warn')
    expect(childLoggerWithLevel.getLevel()).to.equal('debug')
    expect(childLogger.getLevel()).to.equal('debug')

    // create child logger with incorrect level
    expect(() => config.getClassInstance(Logger, { id: 'nope', level: 'nope' })).to.throw(FunctionalValidationError)

    // get logger by id
    const retrievedBaseLogger = Logger.getLogger()
    expect(retrievedBaseLogger.id).to.equal(baseLogger.id)
    expect(retrievedBaseLogger.getLevel()).to.equal(baseLogger.getLevel())
    expect(retrievedBaseLogger.id).to.equal(baseLoggerWithLevel.id)
    expect(retrievedBaseLogger.getLevel()).to.equal(baseLoggerWithLevel.getLevel())
    const retrievedChildLogger = Logger.getLogger('child')
    expect(retrievedChildLogger.id).to.equal(childLogger.id)
    expect(retrievedChildLogger.getLevel()).to.equal(childLogger.getLevel())
    const retrievedOtherChildLogger = Logger.getLogger('another.child')
    expect(retrievedOtherChildLogger.id).to.equal(childLoggerWithOtherId.id)
    expect(retrievedOtherChildLogger.getLevel()).to.equal(childLoggerWithOtherId.getLevel())

    // update level of one child logger
    childLoggerWithLevel.setLevel('trace')
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('trace')
    expect(childLoggerWithOtherId.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('error')
    expect(baseLogger.getLevel()).to.equal('error')

    // Test getCreatedLoggers
    const createdLoggers = Logger.getCreatedLoggers()
    expect(createdLoggers).to.deep.equal({
      parent: { level: 'error' },
      children:
        [
          { id: 'child', level: 'trace' },
          { id: 'another.child', level: 'warn' }
        ]
    })

    // try updating level of one child logger with incorrect log level
    expect(() => childLoggerWithLevel.setLevel('nope')).to.throw(FunctionalValidationError)
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('trace')
    expect(childLoggerWithOtherId.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('error')
    expect(baseLogger.getLevel()).to.equal('error')

    // update level of parent logger
    baseLoggerWithLevel.setLevel('debug')
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('trace')
    expect(childLoggerWithOtherId.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('debug')
    expect(baseLogger.getLevel()).to.equal('debug')

    // try updating level of parent logger with incorrect log level
    expect(() => baseLoggerWithLevel.setLevel('nope')).to.throw(FunctionalValidationError)
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('trace')
    expect(childLoggerWithOtherId.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('debug')
    expect(baseLogger.getLevel()).to.equal('debug')

    // update level of one child logger by id
    Logger.updateLogLevel('trace', 'child')
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('trace')
    expect(childLoggerWithOtherId.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('debug')
    expect(baseLogger.getLevel()).to.equal('debug')

    // try updating level of one child logger by id with incorrect log level
    expect(() => Logger.updateLogLevel('nope', 'child')).to.throw(FunctionalValidationError)
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('trace')
    expect(childLoggerWithOtherId.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('debug')
    expect(baseLogger.getLevel()).to.equal('debug')

    // update level of parent logger
    Logger.updateLogLevel('error')
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('trace')
    expect(childLoggerWithOtherId.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('error')
    expect(baseLogger.getLevel()).to.equal('error')

    // try updating level of parent logger with incorrect log level
    expect(() => Logger.updateLogLevel('nope')).to.throw(FunctionalValidationError)
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('trace')
    expect(childLoggerWithOtherId.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('error')
    expect(baseLogger.getLevel()).to.equal('error')

    // update level of all loggers
    Logger.updateGlobalLogLevel('info')
    expect(childLoggerWithLevel.getLevel()).to.equal('info')
    expect(childLogger.getLevel()).to.equal('info')
    expect(childLoggerWithOtherId.getLevel()).to.equal('info')
    expect(baseLoggerWithLevel.getLevel()).to.equal('info')
    expect(baseLogger.getLevel()).to.equal('info')

    // try updating level of all loggers by setting incorrect level
    expect(() => Logger.updateGlobalLogLevel('nope')).to.throw(FunctionalValidationError)
    expect(childLoggerWithLevel.getLevel()).to.equal('info')
    expect(childLogger.getLevel()).to.equal('info')
    expect(childLoggerWithOtherId.getLevel()).to.equal('info')
    expect(baseLoggerWithLevel.getLevel()).to.equal('info')
    expect(baseLogger.getLevel()).to.equal('info')

    // Error when trying to retrieve unknown logger
    expect(() => Logger.getLogger('nope')).to.throw(FunctionalValidationError)
  } finally {
    config.reset()
  }
}

export {
  test
}
