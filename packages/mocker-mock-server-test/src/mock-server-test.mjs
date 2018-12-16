import { MockServer, initializeWithoutMetricsAndSwagger as setDefaultConfigMockServer, MockServerEventEmitter } from '@kroonprins/mocker-mock-server'
import { initializeWithoutProjectService as setDefaultConfig } from '@kroonprins/mocker-shared-lib/config-default'
import { ProjectService } from './project.service'
import { MetricsService } from './metrics.service'
import { Logger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

setDefaultConfig()
setDefaultConfigMockServer()

class MockServerTest {
  constructor (opts) {
    this.logger = config.getClassInstance(Logger, { id: 'mock-server-test' })
    this.opts = opts
    this.mockServer = undefined
    this.metricsService = undefined
  }

  async start () {
    const projectService = await this._createProjectService(this.opts)

    const mockServerEventEmitter = new MockServerEventEmitter()
    this.mockServer = new MockServer(
      this.opts.port,
      '0.0.0.0',
      'mockServerTest',
      projectService,
      undefined, // use TemplatingService from config
      false,
      false,
      mockServerEventEmitter
    )
    this.metricsService = new MetricsService(mockServerEventEmitter)

    return this.mockServer.start().then(() => {
      this.port = this.mockServer.port
    })
  }

  stop () {
    if (this.mockServer) {
      return this.mockServer.stop()
    }
  }

  global () {
    return this.metricsService.global()
  }

  for (path, method) {
    return this.metricsService.for(path, method)
  }

  _createProjectService (opts) {
    if (opts.ruleLocation) {
      const locations = Array.isArray(opts.ruleLocation) ? opts.ruleLocation : [opts.ruleLocation]
      return ProjectService.fromRuleLocations(locations)
    } else if (opts.rule) {
      const rules = Array.isArray(opts.rule) ? opts.rule : [opts.rule]
      return ProjectService.fromRules(rules)
    } else {
      this.logger.error('To start the mock server either a \'ruleLocation\' or a \'rule\' must be given')
      throw new Error('Failed to start mock server')
    }
  }
}

export {
  MockServerTest as MockServer
}
