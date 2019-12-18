import chai from 'chai'
import { MockServerEventEmitter, MockServerEvents } from '@kroonprins/mocker-mock-server'
import { Logger, PinoLogger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { MetricsService } from '../src/metrics.service.mjs'

const expect = chai.expect

const createDummyReq = (id) => {
  const req = {
    path: 'path' + id,
    originalUrl: 'originalUrl' + id,
    header: i => i === 'h' + id ? 'header' + id : undefined,
    body: 'body' + id
  }
  req.query = {}
  req.query['q' + id] = 'query' + id
  req.cookies = {}
  req.cookies['c' + id] = 'cookie' + id
  return req
}

const createDummyProjectRule = (id, method) => {
  return {
    location: 'location' + id,
    rule: {
      name: 'name' + id,
      request: {
        path: '/test' + id,
        method: method
      }
    }
  }
}

const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)

    const eventEmitter = new MockServerEventEmitter()

    const metricsService = new MetricsService(eventEmitter)

    eventEmitter.emit(MockServerEvents.REQUEST_RECEIVED, {
      projectRule: createDummyProjectRule(1, 'GET'),
      req: createDummyReq(1)
    })

    expect(metricsService.global().invocations()).to.equal(1)
    expect(metricsService.for('/test1', 'GET').invocations()).to.equal(1)
    expect(metricsService.for('/test1', 'GET').ruleName()).to.equal('name1')
    expect(metricsService.for('/test1', 'GET').ruleLocation()).to.equal('location1')
    expect(metricsService.for('/test1', 'GET').path()).to.equal('path1')
    expect(metricsService.for('/test1', 'GET').fullPath()).to.equal('originalUrl1')
    expect(metricsService.for('/test1', 'GET').header('h1')).to.equal('header1')
    expect(metricsService.for('/test1', 'GET').header('h2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').query('q1')).to.equal('query1')
    expect(metricsService.for('/test1', 'GET').query('q2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').cookie('c1')).to.equal('cookie1')
    expect(metricsService.for('/test1', 'GET').cookie('c2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').body()).to.equal('body1')

    expect(metricsService.name('name1').invocations()).to.equal(1)
    expect(metricsService.name('name1').ruleName()).to.equal('name1')
    expect(metricsService.name('name1').ruleLocation()).to.equal('location1')
    expect(metricsService.name('name1').path()).to.equal('path1')
    expect(metricsService.name('name1').fullPath()).to.equal('originalUrl1')
    expect(metricsService.name('name1').header('h1')).to.equal('header1')
    expect(metricsService.name('name1').header('h2')).to.equal(undefined)
    expect(metricsService.name('name1').query('q1')).to.equal('query1')
    expect(metricsService.name('name1').query('q2')).to.equal(undefined)
    expect(metricsService.name('name1').cookie('c1')).to.equal('cookie1')
    expect(metricsService.name('name1').cookie('c2')).to.equal(undefined)
    expect(metricsService.name('name1').body()).to.equal('body1')

    eventEmitter.emit(MockServerEvents.REQUEST_RECEIVED, {
      projectRule: createDummyProjectRule(1, 'GET'),
      req: createDummyReq(1)
    })

    expect(metricsService.global().invocations()).to.equal(2)
    expect(metricsService.for('/test1', 'GET').invocations()).to.equal(2)
    expect(metricsService.for('/test1', 'GET').ruleName()).to.equal('name1')
    expect(metricsService.for('/test1', 'GET').ruleLocation()).to.equal('location1')
    expect(metricsService.for('/test1', 'GET').path()).to.equal('path1')
    expect(metricsService.for('/test1', 'GET').fullPath()).to.equal('originalUrl1')
    expect(metricsService.for('/test1', 'GET').header('h1')).to.equal('header1')
    expect(metricsService.for('/test1', 'GET').header('h2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').query('q1')).to.equal('query1')
    expect(metricsService.for('/test1', 'GET').query('q2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').cookie('c1')).to.equal('cookie1')
    expect(metricsService.for('/test1', 'GET').cookie('c2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').body()).to.equal('body1')

    expect(metricsService.name('name1').invocations()).to.equal(2)
    expect(metricsService.name('name1').ruleName()).to.equal('name1')
    expect(metricsService.name('name1').ruleLocation()).to.equal('location1')
    expect(metricsService.name('name1').path()).to.equal('path1')
    expect(metricsService.name('name1').fullPath()).to.equal('originalUrl1')
    expect(metricsService.name('name1').header('h1')).to.equal('header1')
    expect(metricsService.name('name1').header('h2')).to.equal(undefined)
    expect(metricsService.name('name1').query('q1')).to.equal('query1')
    expect(metricsService.name('name1').query('q2')).to.equal(undefined)
    expect(metricsService.name('name1').cookie('c1')).to.equal('cookie1')
    expect(metricsService.name('name1').cookie('c2')).to.equal(undefined)
    expect(metricsService.name('name1').body()).to.equal('body1')

    eventEmitter.emit(MockServerEvents.REQUEST_RECEIVED, {
      projectRule: createDummyProjectRule(1, 'POST'),
      req: createDummyReq(1)
    })

    expect(metricsService.global().invocations()).to.equal(3)
    expect(metricsService.for('/test1', 'GET').invocations()).to.equal(2)
    expect(metricsService.for('/test1', 'GET').ruleName()).to.equal('name1')
    expect(metricsService.for('/test1', 'GET').ruleLocation()).to.equal('location1')
    expect(metricsService.for('/test1', 'GET').path()).to.equal('path1')
    expect(metricsService.for('/test1', 'GET').fullPath()).to.equal('originalUrl1')
    expect(metricsService.for('/test1', 'GET').header('h1')).to.equal('header1')
    expect(metricsService.for('/test1', 'GET').header('h2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').query('q1')).to.equal('query1')
    expect(metricsService.for('/test1', 'GET').query('q2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').cookie('c1')).to.equal('cookie1')
    expect(metricsService.for('/test1', 'GET').cookie('c2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').body()).to.equal('body1')

    expect(metricsService.for('/test1', 'POST').invocations()).to.equal(1)
    expect(metricsService.for('/test1', 'POST').ruleName()).to.equal('name1')
    expect(metricsService.for('/test1', 'POST').ruleLocation()).to.equal('location1')
    expect(metricsService.for('/test1', 'POST').path()).to.equal('path1')
    expect(metricsService.for('/test1', 'POST').fullPath()).to.equal('originalUrl1')
    expect(metricsService.for('/test1', 'POST').header('h1')).to.equal('header1')
    expect(metricsService.for('/test1', 'POST').header('h2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'POST').query('q1')).to.equal('query1')
    expect(metricsService.for('/test1', 'POST').query('q2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'POST').cookie('c1')).to.equal('cookie1')
    expect(metricsService.for('/test1', 'POST').cookie('c2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'POST').body()).to.equal('body1')

    expect(metricsService.name('name1').invocations()).to.equal(3)
    expect(metricsService.name('name1').ruleName()).to.equal('name1')
    expect(metricsService.name('name1').ruleLocation()).to.equal('location1')
    expect(metricsService.name('name1').path()).to.equal('path1')
    expect(metricsService.name('name1').fullPath()).to.equal('originalUrl1')
    expect(metricsService.name('name1').header('h1')).to.equal('header1')
    expect(metricsService.name('name1').header('h2')).to.equal(undefined)
    expect(metricsService.name('name1').query('q1')).to.equal('query1')
    expect(metricsService.name('name1').query('q2')).to.equal(undefined)
    expect(metricsService.name('name1').cookie('c1')).to.equal('cookie1')
    expect(metricsService.name('name1').cookie('c2')).to.equal(undefined)
    expect(metricsService.name('name1').body()).to.equal('body1')

    eventEmitter.emit(MockServerEvents.REQUEST_RECEIVED, {
      projectRule: createDummyProjectRule(2, 'PUT'),
      req: createDummyReq(2)
    })

    expect(metricsService.global().invocations()).to.equal(4)
    expect(metricsService.for('/test1', 'GET').invocations()).to.equal(2)
    expect(metricsService.for('/test1', 'GET').ruleName()).to.equal('name1')
    expect(metricsService.for('/test1', 'GET').ruleLocation()).to.equal('location1')
    expect(metricsService.for('/test1', 'GET').path()).to.equal('path1')
    expect(metricsService.for('/test1', 'GET').fullPath()).to.equal('originalUrl1')
    expect(metricsService.for('/test1', 'GET').header('h1')).to.equal('header1')
    expect(metricsService.for('/test1', 'GET').header('h2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').query('q1')).to.equal('query1')
    expect(metricsService.for('/test1', 'GET').query('q2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').cookie('c1')).to.equal('cookie1')
    expect(metricsService.for('/test1', 'GET').cookie('c2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'GET').body()).to.equal('body1')

    expect(metricsService.for('/test1', 'POST').invocations()).to.equal(1)
    expect(metricsService.for('/test1', 'POST').ruleName()).to.equal('name1')
    expect(metricsService.for('/test1', 'POST').ruleLocation()).to.equal('location1')
    expect(metricsService.for('/test1', 'POST').path()).to.equal('path1')
    expect(metricsService.for('/test1', 'POST').fullPath()).to.equal('originalUrl1')
    expect(metricsService.for('/test1', 'POST').header('h1')).to.equal('header1')
    expect(metricsService.for('/test1', 'POST').header('h2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'POST').query('q1')).to.equal('query1')
    expect(metricsService.for('/test1', 'POST').query('q2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'POST').cookie('c1')).to.equal('cookie1')
    expect(metricsService.for('/test1', 'POST').cookie('c2')).to.equal(undefined)
    expect(metricsService.for('/test1', 'POST').body()).to.equal('body1')

    expect(metricsService.for('/test2', 'PUT').invocations()).to.equal(1)
    expect(metricsService.for('/test2', 'PUT').ruleName()).to.equal('name2')
    expect(metricsService.for('/test2', 'PUT').ruleLocation()).to.equal('location2')
    expect(metricsService.for('/test2', 'PUT').path()).to.equal('path2')
    expect(metricsService.for('/test2', 'PUT').fullPath()).to.equal('originalUrl2')
    expect(metricsService.for('/test2', 'PUT').header('h2')).to.equal('header2')
    expect(metricsService.for('/test2', 'PUT').header('h1')).to.equal(undefined)
    expect(metricsService.for('/test2', 'PUT').query('q2')).to.equal('query2')
    expect(metricsService.for('/test2', 'PUT').query('q1')).to.equal(undefined)
    expect(metricsService.for('/test2', 'PUT').cookie('c2')).to.equal('cookie2')
    expect(metricsService.for('/test2', 'PUT').cookie('c1')).to.equal(undefined)
    expect(metricsService.for('/test2', 'PUT').body()).to.equal('body2')

    expect(metricsService.name('name1').invocations()).to.equal(3)
    expect(metricsService.name('name1').ruleName()).to.equal('name1')
    expect(metricsService.name('name1').ruleLocation()).to.equal('location1')
    expect(metricsService.name('name1').path()).to.equal('path1')
    expect(metricsService.name('name1').fullPath()).to.equal('originalUrl1')
    expect(metricsService.name('name1').header('h1')).to.equal('header1')
    expect(metricsService.name('name1').header('h2')).to.equal(undefined)
    expect(metricsService.name('name1').query('q1')).to.equal('query1')
    expect(metricsService.name('name1').query('q2')).to.equal(undefined)
    expect(metricsService.name('name1').cookie('c1')).to.equal('cookie1')
    expect(metricsService.name('name1').cookie('c2')).to.equal(undefined)
    expect(metricsService.name('name1').body()).to.equal('body1')

    expect(metricsService.name('name2').invocations()).to.equal(1)
    expect(metricsService.name('name2').ruleName()).to.equal('name2')
    expect(metricsService.name('name2').ruleLocation()).to.equal('location2')
    expect(metricsService.name('name2').path()).to.equal('path2')
    expect(metricsService.name('name2').fullPath()).to.equal('originalUrl2')
    expect(metricsService.name('name2').header('h2')).to.equal('header2')
    expect(metricsService.name('name2').header('h1')).to.equal(undefined)
    expect(metricsService.name('name2').query('q2')).to.equal('query2')
    expect(metricsService.name('name2').query('q1')).to.equal(undefined)
    expect(metricsService.name('name2').cookie('c2')).to.equal('cookie2')
    expect(metricsService.name('name2').cookie('c1')).to.equal(undefined)
    expect(metricsService.name('name2').body()).to.equal('body2')
  } finally {
    config.reset()
  }
}

export {
  test
}
