import { MockServerEventEmitter, MockServerEvents } from '@kroonprins/mocker-mock-server'
import { Logger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { Metrics, GlobalMetrics } from './metrics-model.mjs'

class MetricsService {
  constructor (mockServerEventEmitter = config.getInstance(MockServerEventEmitter)) {
    this.logger = config.getClassInstance(Logger, { id: 'test-metrics-service' })
    this.metrics = this._initialMetrics()
    this.mockServerEventEmitter = mockServerEventEmitter
    this._addListeners()
  }

  global () {
    return this.metrics.globalMetrics
  }

  for (path, method) {
    const pathAndMethodKey = this._getPathAndMethodKey(path, method)
    const metricsByPathAndMethod = this.metrics.metricsByPathAndMethod[pathAndMethodKey] || Metrics.empty()
    return metricsByPathAndMethod
  }

  name (name) {
    const metricsByRuleName = this.metrics.metricsByRuleName[name] || Metrics.empty()
    return metricsByRuleName
  }

  _initialMetrics () {
    return {
      globalMetrics: GlobalMetrics.empty(),
      metricsByRuleName: {},
      metricsByPathAndMethod: {}
    }
  }

  _addListeners () {
    this.mockServerEventEmitter
      .on(MockServerEvents.REQUEST_RECEIVED,
        (requestReceivedEvent) => {
          this.logger.debug('Received %s event: %o', MockServerEvents.REQUEST_RECEIVED, requestReceivedEvent)
          this._handleRequestReceivedEvent(requestReceivedEvent)
        })
  }

  _handleRequestReceivedEvent (requestReceivedEvent) {
    this._updateGlobalMetrics()
    this._updateMetricsByPathAndMethod(requestReceivedEvent)
    this._updateMetricsByRuleName(requestReceivedEvent)
  }

  _getPathAndMethodKey (path, method) {
    return `${path}##${method}`
  }

  _updateGlobalMetrics () {
    this.metrics.globalMetrics = new GlobalMetrics(this.metrics.globalMetrics.invocations() + 1)
  }

  _updateMetricsByPathAndMethod (requestReceivedEvent) {
    const ruleRequest = requestReceivedEvent.projectRule.rule.request
    const pathAndMethodKey = this._getPathAndMethodKey(ruleRequest.path, ruleRequest.method)
    const metricsByPathAndMethod = this.metrics.metricsByPathAndMethod[pathAndMethodKey] || Metrics.empty()
    this.metrics.metricsByPathAndMethod[pathAndMethodKey] = new Metrics(
      metricsByPathAndMethod.invocations() + 1,
      [...metricsByPathAndMethod._requests, {
        timestamp: requestReceivedEvent.timestamp,
        projectRule: requestReceivedEvent.projectRule,
        req: requestReceivedEvent.req
      }]
    )
  }

  _updateMetricsByRuleName (requestReceivedEvent) {
    const name = requestReceivedEvent.projectRule.rule.name
    if (!name) {
      return
    }
    const metricsByRuleName = this.metrics.metricsByRuleName[name] || Metrics.empty()
    this.metrics.metricsByRuleName[name] = new Metrics(
      metricsByRuleName.invocations() + 1,
      [...metricsByRuleName._requests, {
        timestamp: requestReceivedEvent.timestamp,
        projectRule: requestReceivedEvent.projectRule,
        req: requestReceivedEvent.req
      }]
    )
  }
}

export {
  MetricsService
}
