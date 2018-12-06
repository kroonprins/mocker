import chai from 'chai'
import chaiString from 'chai-string'
import portastic from 'portastic'
import axios from 'axios'
import { initialize as setDefaultConfig } from '@kroonprins/mocker-shared-lib/config-default'
import { initialize as setDefaultConfigMockServer } from '../src/config-default'
import { MockServer } from '../src/mock-server'
import { config } from '@kroonprins/mocker-shared-lib/config'

const expect = chai.expect
chai.use(chaiString)

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    const projectFileLocation = './test/resources/projects/tests.yaml'

    config
      .registerProperty('logging.level.startup', 'debug')
      .registerProperty('project.location', projectFileLocation)

    setDefaultConfig()
    setDefaultConfigMockServer()

    const availablePort = (await portastic.find({
      min: 40000,
      max: 50000,
      retrieve: 1
    }))[0]

    const mockServer = new MockServer(availablePort, 'localhost', 'test_glob')
    try {
      mockServer.start()

      // Test the health check
      const MAX_TRIES = 10
      let numberOfTries = 0
      while (true) {
        try {
          const response = await axios.get(`http://localhost:${availablePort}/mockserver-health`)
          if (response.data === 'OK') {
            break
          }
        } catch (e) { }
        if (numberOfTries++ > MAX_TRIES) {
          throw new Error('The mock server does not seem to have started.')
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const responseRule1 = await axios.get(`http://localhost:${availablePort}/hello1/2?q=test`)
      expect(responseRule1.status).to.be.equal(200)
      expect(responseRule1.data.respo).to.be.equal('Test rule 1: test / 2')
      expect(responseRule1.headers['content-type']).to.startsWith('application/json')
      expect(responseRule1.headers['x-powered-by']).to.be.equal('mocker')
      expect(responseRule1.headers['x-positivo']).to.be.equal('jawohl')
      expect(responseRule1.headers['x-zeker']).to.be.equal('klahr')
      expect(responseRule1.headers['x-yup']).to.be.equal('test')
      expect(responseRule1.headers['set-cookie'][0]).to.be.equal('koekske=jummie; Path=/; Secure')
      expect(responseRule1.headers['set-cookie'][1]).to.be.equal('only=http; Path=/; HttpOnly')

      let exceptionThrownBecauseIdGreaterThanFive = false
      try {
        await axios.get(`http://localhost:${availablePort}/hello1/6?q=test2`)
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data.respo).to.be.equal('Test rule 1: test2 / 6')
        expect(e.response.headers['x-yup']).to.be.equal('test2')
        exceptionThrownBecauseIdGreaterThanFive = true
      }
      expect(exceptionThrownBecauseIdGreaterThanFive).to.be.equal(true)

      const startTimeRule2 = (new Date()).getTime()
      const responseRule2 = await axios.put(`http://localhost:${availablePort}/hello2`, {
        input: 'testRule2'
      })
      const durationRule2 = (new Date()).getTime() - startTimeRule2
      expect(responseRule2.status).to.be.equal(200)
      expect(responseRule2.data.respo).to.be.equal('Test rule 2: testRule2')
      expect(responseRule2.headers['content-type']).to.startsWith('application/json')
      expect(durationRule2).to.be.above(2000)
      expect(durationRule2).to.be.below(3000)

      const startTimeRule3 = (new Date()).getTime()
      const responseRule3 = await axios.get(`http://localhost:${availablePort}/hello3/d`)
      const durationRule3 = (new Date()).getTime() - startTimeRule3
      expect(responseRule3.status).to.be.equal(200)
      expect(responseRule3.data.respo).to.be.equal('Test rule 3: {{req.query.q}} / {{req.params.id}}')
      expect(responseRule3.headers['x-yup']).to.be.equal('{{req.query.q}}')
      expect(durationRule3).to.be.above(1000)
      expect(durationRule3).to.be.below(3200)

      const startTimeRule4 = (new Date()).getTime()
      const responseRule4 = await axios.get(`http://localhost:${availablePort}/templated-fixed-latency`)
      const durationRule4 = (new Date()).getTime() - startTimeRule4
      expect(responseRule4.status).to.be.equal(200)
      expect(responseRule4.data).to.be.equal('templated fixed latency')
      expect(durationRule4).to.be.above(2000)
      expect(durationRule4).to.be.below(3000)

      const startTimeRule5 = (new Date()).getTime()
      const responseRule5 = await axios.get(`http://localhost:${availablePort}/templated-random-latency`)
      const durationRule5 = (new Date()).getTime() - startTimeRule5
      expect(responseRule5.status).to.be.equal(200)
      expect(responseRule5.data).to.be.equal('templated random latency')
      expect(durationRule5).to.be.above(1000)
      expect(durationRule5).to.be.below(3200)

      let exceptionThrownBecauseNoMethodMatch = false
      try {
        await axios.post(`http://localhost:${availablePort}/hello3/d`)
      } catch (e) {
        expect(e.response.status).to.be.equal(404)
        exceptionThrownBecauseNoMethodMatch = true
      }
      expect(exceptionThrownBecauseNoMethodMatch).to.be.equal(true)
    } finally {
      await mockServer.stop()
    }

    const mockServerForEncodingTest = new MockServer(availablePort, 'localhost', 'test_encoding')
    try {
      await mockServerForEncodingTest.start()

      const responseGzip = await axios.get(`http://localhost:${availablePort}/gzip`)
      expect(responseGzip.status).to.be.equal(200)
      expect(responseGzip.data.respo).to.be.equal('gzip content')
      expect(responseGzip.headers['content-type']).to.startsWith('application/json')
      expect(responseGzip.headers['x-yup']).to.be.equal('bla')
      // expect(responseGzip.headers['content-encoding']).to.be.equal('gzip') // axios seems to remove the header

      const responseDeflate = await axios.get(`http://localhost:${availablePort}/deflate`)
      expect(responseDeflate.status).to.be.equal(200)
      expect(responseDeflate.data.respo).to.be.equal('deflate content')
      expect(responseDeflate.headers['content-type']).to.startsWith('application/json')
      expect(responseDeflate.headers['x-yup']).to.be.equal('bla')
      // expect(responseDeflate.headers['content-encoding']).to.be.equal('deflate') // axios seems to remove the header

      const responseUnsupported = await axios.get(`http://localhost:${availablePort}/unsupported`)
      expect(responseUnsupported.status).to.be.equal(200)
      expect(responseUnsupported.data.respo).to.be.equal('unsupported content')
      expect(responseUnsupported.headers['content-type']).to.startsWith('application/json')
      expect(responseUnsupported.headers['x-yup']).to.be.equal('bla')
      expect(responseUnsupported.headers['content-encoding']).to.be.equal(undefined)
    } finally {
      await mockServerForEncodingTest.stop()
    }

    const mockServerForConditionalResponseTest = new MockServer(availablePort, 'localhost', 'test_conditional_response')
    try {
      await mockServerForConditionalResponseTest.start()

      const response1 = await axios.get(`http://localhost:${availablePort}/conditional/10?q=11`)
      expect(response1.status).to.be.equal(200)
      expect(response1.data).to.deep.equal({
        message: 'This request is very good'
      })
      expect(response1.headers['content-type']).to.startsWith('application/json')
      expect(response1.headers['x-header']).to.be.equal('11')

      let exceptionThrownBecauseHttp400 = false
      try {
        await axios.get(`http://localhost:${availablePort}/conditional/3?q=5`)
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data).to.equal('This request is very bad')
        expect(e.response.headers['content-type']).to.startsWith('text/plain')
        expect(e.response.headers['x-header']).to.be.equal(undefined)
        exceptionThrownBecauseHttp400 = true
      }
      expect(exceptionThrownBecauseHttp400).to.be.equal(true)

      let exceptionThrownBecauseHttp500 = false
      try {
        await axios.get(`http://localhost:${availablePort}/conditional/blabla?q=5`)
      } catch (e) {
        expect(e.response.status).to.be.equal(500)
        expect(e.response.data).to.deep.equal({
          message: 'This request is the worst'
        })
        expect(e.response.headers['content-type']).to.startsWith('application/json')
        expect(e.response.headers['x-header']).to.be.equal(undefined)
        exceptionThrownBecauseHttp500 = true
      }
      expect(exceptionThrownBecauseHttp500).to.be.equal(true)

      const startTimeConditionalResponseWithLatency1 = (new Date()).getTime()
      const conditionalResponseWithLatency1 = await axios.get(`http://localhost:${availablePort}/conditional-with-latency/10?q=11`)
      const durationConditionalResponseWithLatency1 = (new Date()).getTime() - startTimeConditionalResponseWithLatency1
      expect(conditionalResponseWithLatency1.status).to.be.equal(200)
      expect(conditionalResponseWithLatency1.data).to.deep.equal({
        message: 'This request is very good and very fixed'
      })
      expect(conditionalResponseWithLatency1.headers['content-type']).to.startsWith('application/json')
      expect(conditionalResponseWithLatency1.headers['x-header']).to.be.equal('11')
      expect(durationConditionalResponseWithLatency1).to.be.above(2000)
      expect(durationConditionalResponseWithLatency1).to.be.below(3000)

      const startTimeConditionalResponseWithLatency2 = (new Date()).getTime()
      const conditionalResponseWithLatency2 = await axios.get(`http://localhost:${availablePort}/conditional-with-latency/3?q=5`)
      const durationConditionalResponseWithLatency2 = (new Date()).getTime() - startTimeConditionalResponseWithLatency2
      expect(conditionalResponseWithLatency2.status).to.be.equal(200)
      expect(conditionalResponseWithLatency2.data).to.equal('This request is also good but a bit random')
      expect(conditionalResponseWithLatency2.headers['content-type']).to.startsWith('text/plain')
      expect(durationConditionalResponseWithLatency2).to.be.above(500)
      expect(durationConditionalResponseWithLatency2).to.be.below(1600)

      const startTimeConditionalResponseWithLatency3 = (new Date()).getTime()
      const conditionalResponseWithLatency3 = await axios.get(`http://localhost:${availablePort}/conditional-with-latency/blabla?q=5`)
      const durationConditionalResponseWithLatency3 = (new Date()).getTime() - startTimeConditionalResponseWithLatency3
      expect(conditionalResponseWithLatency3.status).to.be.equal(200)
      expect(conditionalResponseWithLatency3.data).to.deep.equal({
        message: 'This request is the best and very quick'
      })
      expect(conditionalResponseWithLatency3.headers['content-type']).to.startsWith('application/json')
      expect(durationConditionalResponseWithLatency3).to.be.above(10)
      expect(durationConditionalResponseWithLatency3).to.be.below(300)
    } finally {
      await mockServerForConditionalResponseTest.stop()
    }
  } finally {
    config.reset()
  }
}

export {
  test
}
