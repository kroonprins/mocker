import chai from 'chai'
import { MockServerEventEmitter, MockServerEvents } from '../src/mock-server.events'
import { MetricsService } from '../src/metrics.service'
import { Logger, PinoLogger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

const expect = chai.expect

const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)

    const eventEmitter = new MockServerEventEmitter()

    const metricsService = new MetricsService(eventEmitter)

    eventEmitter.emit(MockServerEvents.SERVER_STARTED, {
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
      totalRequests: {},
      requestsPerRule: {}
    })

    eventEmitter.emit(MockServerEvents.SERVER_STOPPED, {})

    expect(metricsService.getMetrics()).to.deep.equal({
      starts: {
        'test1': [{
          project: 'test1',
          someProp: 'someValue1'
        }]
      },
      totalRequests: {},
      requestsPerRule: {}
    })

    eventEmitter.emit(MockServerEvents.SERVER_STARTED, {
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
      totalRequests: {},
      requestsPerRule: {}
    })

    eventEmitter.emit(MockServerEvents.SERVER_STARTED, {
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
      totalRequests: {},
      requestsPerRule: {}
    })

    eventEmitter.emit(MockServerEvents.REQUEST_RECEIVED, {
      project: 'test1',
      projectRule: {
        location: 'location1'
      }
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
      },
      requestsPerRule: {
        'test1': {
          'location1': 1
        }
      }
    })

    eventEmitter.emit(MockServerEvents.REQUEST_RECEIVED, {
      project: 'test1',
      projectRule: {
        location: 'location1'
      }
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
      },
      requestsPerRule: {
        'test1': {
          'location1': 2
        }
      }
    })

    eventEmitter.emit(MockServerEvents.REQUEST_RECEIVED, {
      project: 'test2',
      projectRule: {
        location: 'location2'
      }
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
      },
      requestsPerRule: {
        'test1': {
          'location1': 2
        },
        'test2': {
          'location2': 1
        }
      }
    })

    eventEmitter.emit(MockServerEvents.REQUEST_RECEIVED, {
      project: 'test1',
      projectRule: {
        location: 'location1_1'
      }
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
      },
      requestsPerRule: {
        'test1': {
          'location1': 2,
          'location1_1': 1
        },
        'test2': {
          'location2': 1
        }
      }
    })
  } finally {
    config.reset()
  }
}

export {
  test
}
