import chai from 'chai'
import axios from 'axios'
import { MockServer } from '../src/mock-server-test'
import { Logger, PinoLogger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'

const expect = chai.expect

const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)

    const mockServerWithRuleLocation = new MockServer({
      port: 0,
      ruleLocation: ['./test/resources/a-rule-with-path-parameter.yaml', './test/resources/a-rule-with-echo-server.yaml']
    })

    const mockServerWithRuleObject = new MockServer({
      port: 0,
      rule: [{
        'name': 'basic rule',
        'request': {
          'path': '/path-parameter/:p1/:p2',
          'method': 'GET'
        },
        'response': {
          'templatingEngine': 'none',
          'contentType': 'text/plain',
          'statusCode': 200,
          'body': 'the response body'
        }
      }, {
        'request': {
          'path': '/post',
          'method': 'POST'
        },
        'response': {
          'templatingEngine': 'none',
          'contentType': 'text/plain',
          'statusCode': 200,
          'body': 'the post response body'
        }
      }]
    })

    try {
      const start1 = mockServerWithRuleLocation.start()
      const start2 = mockServerWithRuleObject.start()

      await Promise.all([start1, start2])

      const response = await axios.get(`http://localhost:${mockServerWithRuleLocation.port}/path-parameter/parameter1/parameter2?q1=query1&q2=query2`, {
        headers: {
          'X-test': 'test',
          'Cookie': 'c1=cookie1; c2=cookie2'
        }
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.equal('parameter p1: parameter1\nparameter p2: parameter2\n')

      expect(mockServerWithRuleLocation.global().invocations()).to.equal(1)
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').invocations()).to.equal(1)
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'POST').invocations()).to.equal(0)
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').ruleName()).to.equal('with path parameters')
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').ruleLocation()).to.equal('./test/resources/a-rule-with-path-parameter.yaml')
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').path()).to.equal('/path-parameter/parameter1/parameter2')
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').fullPath()).to.equal('/path-parameter/parameter1/parameter2?q1=query1&q2=query2')
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').header('X-test')).to.equal('test')
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').header('X-missing')).to.equal(undefined)
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').query('q1')).to.equal('query1')
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').query('q2')).to.equal('query2')
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').query('q3')).to.equal(undefined)
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').cookie('c1')).to.equal('cookie1')
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').cookie('c2')).to.equal('cookie2')
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').cookie('c3')).to.equal(undefined)
      expect(mockServerWithRuleLocation.name('with path parameters').invocations()).to.equal(1)
      expect(mockServerWithRuleLocation.name('something').invocations()).to.equal(0)

      const response2 = await axios.get(`http://localhost:${mockServerWithRuleObject.port}/path-parameter/parameter1/parameter2?q1=query1&q2=query2`, {
        headers: {
          'X-test': 'test',
          'Cookie': 'c1=cookie1; c2=cookie2'
        }
      })
      expect(response2.status).to.equal(200)
      expect(response2.data).to.equal('the response body')

      expect(mockServerWithRuleObject.global().invocations()).to.equal(1)
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').invocations()).to.equal(1)
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'POST').invocations()).to.equal(0)
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').ruleName()).to.equal('basic rule')
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').ruleLocation()).to.equal(null)
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').path()).to.equal('/path-parameter/parameter1/parameter2')
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').fullPath()).to.equal('/path-parameter/parameter1/parameter2?q1=query1&q2=query2')
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').header('X-test')).to.equal('test')
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').header('X-missing')).to.equal(undefined)
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').query('q1')).to.equal('query1')
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').query('q2')).to.equal('query2')
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').query('q3')).to.equal(undefined)
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').cookie('c1')).to.equal('cookie1')
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').cookie('c2')).to.equal('cookie2')
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').cookie('c3')).to.equal(undefined)
      expect(mockServerWithRuleObject.name('basic rule').invocations()).to.equal(1)
      expect(mockServerWithRuleObject.name('something').invocations()).to.equal(0)

      const request3 = axios.post(`http://localhost:${mockServerWithRuleLocation.port}/echo`,
        {
          'test': 'succeeded'
        },
        {
          headers: {
            'X-test': 'test',
            'Cookie': 'c1=cookie1;c2=cookie2'
          }
        })

      const request4 = axios.post(`http://localhost:${mockServerWithRuleObject.port}/post`,
        {
          'test': 'succeeded'
        },
        {
          headers: {
            'X-test': 'test',
            'Cookie': 'c1=cookie1;c2=cookie2'
          }
        })

      const [ response3, response4 ] = await Promise.all([ request3, request4 ])

      expect(response3.status).be.equal(200)
      expect(mockServerWithRuleLocation.for('/path-parameter/:p1/:p2', 'GET').invocations()).to.equal(1)
      expect(mockServerWithRuleLocation.for('/echo', 'POST').invocations()).to.equal(1)
      expect(mockServerWithRuleLocation.name('echo server').invocations()).to.equal(1)
      expect(mockServerWithRuleLocation.for('/echo', 'POST').body()).to.deep.equal({
        'test': 'succeeded'
      })

      expect(response4.status).be.equal(200)
      expect(mockServerWithRuleObject.for('/path-parameter/:p1/:p2', 'GET').invocations()).to.equal(1)
      expect(mockServerWithRuleObject.for('/post', 'POST').invocations()).to.equal(1)
      expect(mockServerWithRuleObject.for('/post', 'POST').body()).to.deep.equal({
        'test': 'succeeded'
      })
    } finally {
      await mockServerWithRuleLocation.stop()
      await mockServerWithRuleObject.stop()
    }
  } finally {
    config.reset()
  }
}

export {
  test
}