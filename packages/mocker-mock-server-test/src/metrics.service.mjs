import { MockServerEventEmitter, MockServerEvents } from '@kroonprins/mocker-mock-server'
import { Metrics, GlobalMetrics } from './metrics-model'
import { Logger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

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
    this._updateGlobalMetrics(requestReceivedEvent)
    this._updateMetricsByPathAndMethod(requestReceivedEvent)
  }

  _getPathAndMethodKey (path, method) {
    return `${path}##${method}`
  }

  _updateGlobalMetrics (requestReceivedEvent) {
    this.metrics.globalMetrics = new GlobalMetrics(this.metrics.globalMetrics.invocations() + 1)
  }

  _updateMetricsByPathAndMethod (requestReceivedEvent) {
    const ruleRequest = requestReceivedEvent.projectRule.rule.request
    const pathAndMethodKey = this._getPathAndMethodKey(ruleRequest.path, ruleRequest.method)
    let metricsByPathAndMethod = this.metrics.metricsByPathAndMethod[pathAndMethodKey] || Metrics.empty()
    this.metrics.metricsByPathAndMethod[pathAndMethodKey] = new Metrics(
      metricsByPathAndMethod.invocations() + 1,
      [...metricsByPathAndMethod._requests, {
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
