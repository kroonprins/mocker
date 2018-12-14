import chai from 'chai'
import { LearningModeServerEventEmitter, LearningModeServerEvents } from '../src/learning-mode.server.events'
import { MetricsService } from '../src/metrics.service'
import { Logger, PinoLogger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

const expect = chai.expect

const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)

    const eventEmitter = new LearningModeServerEventEmitter()

    const metricsService = new MetricsService(eventEmitter)

    eventEmitter.emit(LearningModeServerEvents.SERVER_STARTED, {
      project: 'test1',
      someProp: 'someValue1'
    })

    expect(metricsService.getMetrics()).to.deep.equal({
      starts: {
        'test1': [{
          project: 'test1',
          someProp: 'someValue1'
        }]
      },
      totalRequests: {}
    })

    eventEmitter.emit(LearningModeServerEvents.SERVER_STOPPED, {})

    expect(metricsService.getMetrics()).to.deep.equal({
      starts: {
        'test1': [{
          project: 'test1',
          someProp: 'someValue1'
        }]
      },
      totalRequests: {}
    })

    eventEmitter.emit(LearningModeServerEvents.SERVER_STARTED, {
      project: 'test1',
      someProp: 'someValue2'
    })

    expect(metricsService.getMetrics()).to.deep.equal({
      starts: {
        'test1': [{
          project: 'test1',
          someProp: 'someValue1'
        }, {
          project: 'test1',
          someProp: 'someValue2'
        }]
      },
      totalRequests: {}
    })

    eventEmitter.emit(LearningModeServerEvents.SERVER_STARTED, {
      project: 'test2',
      someProp: 'otherValue'
    })

    expect(metricsService.getMetrics()).to.deep.equal({
      starts: {
        'test1': [{
          project: 'test1',
          someProp: 'someValue1'
        }, {
          project: 'test1',
          someProp: 'someValue2'
        }],
        'test2': [{
          project: 'test2',
          someProp: 'otherValue'
        }]
      },
      totalRequests: {}
    })

    eventEmitter.emit(LearningModeServerEvents.REQUEST_RECEIVED, {
      project: 'test1',
      ruleLocation: 'location1'
    })

    expect(metricsService.getMetrics()).to.deep.equal({
      starts: {
        'test1': [{
          project: 'test1',
          someProp: 'someValue1'
        }, {
          project: 'test1',
          someProp: 'someValue2'
        }],
        'test2': [{
          project: 'test2',
          someProp: 'otherValue'
        }]
      },
      totalRequests: {
        'test1': 1
      }
    })

    eventEmitter.emit(LearningModeServerEvents.REQUEST_RECEIVED, {
      project: 'test1',
      ruleLocation: 'location1'
    })

    expect(metricsService.getMetrics()).to.deep.equal({
      starts: {
        'test1': [{
          project: 'test1',
          someProp: 'someValue1'
        }, {
          project: 'test1',
          someProp: 'someValue2'
        }],
        'test2': [{
          project: 'test2',
          someProp: 'otherValue'
        }]
      },
      totalRequests: {
        'test1': 2
      }
    })

    eventEmitter.emit(LearningModeServerEvents.REQUEST_RECEIVED, {
      project: 'test2',
      ruleLocation: 'location2'
    })

    expect(metricsService.getMetrics()).to.deep.equal({
      starts: {
        'test1': [{
          project: 'test1',
          someProp: 'someValue1'
        }, {
          project: 'test1',
          someProp: 'someValue2'
        }],
        'test2': [{
          project: 'test2',
          someProp: 'otherValue'
        }]
      },
      totalRequests: {
        'test1': 2,
        'test2': 1
      }
    })

    eventEmitter.emit(LearningModeServerEvents.REQUEST_RECEIVED, {
      project: 'test1',
      ruleLocation: 'location1_1'
    })

    expect(metricsService.getMetrics()).to.deep.equal({
      starts: {
        'test1': [{
          project: 'test1',
          someProp: 'someValue1'
        }, {
          project: 'test1',
          someProp: 'someValue2'
        }],
        'test2': [{
          project: 'test2',
          someProp: 'otherValue'
        }]
      },
      totalRequests: {
        'test1': 3,
        'test2': 1
      }
    })
  } finally {
    config.reset()
  }
}

export {
  test
}
