import chai from 'chai'
import { ConfigService } from '../src/config.service'
import { Logger, PinoLogger } from '../src/logging'
import { config } from '../src/config'

const expect = chai.expect

const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)
      .registerInstance('NunjucksTemplatingService', {})

    const configService = new ConfigService()

    let exceptionThrownBecauseUnknownItem = false
    try {
      await configService.get('nope')
    } catch (e) {
      expect(e.message).to.equal('Unknown config item')
      exceptionThrownBecauseUnknownItem = true
    }
    expect(exceptionThrownBecauseUnknownItem).to.equal(true)

    expect(await configService.get('learning-mode-server-types')).to.deep.equal(['reverse-proxy', 'forward-proxy'])
    expect(configService.getSync('learning-mode-server-types')).to.deep.equal(['reverse-proxy', 'forward-proxy'])

    expect(await configService.get('templating-types')).to.deep.equal(['none', 'nunjucks'])
    expect(configService.getSync('templating-types')).to.deep.equal(['none', 'nunjucks'])

    expect(await configService.get('http-methods')).to.deep.equal([
      'GET',
      'HEAD',
      'POST',
      'PUT',
      'DELETE',
      'CONNECT',
      'OPTIONS',
      'TRACE',
      'PATCH'])
    expect(configService.getSync('http-methods')).to.deep.equal([
      'GET',
      'HEAD',
      'POST',
      'PUT',
      'DELETE',
      'CONNECT',
      'OPTIONS',
      'TRACE',
      'PATCH'])

    expect(await configService.get('log-levels')).to.deep.equal(['error', 'warn', 'info', 'debug', 'trace'])
    expect(configService.getSync('log-levels')).to.deep.equal(['error', 'warn', 'info', 'debug', 'trace'])

    expect(await configService.get('config-items')).to.deep.equal(['learning-mode-server-types', 'templating-types', 'http-methods', 'log-levels', 'latency-types', 'config-items'])
    expect(configService.getSync('config-items')).to.deep.equal(['learning-mode-server-types', 'templating-types', 'http-methods', 'log-levels', 'latency-types', 'config-items'])
  } finally {
    config.reset()
  }
}

export {
  test
}
