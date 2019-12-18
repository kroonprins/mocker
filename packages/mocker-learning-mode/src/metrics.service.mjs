import { Logger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { LearningModeServerEventEmitter, LearningModeServerEvents } from './learning-mode.server.events.mjs'

class MetricsService {
  constructor (learningModeServerEventEmitter = config.getInstance(LearningModeServerEventEmitter)) {
    this.logger = config.getClassInstance(Logger, { id: 'metrics-service' })
    this.metrics = this._initialMetrics()
    this.learningModeServerEventEmitter = learningModeServerEventEmitter
    this._addListeners()
  }

  getMetrics () {
    return this.metrics
  }

  _initialMetrics () {
    return {
      starts: {},
      totalRequests: {}
    }
  }

  _addListeners () {
    this.learningModeServerEventEmitter
      .on(LearningModeServerEvents.SERVER_STARTED,
        (serverStartedEvent) => {
          this.logger.debug('Received %s event: %o', LearningModeServerEvents.SERVER_STARTED, serverStartedEvent)
          this._handleServerStartedEvent(serverStartedEvent)
        })
      .on(LearningModeServerEvents.SERVER_STOPPED,
        (serverStoppedEvent) => {
          this.logger.debug('Received %s event: %o', LearningModeServerEvents.SERVER_STOPPED, serverStoppedEvent)
          this._handleServerStoppedEvent(serverStoppedEvent)
        })
      .on(LearningModeServerEvents.REQUEST_RECEIVED,
        (requestReceivedEvent) => {
          this.logger.debug('Received %s event: %o', LearningModeServerEvents.REQUEST_RECEIVED, requestReceivedEvent)
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
    const totalRequestsForProject = this.metrics.totalRequests[requestReceivedEvent.project] || 0
    this.metrics.totalRequests[requestReceivedEvent.project] = totalRequestsForProject + 1
  }
}

export {
  MetricsService
}
