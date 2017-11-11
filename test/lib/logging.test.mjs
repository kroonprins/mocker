import chai from 'chai'
import { config } from './../../lib/config'
import { Logger, PinoLogger } from './../../lib/logging'

const expect = chai.expect

const test = () => {
  try {
    config.registerProperty('logging.level.startup', 'warn')
    config.registerType(Logger, PinoLogger)

    // create parent logger with default level
    const baseLogger = config.getClassInstance(Logger)
    expect(baseLogger.getLevel()).to.equal('warn')

    // create parent logger with given level
    const baseLoggerWithLevel = config.getClassInstance(Logger, { level: 'error' })
    expect(baseLoggerWithLevel.getLevel()).to.equal('error')

    // create child logger with default level
    const childLogger = config.getClassInstance(Logger, { id: 'child' })
    expect(childLogger.getLevel()).to.equal('warn')

    // create child logger with given level
    const childLoggerWithLevel = config.getClassInstance(Logger, { id: 'child', level: 'debug' })
    expect(childLoggerWithLevel.getLevel()).to.equal('debug')

    // update level of one child logger
    childLoggerWithLevel.setLevel('trace')
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('error')
    expect(baseLogger.getLevel()).to.equal('warn')

    // update level of one parent logger
    baseLoggerWithLevel.setLevel('debug')
    expect(childLoggerWithLevel.getLevel()).to.equal('trace')
    expect(childLogger.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('debug')
    expect(baseLogger.getLevel()).to.equal('warn')

    // update level of all loggers by setting level on a child logger
    childLoggerWithLevel.setLevel('info', true)
    expect(childLoggerWithLevel.getLevel()).to.equal('info')
    expect(childLogger.getLevel()).to.equal('info')
    expect(baseLoggerWithLevel.getLevel()).to.equal('info')
    expect(baseLogger.getLevel()).to.equal('info')

    // update level of all loggers by setting level on a parent logger
    baseLogger.setLevel('warn', true)
    expect(childLoggerWithLevel.getLevel()).to.equal('warn')
    expect(childLogger.getLevel()).to.equal('warn')
    expect(baseLoggerWithLevel.getLevel()).to.equal('warn')
    expect(baseLogger.getLevel()).to.equal('warn')
  } finally {
    config.reset()
  }
}

export {
  test
}
