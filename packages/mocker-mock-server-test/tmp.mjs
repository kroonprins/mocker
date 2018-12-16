import chai from 'chai'
import axios from 'axios'
import { MockServer } from './src/mock-server-test'

const expect = chai.expect

const test = async () => {
  const mockServer = new MockServer({
    port: 0, // 0 = random
    // ruleLocation: '../mocker-doc/rules/a-rule-with-path-parameter.yaml'
    // ruleLocation: '../mocker-doc/rules/*.yaml'
    // ruleLocation: [ '../mocker-doc/rules/*basic*', '../mocker-doc/rules/*latency*', '../mocker-doc/rules/*conditional*' ]
    ruleLocation: ['../mocker-doc/rules/a-rule-with-path-parameter.yaml', '../mocker-doc/rules/a-rule-with-echo-server.yaml']
    // rule: {
    //   // 'name': 'basic rule',
    //   'request': {
    //     'path': '/path-parameter/:p1/:p2',
    //     'method': 'GET'
    //   },
    //   'response': {
    //     'templatingEngine': 'none',
    //     'contentType': 'text/plain',
    //     'statusCode': 200,
    //     'body': 'the response body'
    //   }
    // }
    // rule: [{
    //   'name': 'basic rule',
    //   'request': {
    //     'path': '/path-parameter/:p1/:p2',
    //     'method': 'GET'
    //   },
    //   'response': {
    //     'templatingEngine': 'none',
    //     'contentType': 'text/plain',
    //     'statusCode': 200,
    //     'body': 'the response body'
    //   }
    // }, {
    //   'request': {
    //     'path': '/post',
    //     'method': 'POST'
    //   },
    //   'response': {
    //     'templatingEngine': 'none',
    //     'contentType': 'text/plain',
    //     'statusCode': 200,
    //     'body': 'the post response body'
    //   }
    // }]
  })

  try {
    await mockServer.start()

    const response = await axios.get(`http://localhost:${mockServer.port}/path-parameter/parameter1/parameter2?q1=query1&q2=query2`, {
      headers: {
        'X-test': 'test',
        'Cookie': 'c1=cookie1; c2=cookie2'
      }
    })
    expect(response.status).to.equal(200)
    expect(response.data).to.equal('parameter p1: parameter1\nparameter p2: parameter2\n')

    expect(mockServer.global().invocations()).to.equal(1)
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').invocations()).to.equal(1)
    expect(mockServer.for('/path-parameter/:p1/:p2', 'POST').invocations()).to.equal(0)
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').ruleName()).to.equal('with path parameters')
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').ruleLocation()).to.equal('../mocker-doc/rules/a-rule-with-path-parameter.yaml')
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').path()).to.equal('/path-parameter/parameter1/parameter2')
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').fullPath()).to.equal('/path-parameter/parameter1/parameter2?q1=query1&q2=query2')
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').header('X-test')).to.equal('test')
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').header('X-missing')).to.equal(undefined)
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').query('q1')).to.equal('query1')
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').query('q2')).to.equal('query2')
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').query('q3')).to.equal(undefined)
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').cookie('c1')).to.equal('cookie1')
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').cookie('c2')).to.equal('cookie2')
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').cookie('c3')).to.equal(undefined)

    const response2 = await axios.post(`http://localhost:${mockServer.port}/echo`,
      {
        'test': 'succeeded'
      },
      {
        headers: {
          'X-test': 'test',
          'Cookie': 'c1=cookie1;c2=cookie2'
        }
      })

    expect(response2.status).be.equal(200)
    expect(mockServer.for('/path-parameter/:p1/:p2', 'GET').invocations()).to.equal(1)
    expect(mockServer.for('/echo', 'POST').invocations()).to.equal(1)
    expect(mockServer.for('/echo', 'POST').body()).to.deep.equal({
      'test': 'succeeded'
    })
  } finally {
    await mockServer.stop()
  }
}

test()
