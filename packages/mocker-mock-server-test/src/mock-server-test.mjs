import {
  MockServer,
  initializeWithoutMetricsAndSwagger as setDefaultConfigMockServer,
  MockServerEventEmitter,
  TemplatingService,
  NunjucksTemplatingService,
  NunjucksTemplatingHelpers
} from '@kroonprins/mocker-mock-server'
import { initializeWithoutProjectService as setDefaultConfig } from '@kroonprins/mocker-shared-lib/config-default.mjs'
import { Logger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { ProjectService } from './project.service.mjs'
import { MetricsService } from './metrics.service.mjs'

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
    const templatingService = this._createTemplatingService(this.opts)

    const mockServerEventEmitter = new MockServerEventEmitter()
    this.mockServer = new MockServer(
      this.opts.port,
      '0.0.0.0',
      'mockServerTest',
      projectService,
      templatingService,
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

  name (name) {
    return this.metricsService.name(name)
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

  _createTemplatingService (opts) {
    if (opts.nunjucksTemplatingHelpersFile || opts.nunjucksTemplatingHelpers) {
      return this._createTemplatingServiceWithHelpers(opts.nunjucksTemplatingHelpersFile, opts.nunjucksTemplatingHelpers)
    } else {
      return undefined // the default templating service can be used from config
    }
  }

  _createTemplatingServiceWithHelpers (file, extraHelpers) {
    const nunjucksTemplatingHelpers = new NunjucksTemplatingHelpers(file, extraHelpers)
    const nunjucksTemplatingService = new NunjucksTemplatingService(nunjucksTemplatingHelpers)
    nunjucksTemplatingHelpers.nunjucksTemplatingService = nunjucksTemplatingService
    return new TemplatingService(nunjucksTemplatingService)
  }
}

export {
  MockServerTest as MockServer
}
