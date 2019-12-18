import { Logger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { MockServerEventEmitter, MockServerEvents } from './mock-server.events.mjs'

class MetricsService {
  constructor (mockServerEventEmitter = config.getInstance(MockServerEventEmitter)) {
    this.logger = config.getClassInstance(Logger, { id: 'metrics-service' })
    this.metrics = this._initialMetrics()
    this.mockServerEventEmitter = mockServerEventEmitter
    this._addListeners()
  }

  getMetrics () {
    return this.metrics
  }

  _initialMetrics () {
    return {
      starts: {},
      totalRequests: {},
      requestsPerRule: {}
    }
  }

  _addListeners () {
    this.mockServerEventEmitter
      .on(MockServerEvents.SERVER_STARTED,
        (serverStartedEvent) => {
          this.logger.debug('Received %s event: %o', MockServerEvents.SERVER_STARTED, serverStartedEvent)
          this._handleServerStartedEvent(serverStartedEvent)
        })
      .on(MockServerEvents.SERVER_STOPPED,
        (serverStoppedEvent) => {
          this.logger.debug('Received %s event: %o', MockServerEvents.SERVER_STOPPED, serverStoppedEvent)
          this._handleServerStoppedEvent(serverStoppedEvent)
        })
      .on(MockServerEvents.REQUEST_RECEIVED,
        (requestReceivedEvent) => {
          this.logger.debug('Received %s event: %o', MockServerEvents.REQUEST_RECEIVED, requestReceivedEvent)
          this._handleRequestReceivedEvent(requestReceivedEvent)
        })
  }

  _handleServerStartedEvent (serverStartedEvent) {
    const serverStartsForProject = this.metrics.starts[serverStartedEvent.project] || []
    serverStartsForProject.push(serverStartedEvent)
    this.metrics.starts[serverStartedEvent.project] = serverStartsForProject
  }

  _handleServerStoppedEvent (serverStoppedEvent) {
    // currently not interested
  }

  _handleRequestReceivedEvent (requestReceivedEvent) {
    const requestsPerRuleForProject = this.metrics.requestsPerRule[requestReceivedEvent.project] || {}

    let requestsPerRuleForProjectRule = requestsPerRuleForProject[requestReceivedEvent.projectRule.location] || 0
    requestsPerRuleForProject[requestReceivedEvent.projectRule.location] = requestsPerRuleForProjectRule + 1
    this.metrics.requestsPerRule[requestReceivedEvent.project] = requestsPerRuleForProject

    let totalRequestsForProject = this.metrics.totalRequests[requestReceivedEvent.project] || 0
    this.metrics.totalRequests[requestReceivedEvent.project] = totalRequestsForProject + 1
  }
}

export {
  MetricsService
}
