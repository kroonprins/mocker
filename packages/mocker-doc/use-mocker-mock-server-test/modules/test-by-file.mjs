import axios from 'axios'
import chai from 'chai'
import { MockServer } from '@kroonprins/mocker-mock-server-test'

const expect = chai.expect

const test = async () => {
  const mockServer = new MockServer({
    port: 0,
    ruleLocation: ['test-rule-1.yaml', 'test-rule-2.yaml']
  })

  try {
    await mockServer.start()

    const response = await axios.post(`http://localhost:${mockServer.port}/test1/parameter1?query1=q1&query2=q2`, 'inputBody', {
      headers: {
        'Content-Type': 'text/plain',
        'X-test1': 'h1',
        'X-test2': 'h2',
        Cookie: 'cookie1=c1; cookie2=c2'
      }
    })
    expect(response.status).to.equal(200)

    expect(mockServer.global().invocations()).to.equal(1)
    expect(mockServer.for('/test1/:p1', 'POST').invocations()).to.equal(1)
    expect(mockServer.for('/test2/:p2', 'POST').invocations()).to.equal(0)
    expect(mockServer.for('/test1/:p1', 'POST').ruleName()).to.equal('test rule 1')
    expect(mockServer.for('/test1/:p1', 'POST').ruleLocation()).to.equal('test-rule-1.yaml')
    expect(mockServer.for('/test1/:p1', 'POST').path()).to.equal('/test1/parameter1')
    expect(mockServer.for('/test1/:p1', 'POST').fullPath()).to.equal('/test1/parameter1?query1=q1&query2=q2')
    expect(mockServer.for('/test1/:p1', 'POST').header('X-test1')).to.equal('h1')
    expect(mockServer.for('/test1/:p1', 'POST').header('X-test2')).to.equal('h2')
    expect(mockServer.for('/test1/:p1', 'POST').header('X-test3')).to.equal(undefined)
    expect(mockServer.for('/test1/:p1', 'POST').cookie('cookie1')).to.equal('c1')
    expect(mockServer.for('/test1/:p1', 'POST').cookie('cookie2')).to.equal('c2')
    expect(mockServer.for('/test1/:p1', 'POST').cookie('cookie3')).to.equal(undefined)
    expect(mockServer.for('/test1/:p1', 'POST').query('query1')).to.equal('q1')
    expect(mockServer.for('/test1/:p1', 'POST').query('query2')).to.equal('q2')
    expect(mockServer.for('/test1/:p1', 'POST').query('query3')).to.equal(undefined)
    expect(mockServer.for('/test1/:p1', 'POST').body()).to.equal('inputBody')

    expect(mockServer.name('test rule 1').invocations()).to.equal(1)
    expect(mockServer.name('test rule 2').invocations()).to.equal(0)
  } finally {
    await mockServer.stop()
  }
}

test()
